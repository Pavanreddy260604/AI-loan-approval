import express, { Request, Response, NextFunction } from "express";
import amqp from "amqplib";
import nodemailer from "nodemailer";
import { jwtVerify } from "jose";
import { createPublicKey, type KeyObject } from "node:crypto";
import { z } from "zod";
import { decodeBase64Pem, loadEnv, createLogger } from "@ai-loan/config";
import { eventTopics } from "@ai-loan/contracts";
import { createPool, initNotificationsTable } from "./db";

const env = loadEnv(
  "notification-service",
  z.object({
    PORT: z.coerce.number().default(4005),
    RABBITMQ_URL: z.string(),
    DATABASE_URL: z.string(),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email(),
    SMTP_SECURE: z.string().default("false").transform((v) => v === "true"),
    JWT_PUBLIC_KEY_BASE64: z.string(),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    PUBLIC_APP_URL: z.string().default("http://localhost:5175"),
  }),
);

const logger = createLogger("notification-service");
const app = express();
const exchangeName = "platform.events";
const publicKey: KeyObject = createPublicKey(decodeBase64Pem(env.JWT_PUBLIC_KEY_BASE64));

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

const transporterParams: any = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
  auth: (env.SMTP_USER && (env.SMTP_PASS || env.SMTP_PASSWORD)) 
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS || env.SMTP_PASSWORD } 
    : undefined,
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
};

if (env.SMTP_PORT === 587) {
  transporterParams.requireTLS = true;
}

const transporter = nodemailer.createTransport(transporterParams);
const pool = createPool(env.DATABASE_URL);

app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "notification-service",
    timestamp: new Date().toISOString(),
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER ? "configured" : "missing",
      from: env.SMTP_FROM
    }
  });
});

async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      userId: verified.payload.sub as string,
      tenantId: verified.payload.tenantId as string,
      email: verified.payload.email as string,
      role: verified.payload.role as string,
    };
    return next();
  } catch (error) {
    logger.error({ error }, "Token verification failed");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

async function authenticateInternal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      userId: verified.payload.sub as string,
      tenantId: verified.payload.tenantId as string,
      email: verified.payload.email as string,
      role: verified.payload.role as string,
    };
    return next();
  } catch (error) {
    logger.error({ error }, "Internal auth verification failed");
    return res.status(401).json({ error: "Unauthorized." });
  }
}

app.use("/internal", authenticateInternal);

app.post("/internal/test-email", express.json(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden." });
    }
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Missing 'to' field" });
    
    await sendMail({ to, ...createTestEmail(to) });
    
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error: any) {
    logger.error({ error, to: req.body?.to }, "SMTP integration test sequence failed");
    res.status(500).json({ error: "SMTP Delivery Failed", details: error.message });
  }
});

// Notification API Endpoints

