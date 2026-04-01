import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createHash, createPrivateKey, createPublicKey, randomInt, randomUUID } from "node:crypto";
import amqp from "amqplib";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import {
  eventTopics,
  forgotPasswordSchema,
  loginSchema,
  otpSchema,
  resetPasswordSchema,
  signupSchema,
  updateUserRoleSchema,
  type SignupInput,
  type LoginInput,
  type OtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type UpdateUserRoleInput,
} from "@ai-loan/contracts";
import { createPool, runMigrations, withTransaction, checkHealth } from "@ai-loan/db";

const env = loadEnv(
  "auth-service",
  z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4001),
    AUTH_DATABASE_URL: z.string(),
    RABBITMQ_URL: z.string(),
    JWT_PRIVATE_KEY_BASE64: z.string(),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    JWT_ACCESS_TTL_MINUTES: z.coerce.number().default(15),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),
    OTP_PEPPER: z.string().min(32, "OTP_PEPPER must be at least 32 characters"),
    ENABLE_ADMIN_BOOTSTRAP: z.coerce.boolean().default(false),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().optional(),
  }),
);

const logger = createLogger("auth-service");
const app = express();
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);

const pool = createPool(env.AUTH_DATABASE_URL, "auth-service");

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    rotated_from UUID,
    replaced_by UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;`,
  `ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;`,
  `ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;`,
  `ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;`,
];

let channel: amqp.Channel | undefined;
const exchangeName = "platform.events";

const privateKey = createPrivateKey(decodeBase64Pem(env.JWT_PRIVATE_KEY_BASE64));
const publicKey = createPublicKey(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectAmqpWithRetry(url: string, label: string) {
  while (true) {
    try {
      const connection = await amqp.connect(url);
      connection.on("error", (error) => {
        logger.error({ error }, "RabbitMQ connection error - terminating for restart");
        process.exit(1);
      });
      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed - terminating for restart");
        process.exit(1);
      });
      return connection;
    } catch (error) {
      logger.error({ error, label }, `Connection to ${label} failed during startup. Retrying in 2 seconds.`);
      await delay(2000);
    }
  }
}

async function hashOtp(email: string, otp: string): Promise<string> {
  const salt = createHash("sha256").update(email).digest("hex");
  const iterations = 1000;
  const keylen = 32;
  const { pbkdf2 } = await import("node:crypto");
  
  return new Promise((resolve, reject) => {
    pbkdf2(otp, `${salt}:${env.OTP_PEPPER}`, iterations, keylen, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

function generateOtp(): string {
  return `${randomInt(100000, 999999)}`;
}

async function compareOtp(email: string, providedOtp: string, storedHashHex: string): Promise<boolean> {
  const providedHashHex = await hashOtp(email, providedOtp);
  const storedBuffer = Buffer.from(storedHashHex);
  const candidateBuffer = Buffer.from(providedHashHex);
  if (storedBuffer.length !== candidateBuffer.length) return false;
  const { timingSafeEqual } = await import("node:crypto");
  return timingSafeEqual(storedBuffer, candidateBuffer);
}

async function publish(topic: string, payload: any): Promise<void> {
  if (!channel) return;
  channel.publish(exchangeName, topic, Buffer.from(JSON.stringify(payload)), {
    contentType: "application/json",
    persistent: true,
  });
}

async function authenticateInternal(req: any, res: Response, next: any) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    const token = header.replace("Bearer ", "");
    const verified = await jwtVerify(token, publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (verified.payload.tokenType !== "access") {
      return res.status(401).json({ error: "Invalid access token." });
    }

    req.user = {
      id: verified.payload.sub as string,
      tenantId: verified.payload.tenantId as string,
      email: verified.payload.email as string,
      role: verified.payload.role as string,
    };
    return next();
  } catch (error) {
    logger.error({ error }, "Internal authentication failure");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

async function audit(userId: string | null, action: string, metadata: any = {}): Promise<void> {
  await pool.query(
    `INSERT INTO auth_audit_logs (id, user_id, action, metadata) VALUES ($1, $2, $3, $4::jsonb)`,
    [randomUUID(), userId, action, JSON.stringify(metadata)],
  );
}

interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiresInMinutes: number;
}

async function signTokens(user: { id: string; email: string; role: string }, familyId: string = randomUUID()): Promise<UserTokens> {
  const accessJti = randomUUID();
  const refreshJti = randomUUID();
  const accessToken = await new SignJWT({
    email: user.email,
    role: user.role,
    tenantId: user.id,
    tokenType: "access",
    jti: accessJti,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(user.id)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_MINUTES}m`)
    .sign(privateKey);

  const refreshToken = await new SignJWT({
    email: user.email,
    role: user.role,
    tenantId: user.id,
    tokenType: "refresh",
    familyId,
    jti: refreshJti,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(user.id)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_REFRESH_TTL_DAYS}d`)
    .sign(privateKey);

  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, family_id, expires_at) VALUES ($1, $2, $3, $4)`,
    [refreshJti, user.id, familyId, expiresAt],
  );

  return {
    accessToken,
    refreshToken,
    expiresInMinutes: env.JWT_ACCESS_TTL_MINUTES,
  };
}

