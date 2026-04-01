import { setTimeout as sleep } from "node:timers/promises";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const MAILPIT_BASE_URL = process.env.MAILPIT_BASE_URL ?? "http://localhost:8025/api/v1";
const VERIFY_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS ?? 240000);

function logStep(message) {
  console.log(`[verify] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildUrl(baseUrl, path) {
  return new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function request(path, { method = "GET", token, body, formData, headers = {}, expected = [200] } = {}) {
  const response = await fetch(buildUrl(API_BASE_URL, path), {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(formData ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const payload = await parseResponse(response);
  if (!expected.includes(response.status)) {
    const details = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`${method} ${path} returned ${response.status}: ${details}`);
  }

  return { response, body: payload };
}

async function requestBuffer(path, { token, expected = [200] } = {}) {
  const response = await fetch(buildUrl(API_BASE_URL, path), {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const body = response.ok ? Buffer.from(await response.arrayBuffer()) : await parseResponse(response);
  if (!expected.includes(response.status)) {
    const details = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`GET ${path} returned ${response.status}: ${details}`);
  }

  return { response, body, contentType };
}

async function waitFor(checkFn, { timeoutMs = VERIFY_TIMEOUT_MS, intervalMs = 2000, label = "condition" } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await checkFn();
    if (value) {
      return value;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out while waiting for ${label}.`);
}

function uniqueEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}@example.com`;
}

async function getMailpitMessages() {
  const response = await fetch(buildUrl(MAILPIT_BASE_URL, "/messages"));
  const body = await response.json();
  return body.messages || [];
}

function extractOtp(snippet) {
  const match = String(snippet || "").match(/\b(\d{6})\b/);
  return match?.[1] ?? null;
}

async function waitForOtp({ email, subjectIncludes, afterTimestamp }) {
  const message = await waitFor(
    async () => {
      const messages = await getMailpitMessages();
      const matches = messages
        .filter((item) => item.To?.some((recipient) => recipient.Address === email))
        .filter((item) => item.Subject?.includes(subjectIncludes))
        .filter((item) => new Date(item.Created).getTime() >= afterTimestamp - 1000)
        .sort((left, right) => new Date(right.Created).getTime() - new Date(left.Created).getTime());

      return matches[0] || null;
    },
    { label: `${subjectIncludes} email for ${email}` },
  );

  const otp = extractOtp(message.Snippet);
  assert(otp, `Unable to extract OTP from Mailpit message for ${email}.`);
  return otp;
}

function createTrainingRows(count = 72) {
  const tiers = ["metro", "urban", "rural"];
  return Array.from({ length: count }, (_, index) => {
    const age = 24 + (index % 22);
    const income = 36000 + index * 1850 + (index % 4) * 1200;
    const loanAmount = 9000 + (index % 10) * 2800 + (index % 3) * 500;
    const employmentYears = 1 + (index % 12);
    const ownsHome = index % 3 === 0;
    const cityTier = tiers[index % tiers.length];
    const existingDefaults = index % 7 === 0 ? 1 : 0;
    const savings = 4000 + (index % 9) * 2600;
    const debtToIncome = Number((loanAmount / income).toFixed(3));
    let score = 0;
    if (income >= 70000) score += 2;
    if (employmentYears >= 4) score += 1;
    if (existingDefaults === 0) score += 2;
    if (debtToIncome <= 0.34) score += 2;
    if (ownsHome) score += 1;
    if (savings >= 12000) score += 1;

    return {
      application_id: `APP-${String(index + 1).padStart(4, "0")}`,
      age,
      income,
      loan_amount: loanAmount,
      employment_years: employmentYears,
      owns_home: ownsHome ? "true" : "false",
      city_tier: cityTier,
      existing_defaults: existingDefaults,
      savings,
      debt_to_income: debtToIncome,
      approved: score >= 6 ? 1 : 0,
    };
  });
}

function toCsv(rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(
      columns
        .map((column) => {
          const value = row[column];
          if (value === null || value === undefined) {
            return "";
          }
          const text = String(value);
          return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}

function buildDatasetFixtures() {
  const trainingRows = createTrainingRows();
  const trainingColumns = Object.keys(trainingRows[0]);
  const featureColumns = trainingColumns.filter((column) => column !== "approved");
  const batchRows = trainingRows.slice(0, 6).map((row) =>
    Object.fromEntries(featureColumns.map((column) => [column, row[column]])),
  );

  return {
    trainingRows,
    trainingCsv: toCsv(trainingRows, trainingColumns),
    batchRows,
    batchCsv: toCsv(batchRows, featureColumns),
    singleFeatures: batchRows[0],
    batchRowCount: batchRows.length,
  };
}

async function signupVerifyAndLogin(prefix) {
  const user = {
    fullName: `${prefix} User`,
    email: uniqueEmail(prefix),
    password: "SecurePass9",
  };

  logStep(`signing up ${user.email}`);
  const signupStartedAt = Date.now();
  await request("/auth/signup", {
    method: "POST",
    body: user,
    expected: [201],
  });

  const verifyOtp = await waitForOtp({
    email: user.email,
    subjectIncludes: "Verify your AI Loan Intelligence account",
    afterTimestamp: signupStartedAt,
  });

  await request("/auth/verify-email", {
    method: "POST",
    body: { email: user.email, otp: verifyOtp },
  });

  const session = await request("/auth/login", {
    method: "POST",
    body: { email: user.email, password: user.password },
  });

  return {
    user,
    session: session.body,
  };
}

async function resetPasswordFlow(user, refreshToken) {
  const newPassword = "ResetPass9";
  const resetStartedAt = Date.now();

  logStep(`resetting password for ${user.email}`);
  await request("/auth/forgot-password", {
    method: "POST",
    body: { email: user.email },
  });

  const resetOtp = await waitForOtp({
    email: user.email,
    subjectIncludes: "Reset your AI Loan Intelligence password",
    afterTimestamp: resetStartedAt,
  });

  await request("/auth/reset-password", {
    method: "POST",
    body: { email: user.email, otp: resetOtp, newPassword },
  });

  await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    expected: [401],
  });

  const session = await request("/auth/login", {
    method: "POST",
    body: { email: user.email, password: newPassword },
  });

  return {
    ...user,
    password: newPassword,
    session: session.body,
  };
}

async function grantStarterCredits(token) {
  const checkout = await request("/billing/checkout-session", {
    method: "POST",
    token,
    body: { planCode: "starter" },
  });

  assert(checkout.body.mode === "mock", "Billing checkout should run in mock mode.");
  const balance = await request("/billing/balance", { token });
  assert(balance.body.available === 250, "Starter plan should grant 250 available credits.");
  return balance.body;
}

async function uploadDataset(token, csvText, fileName) {
  const formData = new FormData();
  formData.append("file", new Blob([csvText], { type: "text/csv" }), fileName);

  const upload = await request("/datasets", {
    method: "POST",
    token,
    formData,
    expected: [201],
  });

  assert(upload.body.id, "Dataset upload should return an id.");

  // World Class: Poll until status is 'uploaded' or 'failed'
  return waitFor(
    async () => {
      const status = await request(`/datasets/${upload.body.id}`, { token });
      if (status.body.status === "failed") throw new Error(`Dataset processing failed: ${status.body.error}`);
      return status.body.status === "uploaded" ? status.body : null;
    },
    { label: `dataset ${upload.body.id} processing`, timeoutMs: 30000, intervalMs: 2000 }
  );
}

async function waitForTrainingVersions(token, datasetId) {
  return waitFor(
    async () => {
      const compare = await request(`/models/compare?datasetId=${datasetId}`, { token });
      return compare.body.length >= 4 ? compare.body : null;
    },
    { timeoutMs: VERIFY_TIMEOUT_MS, intervalMs: 5000, label: `trained model versions for ${datasetId}` },
  );
}

async function waitForBatchCompletion(token, batchJobId) {
  return waitFor(
    async () => {
      const batch = await request(`/predict/batch/${batchJobId}`, { token });
      return ["completed", "failed"].includes(batch.body.status) ? batch.body : null;
    },
    { timeoutMs: VERIFY_TIMEOUT_MS, intervalMs: 3000, label: `batch completion for ${batchJobId}` },
  );
}

async function main() {
  logStep("verifying service connectivity...");
  try {
    const gw = await fetch(buildUrl(API_BASE_URL, "/health")).then(r => r.json());
    logStep(`gateway-service is UP (${gw.service})`);
    
    // Check notification service if we're not explicitly skipping it
    if (!process.env.SKIP_MAIL_CHECK) {
      try {
        const ns = await fetch("http://localhost:4005/health").then(r => r.json());
        logStep(`notification-service is UP (${ns.service})`);
        if (ns.smtp?.user === "missing") {
           console.warn("[verify] WARNING: SMTP user is not configured in notification-service.");
        }
      } catch (err) {
        logStep("WARNING: notification-service is unreachable at localhost:4005. OTP checks may fail.");
      }
    }
  } catch (error) {
    console.error(`[verify] CRITICAL: Unable to reach Gateway at ${API_BASE_URL}.`);
    console.error(`[verify] Ensure 'docker compose up' is running and healthy.`);
    process.exit(1);
  }

  const fixtures = buildDatasetFixtures();

  logStep("verifying auth signup, email verification, login, and password reset");
  const primary = await signupVerifyAndLogin("verify");
  const refreshedPrimary = await resetPasswordFlow(primary.user, primary.session.refreshToken);
  const primaryToken = refreshedPrimary.session.accessToken;

  await request("/me", { token: primaryToken });
  await grantStarterCredits(primaryToken);

  logStep("verifying dataset upload and mapping");
  const uploadedDataset = await uploadDataset(primaryToken, fixtures.trainingCsv, "loan_training.csv");
  const datasetId = uploadedDataset.id;
  const preview = await request(`/datasets/${datasetId}/preview`, { token: primaryToken });
  assert(preview.body.columns.some((column) => column.name === "approved"), "Dataset preview should include approved.");

  await request(`/datasets/${datasetId}/mapping`, {
    method: "POST",
    token: primaryToken,
    body: {
      targetColumn: "approved",
      positiveLabel: 1,
      excludedColumns: ["application_id"],
      featureOverrides: {
        owns_home: { type: "boolean" },
      },
      idColumn: "application_id",
    },
  });

  logStep("verifying training, compare, model detail, and pinning");
  const trainingStartedAt = Date.now();
  const training = await request("/models/train", {
    method: "POST",
    token: primaryToken,
    body: { datasetId },
  });
  assert(training.body.modelId, "Training should return a model id.");

  const modelVersions = await waitForTrainingVersions(primaryToken, datasetId);
  const trainingNotice = await waitFor(
    async () => {
      const messages = await getMailpitMessages();
      return (
        messages.find(
          (item) =>
            item.To?.some((recipient) => recipient.Address === refreshedPrimary.email) &&
            item.Subject?.includes("Training completed") &&
            new Date(item.Created).getTime() >= trainingStartedAt - 1000,
        ) || null
      );
    },
    { label: `training completion email for ${refreshedPrimary.email}` },
  );
  assert(trainingNotice, "Training completion email should be delivered.");

  const models = await request("/models", { token: primaryToken });
  const model = models.body.find((item) => item.dataset_id === datasetId);
  assert(model, "Model registry should contain the trained dataset.");

  const detail = await request(`/models/${model.id}`, { token: primaryToken });
  assert(detail.body.versions.length >= 4, "Model detail should expose all trained versions.");

  const pinCandidate =
    detail.body.versions.find((version) => version.id !== detail.body.model.current_champion_version_id) ??
    detail.body.versions[0];
  await request(`/models/${model.id}/pin`, {
    method: "POST",
    token: primaryToken,
    body: { versionId: pinCandidate.id },
  });

  const pinnedDetail = await request(`/models/${model.id}`, { token: primaryToken });
  assert(
    pinnedDetail.body.model.pinned_version_id === pinCandidate.id,
    "Pinned version should be saved on the model.",
  );

  logStep("verifying normalized dashboard and prediction contract");
  const dashboard = await request("/dashboard", { token: primaryToken });
  assert(typeof dashboard.body.analytics.metrics.totalDatasets === "number", "Dashboard metrics should be normalized.");
  assert(Array.isArray(dashboard.body.datasets), "Dashboard datasets should be an array.");

  const beforeSingleBalance = await request("/billing/balance", { token: primaryToken });
  const prediction = await request("/predict", {
    method: "POST",
    token: primaryToken,
    body: {
      datasetId,
      features: fixtures.singleFeatures,
    },
  });

  assert(typeof prediction.body.approved === "boolean", "Predict response should expose approved.");
  assert(
    ["Approved", "Rejected"].includes(prediction.body.decision),
    "Predict response should expose normalized decision labels.",
  );
  assert(Array.isArray(prediction.body.explanation.topContributors), "Predict response should expose explanation data.");
  assert(typeof prediction.body.fraud.riskBand === "string", "Predict response should expose fraud data.");
  assert(
    prediction.body.modelVersion.id === pinCandidate.id,
    "Prediction should resolve the pinned model version when none is supplied.",
  );

  const afterSingleBalance = await request("/billing/balance", { token: primaryToken });
  assert(
    afterSingleBalance.body.available === beforeSingleBalance.body.available - 1,
    "Single prediction should consume one credit.",
  );

  const storedPrediction = await request(`/predictions/${prediction.body.predictionId}`, { token: primaryToken });
  assert(storedPrediction.body.id === prediction.body.predictionId, "Prediction lookup should stay tenant-scoped.");

  logStep("verifying batch prediction reservation, completion, and download");
  const batchForm = new FormData();
  batchForm.append("datasetId", datasetId);
  batchForm.append("file", new Blob([fixtures.batchCsv], { type: "text/csv" }), "loan_batch.csv");

  const balanceBeforeBatch = await request("/billing/balance", { token: primaryToken });
  const batchStart = await request("/predict/batch", {
    method: "POST",
    token: primaryToken,
    formData: batchForm,
    expected: [202],
  });

  assert(batchStart.body.reservedCredits === fixtures.batchRowCount, "Batch start should report reserved credits.");
  const balanceWhileBatchRuns = await request("/billing/balance", { token: primaryToken });
  assert(
    balanceWhileBatchRuns.body.available === balanceBeforeBatch.body.available - fixtures.batchRowCount,
    "Batch prediction should hold credits as reserved during processing.",
  );

  const batchDone = await waitForBatchCompletion(primaryToken, batchStart.body.batchJobId);
  assert(batchDone.status === "completed", `Batch job should complete successfully, received ${batchDone.status}.`);
  assert(batchDone.outputReady === true, "Completed batch should expose a download URL.");

  const download = await requestBuffer(`/predict/batch/${batchStart.body.batchJobId}/download`, { token: primaryToken });
  assert(download.contentType.includes("text/csv"), "Batch download should return csv content.");
  const batchCsv = download.body.toString("utf8");
  assert(batchCsv.includes("decision"), "Batch download should include normalized decision column.");
  assert(batchCsv.includes("Approved") || batchCsv.includes("Rejected"), "Batch output should use normalized labels.");

  const balanceAfterBatch = await request("/billing/balance", { token: primaryToken });
  assert(
    balanceAfterBatch.body.available === balanceBeforeBatch.body.available - fixtures.batchRowCount,
    "Batch prediction should commit its reserved credits exactly once after completion.",
  );

  const transactions = await request("/billing/transactions", { token: primaryToken });
  const batchTransactions = transactions.body.filter((item) => item.reference === `batch:${batchStart.body.batchJobId}`);
  assert(batchTransactions.length === 1, "Batch job should have exactly one committed billing record.");
  assert(batchTransactions[0].status === "committed", "Batch billing record should be committed after completion.");

  logStep("verifying tenant isolation");
  const secondary = await signupVerifyAndLogin("tenantb");
  await grantStarterCredits(secondary.session.accessToken);

  await request(`/datasets/${datasetId}/preview`, {
    token: secondary.session.accessToken,
    expected: [404],
  });
  await request(`/models/${model.id}`, {
    token: secondary.session.accessToken,
    expected: [404],
  });
  await request(`/models/${model.id}/pin`, {
    method: "POST",
    token: secondary.session.accessToken,
    body: { versionId: pinCandidate.id },
    expected: [404],
  });
  await request("/predict", {
    method: "POST",
    token: secondary.session.accessToken,
    body: {
      datasetId,
      modelVersionId: pinCandidate.id,
      features: fixtures.singleFeatures,
    },
    expected: [404],
  });
  const foreignBatchForm = new FormData();
  foreignBatchForm.append("datasetId", datasetId);
  foreignBatchForm.append("file", new Blob([fixtures.batchCsv], { type: "text/csv" }), "foreign_batch.csv");
  await request("/predict/batch", {
    method: "POST",
    token: secondary.session.accessToken,
    formData: foreignBatchForm,
    expected: [404],
  });
  await request(`/predict/batch/${batchStart.body.batchJobId}`, {
    token: secondary.session.accessToken,
    expected: [404],
  });

  logStep("verifying admin overview access control");
  await request("/admin/overview", {
    token: primaryToken,
    expected: [403],
  });

  const adminSession = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@ailoan.local", password: "Admin@123" },
  });
  const adminOverview = await request("/admin/overview", {
    token: adminSession.body.accessToken,
  });

  assert(adminOverview.body.analytics, "Admin overview should expose analytics.");
  assert(Array.isArray(adminOverview.body.plans), "Admin overview should expose plans.");

  logStep("system verification passed");
}

main().catch((error) => {
  console.error(`[verify] failed: ${error.message}`);
  process.exit(1);
});