// GET /api/v1/notifications - Get user's notifications
app.get("/api/v1/notifications", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unread === "true";
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let query = "SELECT * FROM notifications WHERE user_id = $1";
    const params: any[] = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      query += ` AND read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadResult = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
      [userId]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
      pagination: { limit, offset, total: result.rowCount }
    });
  } catch (error: any) {
    logger.error({ error, userId: req.user!.userId }, "Failed to fetch notifications");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/v1/notifications/unread-count - Get unread count only
app.get("/api/v1/notifications/unread-count", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
      [userId]
    );
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error: any) {
    logger.error({ error, userId: req.user!.userId }, "Failed to fetch unread count");
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// POST /api/v1/notifications - Create notification (internal use)
app.post("/api/v1/notifications", authenticateInternal, express.json(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, tenantId, type, title, message, link } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: "Missing required fields: userId, type, title, message" });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, tenant_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, tenantId || null, type, title, message, link || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    logger.error({ error }, "Failed to create notification");
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// PATCH /api/v1/notifications/:id/read - Mark as read
app.patch("/api/v1/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const result = await pool.query(
      `UPDATE notifications SET read = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error({ error, notificationId: req.params.id }, "Failed to mark notification as read");
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// PATCH /api/v1/notifications/mark-all-read - Mark all as read
app.patch("/api/v1/notifications/mark-all-read", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    await pool.query(
      "UPDATE notifications SET read = TRUE, updated_at = NOW() WHERE user_id = $1 AND read = FALSE",
      [userId]
    );

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error, userId: req.user!.userId }, "Failed to mark all notifications as read");
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// DELETE /api/v1/notifications/:id - Delete notification
app.delete("/api/v1/notifications/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    const result = await pool.query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error, notificationId: req.params.id }, "Failed to delete notification");
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEmailDate(value: unknown): string {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) {
    return String(value ?? "shortly");
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderEmailShell({
  preheader,
  title,
  intro,
  eyebrow,
  panelHtml,
  detailHtml = "",
  footerNote,
  recipientName,
}: {
  preheader: string;
  title: string;
  intro: string;
  eyebrow: string;
  panelHtml: string;
  detailHtml?: string;
  footerNote: string;
  recipientName?: string;
}): string {
  const safePreheader = escapeHtml(preheader);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooter = escapeHtml(footerNote);
  const safeRecipient = recipientName ? escapeHtml(recipientName) : "";
  const greeting = safeRecipient ? `Hi ${safeRecipient},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px 16px !important; }
      .card { border-radius: 16px !important; }
      .content { padding: 28px 20px !important; }
      .title { font-size: 24px !important; }
      .eyebrow { font-size: 10px !important; }
    }
    [data-ogsc] .dark-bg { background-color: #09090b !important; }
    [data-ogsc] .card-bg { background-color: #18181b !important; }
    [data-ogsc] .text-primary { color: #fafafa !important; }
    [data-ogsc] .text-secondary { color: #a1a1aa !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;color:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <!-- Preview Text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}</div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:0;">
        
        <!-- Full Width Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%;max-width:100%;">
          
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width:40px;height:40px;background-color:#486581;border-radius:10px;text-align:center;vertical-align:middle;">
                    <!-- Lightning Bolt SVG -->
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                      <path d="M13 2L4.09 12.11C3.89 12.35 3.78 12.65 3.78 12.96C3.78 13.6 4.3 14.12 4.94 14.12H11V22L19.91 11.89C20.11 11.65 20.22 11.35 20.22 11.04C20.22 10.4 19.7 9.88 19.06 9.88H13V2Z" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="padding-left:12px;">
                    <div style="font-size:18px;font-weight:800;color:#fafafa;letter-spacing:-0.02em;text-transform:uppercase;">Originate</div>
                    <div style="font-size:10px;font-weight:600;color:#829ab1;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">Intelligence Layer</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#1e293b;border-bottom:1px solid #334155;overflow:hidden;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Top Accent Bar -->
                <tr>
                  <td style="height:4px;background-color:#486581;font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:48px 64px 40px;">
                    
                    <!-- Eyebrow -->
                    <div class="eyebrow" style="font-size:11px;font-weight:700;color:#829ab1;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">${safeEyebrow}</div>
                    
                    <!-- Title -->
                    <h1 class="title" style="margin:0 0 16px;font-size:28px;font-weight:700;color:#fafafa;letter-spacing:-0.02em;line-height:1.2;">${safeTitle}</h1>
                    
                    <!-- Greeting -->
                    <p style="margin:0 0 16px;font-size:15px;font-weight:500;color:#d4d4d8;">${greeting}</p>
                    
                    <!-- Intro -->
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a1a1aa;">${safeIntro}</p>
                    
                    <!-- Panel (OTP/Code Section) -->
                    ${panelHtml}
                    
                    <!-- Detail Section -->
                    ${detailHtml}

                  </td>
                </tr>

                <!-- Footer within Card -->
                <tr>
                  <td style="padding:24px 64px;background-color:#0f172a;border-top:1px solid #334155;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">${safeFooter}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Section -->
          <tr>
            <td style="padding:32px 64px;text-align:left;">
              <!-- Help Links -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 16px;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="${env.PUBLIC_APP_URL}/help" style="text-decoration:none;color:#71717a;font-size:12px;font-weight:500;">Help Center</a>
                  </td>
                  <td style="color:#3f3f46;font-size:12px;">|</td>
                  <td style="padding:0 8px;">
                    <a href="${env.PUBLIC_APP_URL}/privacy" style="text-decoration:none;color:#71717a;font-size:12px;font-weight:500;">Privacy</a>
                  </td>
                  <td style="color:#3f3f46;font-size:12px;">|</td>
                  <td style="padding:0 8px;">
                    <a href="${env.PUBLIC_APP_URL}/settings/notifications" style="text-decoration:none;color:#71717a;font-size:12px;font-weight:500;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 8px;font-size:12px;color:#52525b;">This email was sent to you by <strong style="color:#a1a1aa;">Originate</strong></p>
              <p style="margin:0 0 16px;font-size:11px;color:#3f3f46;">&copy; ${new Date().getFullYear()} Originate. All rights reserved.</p>
              
              <!-- Trust Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:8px 12px;background-color:#18181b;border-radius:6px;">
                    <span style="font-size:11px;color:#52525b;">🔒 Secured by Originate</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function createOtpEmail(kind: "verify" | "reset", payload: { fullName?: string; otp: string; expiresAt: string }): EmailContent {
  const recipientName = payload.fullName?.trim();
  const action = kind === "verify" ? "Email verification" : "Password reset";
  const intro = kind === "verify"
    ? "Use the code below to verify your email address and complete your account setup."
    : "Use the code below to continue with your password reset request.";
  const subject = kind === "verify"
    ? "Verify your Originate account"
    : "Reset your Originate password";
  const expiryLabel = formatEmailDate(payload.expiresAt);
  
  const panelHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#1e293b;border:1px solid #334155;margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:40px 64px;text-align:center;">
          <div style="font-size:11px;font-weight:600;color:#829ab1;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:20px;text-align:center;">Verification Code</div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="background-color:#486581;border-radius:12px;padding:20px 40px;text-align:center;">
                <div style="font-size:40px;font-weight:800;color:#ffffff;letter-spacing:0.3em;font-family:'SF Mono',Monaco,'Cascadia Code','Roboto Mono',Consolas,'Courier New',monospace;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,0.2);">${escapeHtml(payload.otp)}</div>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;text-align:center;">⏱️ Expires <strong style="color:#d4d4d8;">${escapeHtml(expiryLabel)}</strong></p>
        </td>
      </tr>
    </table>`;
    
  const detailHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;border:1px solid #334155;">
      <tr>
        <td style="padding:24px 64px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
            Enter this code in the Originate app to complete your request. If you didn't initiate this action, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject,
    html: renderEmailShell({
      preheader: `${action} with code ${payload.otp}`,
      eyebrow: action,
      title: kind === "verify" ? "Verify your email address" : "Reset your password",
      intro,
      panelHtml,
      detailHtml,
      footerNote: "This code was sent in response to a request from your account. If you did not request this, no action is needed.",
      recipientName,
    }),
    text: `Originate\n\n${kind === "verify" ? "Verify your email address" : "Password reset code"}\n\nCode: ${payload.otp}\nExpires: ${expiryLabel}\n\n${kind === "verify" ? "Enter this code in the app to verify your account." : "Enter this code in the app to reset your password."}\nIf you did not initiate this action, you can ignore this email.`,
  };
}

function createTrainingCompletedEmail(payload: { championModelFamily?: string; email?: string }): EmailContent {
  const modelFamily = payload.championModelFamily?.trim() || "Champion model";
  const recipientName = payload.email ? payload.email.split("@")[0] : undefined;
  
  const panelHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#334155;margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:48px 64px;text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="width:64px;height:64px;background-color:rgba(255,255,255,0.15);border-radius:16px;text-align:center;vertical-align:middle;border:2px solid rgba(255,255,255,0.2);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fill-opacity="0.3"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);letter-spacing:0.15em;text-transform:uppercase;text-align:center;">Model Family</div>
          <div style="margin-top:12px;font-size:32px;line-height:1.2;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.02em;">${escapeHtml(modelFamily)}</div>
          <div style="margin-top:16px;font-size:14px;color:rgba(255,255,255,0.85);text-align:center;font-weight:500;">Training complete. Review performance metrics before deploying.</div>
          
          <!-- CTA Button -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
            <tr>
              <td align="center" style="background-color:#ffffff;border-radius:10px;padding:14px 28px;">
                <a href="${env.PUBLIC_APP_URL}/models" style="text-decoration:none;">
                  <span style="font-size:14px;font-weight:700;color:#486581;letter-spacing:-0.01em;">Review Model</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
    
  const detailHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;border:1px solid #334155;">
      <tr>
        <td style="padding:24px 64px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
            Review the model's performance metrics, validation results, and approval settings before promoting it to production. You can compare versions and roll back if needed.
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject: `Model training complete: ${modelFamily} ready for review`,
    html: renderEmailShell({
      preheader: `${modelFamily} is ready for review`,
      eyebrow: "Training Finished",
      title: "Model ready for review",
      intro: "Your model has completed training. Review the results and metrics before deploying to production.",
      panelHtml,
      detailHtml,
      footerNote: "This notification was sent because you're a workspace administrator or model owner.",
      recipientName,
    }),
    text: `Originate\n\nA new model version is available.\nModel family: ${modelFamily}\n\nReview the model in the Models page before promoting a version.`,
  };
}