async function createOtpRecord(tableName: string, userId: string, email: string): Promise<{ otp: string; expiresAt: Date }> {
  const VALID_TABLES = ['email_otps', 'password_reset_tokens'];
  if (!VALID_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otpHash = await hashOtp(email, otp);
  await pool.query(
    `INSERT INTO ${tableName} (id, user_id, otp_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), userId, otpHash, expiresAt],
  );
  return { otp, expiresAt };
}

async function getUserByEmail(email: string): Promise<any | null> {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
  return result.rows[0] || null;
}

app.get("/health", async (_req: Request, res: Response) => {
  const health = await checkHealth(pool, { rabbitmqUrl: env.RABBITMQ_URL });
  res.status(health.status === "ok" ? 200 : 503).json({ 
    ...health, 
    service: "auth-service",
    timestamp: new Date().toISOString()
  });
});

app.get("/auth/public-key", async (_req: Request, res: Response) => {
  res.type("text/plain").send(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));
});

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const payload: SignupInput = signupSchema.parse(req.body);
    const existing = await getUserByEmail(payload.email);
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists." });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(payload.password, 12);

    await withTransaction(pool, async (client) => {
      await client.query(
        `INSERT INTO users (id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'USER')`,
        [userId, payload.fullName, payload.email.toLowerCase(), passwordHash],
      );
    });

    const { otp, expiresAt } = await createOtpRecord("email_otps", userId, payload.email);
    await publish(eventTopics.USER_REGISTERED, {
      userId,
      tenantId: userId,
      email: payload.email.toLowerCase(),
      fullName: payload.fullName,
      otp,
      expiresAt: expiresAt.toISOString(),
    });
    await audit(userId, "signup.requested", { email: payload.email.toLowerCase() });

    res.status(201).json({
      message: "Account created. Verify your email to activate the workspace.",
      userId,
      verificationRequired: true,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "User signup failed");
    res.status(500).json({ error: "Unable to create account." });
  }
});

app.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const payload: OtpInput = otpSchema.parse(req.body);
    const user = await getUserByEmail(payload.email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const result = await pool.query(
      `SELECT * FROM email_otps
       WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );
    const otpRecord = result.rows[0];

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    if (otpRecord.locked_until && new Date(otpRecord.locked_until) > new Date()) {
      return res.status(429).json({ error: "Too many failed attempts. Try again later." });
    }

    const isMatch = await compareOtp(payload.email, payload.otp, otpRecord.otp_hash);
    if (!isMatch) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await pool.query(
        `UPDATE email_otps SET attempts = $1, locked_until = $2 WHERE id = $3`,
        [newAttempts, lockedUntil, otpRecord.id]
      );
      await audit(user.id, "email.verify.failed", { attempts: newAttempts, locked: !!lockedUntil });
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    await withTransaction(pool, async (client) => {
      await client.query(`UPDATE email_otps SET consumed_at = NOW() WHERE id = $1`, [otpRecord.id]);
      await client.query(`UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1`, [
        user.id,
      ]);
    });

    await publish(eventTopics.USER_VERIFIED, {
      userId: user.id,
      tenantId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });
    await audit(user.id, "email.verified");

    res.json({ message: "Email verified. You can now sign in." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "Email verification failed");
    res.status(500).json({ error: "Unable to verify email." });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const payload: LoginInput = loginSchema.parse(req.body);
    const user = await getUserByEmail(payload.email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const passwordMatch = await bcrypt.compare(payload.password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    if (!user.email_verified_at) {
      return res.status(403).json({ error: "Verify your email before logging in." });
    }

    const tokens = await signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    await audit(user.id, "login.success");

    res.json({
      user: {
        id: user.id,
        tenantId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "Login sequence failed");
    res.status(500).json({ error: "Unable to sign in." });
  }
});

app.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token." });
    }

    const verified = await jwtVerify(refreshToken, publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (verified.payload.tokenType !== "refresh") {
      return res.status(400).json({ error: "Invalid refresh token." });
    }

    const tokenId = verified.payload.jti;
    const refreshedTokens = await withTransaction(pool, async (client) => {
      const tokenRow = (
        await client.query(
          `SELECT * FROM refresh_tokens WHERE id = $1 FOR UPDATE`,
          [tokenId],
        )
      ).rows[0];

      if (!tokenRow || tokenRow.revoked_at || tokenRow.replaced_by || new Date(tokenRow.expires_at) <= new Date()) {
        throw new Error("REFRESH_TOKEN_REVOKED");
      }

      const user = (
        await client.query(`SELECT id, email, role FROM users WHERE id = $1 AND email_verified_at IS NOT NULL`, [
          verified.payload.sub,
        ])
      ).rows[0];

      if (!user) {
        throw new Error("REFRESH_USER_NOT_FOUND");
      }

      const accessJti = randomUUID();
      const newRefreshJti = randomUUID();
      const accessToken = await new SignJWT({
        email: user.email,
        role: user.role,
        tenantId: user.id,
        tokenType: "access",
        jti: accessJti,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject(user.id)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${env.JWT_ACCESS_TTL_MINUTES}m`)
        .sign(privateKey);

      const refreshTokenValue = await new SignJWT({
        email: user.email,
        role: user.role,
        tenantId: user.id,
        tokenType: "refresh",
        familyId: tokenRow.family_id,
        jti: newRefreshJti,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject(user.id)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${env.JWT_REFRESH_TTL_DAYS}d`)
        .sign(privateKey);

      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO refresh_tokens (id, user_id, family_id, rotated_from, expires_at) VALUES ($1, $2, $3, $4, $5)`,
        [newRefreshJti, user.id, tokenRow.family_id, tokenId, expiresAt],
      );
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = $2 WHERE id = $1`,
        [tokenId, newRefreshJti],
      );

      return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresInMinutes: env.JWT_ACCESS_TTL_MINUTES,
      };
    });

    res.json(refreshedTokens);
  } catch (error) {
    logger.error({ error }, "Token refresh attempt failed");
    if ((error as Error).message === "REFRESH_TOKEN_REVOKED") {
      return res.status(401).json({ error: "Refresh token has been revoked." });
    }
    if ((error as Error).message === "REFRESH_USER_NOT_FOUND") {
      return res.status(401).json({ error: "User not found." });
    }
    res.status(401).json({ error: "Unable to refresh session." });
  }
});

app.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) {
      return res.json({ loggedOut: true }); // Graceful if nothing to revoke
    }

    const verified = await jwtVerify(refreshToken, publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }).catch(() => null);

    if (verified && verified.payload.jti) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
        [verified.payload.jti]
      );
      await audit(verified.payload.sub as string, "logout.success", { jti: verified.payload.jti });
    }

    res.json({ loggedOut: true });
  } catch (error) {
    logger.error({ error }, "Logout error - continuing with graceful fallback");
    res.json({ loggedOut: true }); // Always return success for client security
  }
});

app.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const payload: ForgotPasswordInput = forgotPasswordSchema.parse(req.body);
    const user = await getUserByEmail(payload.email);
    if (!user) {
      return res.json({ message: "If the account exists, a reset OTP has been sent." });
    }

    const { otp, expiresAt } = await createOtpRecord("password_reset_tokens", user.id, payload.email);
    await publish(eventTopics.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      tenantId: user.id,
      email: user.email,
      fullName: user.full_name,
      otp,
      expiresAt: expiresAt.toISOString(),
    });
    await audit(user.id, "password.reset.requested");

    res.json({ message: "If the account exists, a reset OTP has been sent." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "Forgot password initiation failed");
    res.status(500).json({ error: "Unable to start password reset." });
  }
});