function createFraudAlertEmail(payload: { riskBand?: string; email?: string }): EmailContent {
  const riskBand = payload.riskBand?.trim() || "High Risk";
  const recipientName = payload.email ? payload.email.split("@")[0] : undefined;
  const isHighRisk = riskBand.toLowerCase().includes("high") || riskBand.toLowerCase().includes("critical");
  const accentColor = isHighRisk ? "#ef4444" : "#f59e0b";
  
  const panelHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#1e293b;border:2px solid ${escapeHtml(accentColor)};margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:48px 64px;text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="width:64px;height:64px;background-color:${escapeHtml(accentColor)}15;border:2px solid ${escapeHtml(accentColor)}40;border-radius:16px;text-align:center;vertical-align:middle;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                  <path d="M10.29 3.86L1.82 18C1.64543 18.3024 1.55297 18.6453 1.55297 18.9945C1.55297 19.3437 1.64543 19.6866 1.82 19.989C1.9996 20.3002 2.25388 20.565 2.55853 20.7587C2.86318 20.9524 3.20863 21.0686 3.565 21.0975H20.435C20.7914 21.0686 21.1368 20.9524 21.4415 20.7587C21.7461 20.565 22.0004 20.3002 22.18 19.989C22.3546 19.6866 22.447 19.3437 22.447 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.5451 13.2797 3.28137 12.9778 3.09155C12.6759 2.90173 12.3339 2.79163 11.9822 2.77053C11.6305 2.74943 11.2794 2.81799 10.9599 2.97035C10.6404 3.12272 10.3616 3.35439 10.1494 3.64535L10.29 3.86Z" stroke="${escapeHtml(accentColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 9V13" stroke="${escapeHtml(accentColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 17H12.01" stroke="${escapeHtml(accentColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;font-size:11px;font-weight:600;color:#71717a;letter-spacing:0.15em;text-transform:uppercase;text-align:center;">Risk Alert</div>
          <div style="margin-top:12px;font-size:28px;font-weight:800;color:${escapeHtml(accentColor)};text-align:center;letter-spacing:-0.02em;">${escapeHtml(riskBand)}</div>
          <p style="margin:16px auto 0;font-size:14px;color:#94a3b8;text-align:center;max-width:400px;line-height:1.5;">This application requires immediate manual review before approval.</p>
          
          <!-- CTA Button -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
            <tr>
              <td align="center" style="background-color:${escapeHtml(accentColor)};border-radius:10px;padding:14px 28px;box-shadow:0 4px 16px ${escapeHtml(accentColor)}40;">
                <a href="${env.PUBLIC_APP_URL}/review-queue" style="text-decoration:none;">
                  <span style="font-size:14px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Review Application</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
    
  const detailHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;border:1px solid #334155;">
      <tr>
        <td style="padding:24px 64px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
            This application has been flagged for manual review. Please check the dashboard queue to inspect the case details, verify supporting documents, and record your final decision.
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject: `Application flagged: ${riskBand} review required`,
    html: renderEmailShell({
      preheader: `A ${riskBand} loan application requires your review`,
      eyebrow: "Risk Alert",
      title: "Application flagged for review",
      intro: "An application has been flagged based on risk criteria. Please review the case details before making a decision.",
      panelHtml,
      detailHtml,
      footerNote: "This alert was generated based on your configured risk thresholds.",
      recipientName,
    }),
    text: `Originate\n\nA decision requires manual review.\nRisk band: ${riskBand}\n\nOpen the dashboard queue to inspect the case and record the final outcome.`,
  };
}

function createTestEmail(recipient: string): EmailContent {
  const recipientName = recipient.split("@")[0];
  const sentTime = formatEmailDate(new Date().toISOString());
  
  const panelHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#5a855a;margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:48px 64px;text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:16px;text-align:center;vertical-align:middle;border:2px solid rgba(255,255,255,0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                  <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                  <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:0.15em;text-transform:uppercase;text-align:center;">System Status</div>
          <div style="margin-top:12px;font-size:28px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.02em;">Channel Verified</div>
          <div style="margin-top:16px;padding:12px 20px;background-color:rgba(255,255,255,0.15);border-radius:10px;display:inline-block;">
            <p style="margin:0;font-size:13px;color:#ffffff;font-weight:500;text-align:center;">${escapeHtml(recipient)}</p>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);text-align:center;">${escapeHtml(sentTime)}</p>
          </div>
          
          <!-- CTA Button -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
            <tr>
              <td align="center" style="background-color:#ffffff;border-radius:10px;padding:14px 28px;">
                <a href="${env.PUBLIC_APP_URL}/settings/notifications" style="text-decoration:none;">
                  <span style="font-size:14px;font-weight:700;color:#5a855a;letter-spacing:-0.01em;">Manage Settings</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
    
  const detailHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;border:1px solid #334155;">
      <tr>
        <td style="padding:24px 64px;">
          <p style="margin:0;font-size:14px;line-height:1.7;color:#94a3b8;">
            Your notification channel is configured correctly and emails are being delivered. This confirms your SMTP settings are working.
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject: "Originate notification test",
    html: renderEmailShell({
      preheader: "Your notification channel is configured correctly",
      eyebrow: "System Test",
      title: "Notification test passed",
      intro: "Your email notification settings have been verified and are working correctly.",
      panelHtml,
      detailHtml,
      footerNote: "This is an automated test message. You can disable test notifications in your workspace settings.",
      recipientName,
    }),
    text: `Originate\n\nEmail delivery confirmed.\nRecipient: ${recipient}\nSent: ${sentTime}\n\nYour notification channel is configured correctly.`,
  };
}