app.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const payload: ResetPasswordInput = resetPasswordSchema.parse(req.body);
    const user = await getUserByEmail(payload.email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );
    const otpRecord = result.rows[0];

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    if (otpRecord.locked_until && new Date(otpRecord.locked_until) > new Date()) {
      return res.status(429).json({ error: "Too many failed attempts. Try again later." });
    }

    const isMatch = await compareOtp(payload.email, payload.otp, otpRecord.otp_hash);
    if (!isMatch) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await pool.query(
        `UPDATE password_reset_tokens SET attempts = $1, locked_until = $2 WHERE id = $3`,
        [newAttempts, lockedUntil, otpRecord.id]
      );
      await audit(user.id, "password.reset.failed", { attempts: newAttempts, locked: !!lockedUntil });
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);
    await withTransaction(pool, async (client) => {
      await client.query(`UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = $1`, [otpRecord.id]);
      await client.query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
        user.id,
        passwordHash,
      ]);
      await client.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [
        user.id,
      ]);
    });

    await audit(user.id, "password.reset.completed");
    res.json({ message: "Password updated successfully." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "Password reset sequence failed");
    res.status(500).json({ error: "Unable to reset password." });
  }
});

app.get("/auth/users/:userId", authenticateInternal, async (req: any, res: Response) => {
  if (req.user.role !== "ADMIN" && req.user.id !== req.params.userId) {
    return res.status(403).json({ error: "Forbidden. Access restricted to own profile or admins." });
  }
  const result = await pool.query(
    `SELECT id, full_name, email, role, email_verified_at, created_at FROM users WHERE id = $1`,
    [req.params.userId],
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  res.json({
    id: user.id,
    tenantId: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
  });
});

app.get("/internal/users", authenticateInternal, async (req: any, res: Response) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden. Admin role required." });
  }
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, email_verified_at, created_at FROM users ORDER BY created_at DESC`,
    );
    res.json(result.rows.map((user: any) => ({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
    })));
  } catch (error) {
    logger.error({ error }, "Internal users list fetch failed");
    res.status(500).json({ error: "Unable to load users." });
  }
});

app.patch("/internal/users/:userId/role", authenticateInternal, async (req: any, res: Response) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden. Admin role required." });
  }
  try {
    const payload: UpdateUserRoleInput = updateUserRoleSchema.parse(req.body);
    const { userId } = req.params;

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, role`,
      [payload.role, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    await audit(req.user.id, "user.role.updated", { targetUserId: userId, newRole: payload.role });

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ error: error.flatten() });
    }
    logger.error({ error }, "User role update failed");
    res.status(500).json({ error: "Unable to update user role." });
  }
});

async function start() {
  await runMigrations(pool, migrations);
  if (env.NODE_ENV !== "production" && env.ENABLE_ADMIN_BOOTSTRAP && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const existingAdmin = await getUserByEmail(env.ADMIN_EMAIL);
    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, email_verified_at)
         VALUES ($1, $2, $3, $4, 'ADMIN', NOW())`,
        [randomUUID(), "Platform Admin", env.ADMIN_EMAIL, adminPasswordHash],
      );
    }
  }
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Auth service operational");
  });
}

start().catch((error) => {
  logger.error({ error }, "Core bootstrap failure - process terminating");
  process.exit(1);
});