async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<void> {
  logger.info({ to, subject }, "Dispatching outgoing email");
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  });
  logger.info({ to }, "Email delivery confirmed by upstream SMTP");
}

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

async function startConsumer(): Promise<void> {
  const connection = await connectAmqpWithRetry(env.RABBITMQ_URL, "RabbitMQ");
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "topic", { durable: true });
  const queue = await channel.assertQueue("notification-service.events", { durable: true });

  const topics = [
    eventTopics.USER_REGISTERED,
    eventTopics.PASSWORD_RESET_REQUESTED,
    eventTopics.TRAINING_COMPLETED,
    eventTopics.FRAUD_FLAGGED,
  ];

  for (const topic of topics) {
    await channel.bindQueue(queue.queue, exchangeName, topic);
  }

  channel.consume(queue.queue, async (message) => {
    if (!message) return;
    try {
      const payload = JSON.parse(message.content.toString());
      const topic = message.fields.routingKey;

      if (topic === eventTopics.USER_REGISTERED) {
        await sendMail({ to: payload.email, ...createOtpEmail("verify", payload) });
      }

      if (topic === eventTopics.PASSWORD_RESET_REQUESTED) {
        await sendMail({ to: payload.email, ...createOtpEmail("reset", payload) });
      }

      if (topic === eventTopics.TRAINING_COMPLETED && payload.email) {
        // Send email notification
        await sendMail({ to: payload.email, ...createTrainingCompletedEmail(payload) });
        
        // Create in-app notification
        if (payload.userId) {
          await pool.query(
            `INSERT INTO notifications (user_id, tenant_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              payload.userId,
              payload.tenantId,
              'training',
              '🎉 Model Training Complete',
              `Your "${payload.championModelFamily}" model has finished training and is ready for use.`,
              '/app/models'
            ]
          );
          logger.info({ userId: payload.userId }, "Created training completed in-app notification");
        }
      }

      if (topic === eventTopics.FRAUD_FLAGGED && payload.email) {
        // Send email notification
        await sendMail({ to: payload.email, ...createFraudAlertEmail(payload) });
        
        // Create in-app notification
        if (payload.userId) {
          await pool.query(
            `INSERT INTO notifications (user_id, tenant_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              payload.userId,
              payload.tenantId,
              'fraud',
              '🚨 Fraud Alert: High Risk Application',
              `Application #${payload.predictionId?.slice(-8) || 'Unknown'} flagged with ${payload.riskBand || 'High'} risk. Immediate review required.`,
              payload.predictionId ? `/app/loan/${payload.predictionId}` : '/app/predict'
            ]
          );
          logger.info({ userId: payload.userId }, "Created fraud alert in-app notification");
        }
      }

      channel.ack(message);
    } catch (error) {
      logger.error({ error }, "Notification consumer processing failure");
      channel.nack(message, false, false);
    }
  });
}

async function start() {
  logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT }, "Auditing SMTP connection string...");
  try {
    await transporter.verify();
    
    // Initialize database tables
    await initNotificationsTable(pool);
    logger.info("Database tables initialized");
    logger.info("SMTP handshake verification successful");
  } catch (error: any) {
    logger.error({ error, code: error.code }, "CRITICAL: SMTP handshake failed. Notifications are offline.");
  }

  await startConsumer();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Notification service operational");
  });
}

start().catch((error) => {
  logger.error({ error }, "Notification service bootstrap failure");
  process.exit(1);
});
