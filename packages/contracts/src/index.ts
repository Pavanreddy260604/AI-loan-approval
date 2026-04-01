import { z } from "zod";

export const roles = ["ADMIN", "OFFICER", "USER"] as const;
export type Role = (typeof roles)[number];

export const eventTopics = {
  USER_REGISTERED: "user.registered",
  USER_VERIFIED: "user.verified",
  PASSWORD_RESET_REQUESTED: "password.reset.requested",
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  CREDITS_REPLENISHED: "credits.replenished",
  DATASET_UPLOADED: "dataset.uploaded",
  DATASET_MAPPED: "dataset.mapped",
  TRAINING_REQUESTED: "training.requested",
  TRAINING_COMPLETED: "training.completed",
  MODEL_PROMOTED: "model.promoted",
  PREDICTION_COMPLETED: "prediction.completed",
  FRAUD_FLAGGED: "fraud.flagged",
} as const;

export type EventTopic = (typeof eventTopics)[keyof typeof eventTopics];

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must include an uppercase character")
    .regex(/[a-z]/, "Password must include a lowercase character")
    .regex(/[0-9]/, "Password must include a number"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6),
  newPassword: signupSchema.shape.password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const datasetMappingSchema = z.object({
  targetColumn: z.string().trim().min(1),
  positiveLabel: z.union([z.string(), z.number(), z.boolean()]),
  excludedColumns: z.array(z.string()).default([]),
  featureOverrides: z
    .record(
      z.string(),
      z.object({
        alias: z.string().trim().optional(),
        type: z.enum(["numeric", "categorical", "boolean", "date"]).optional(),
        required: z.boolean().default(false),
      }),
    )
    .default({}),
  idColumn: z.string().trim().optional(),
});

export type DatasetMapping = z.infer<typeof datasetMappingSchema>;

export const trainRequestSchema = z.object({
  datasetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  datasetObjectKey: z.string().min(1),
  fileName: z.string().min(1),
  mapping: datasetMappingSchema,
  columns: z.array(
    z.object({
      name: z.string(),
      inferredType: z.string(),
    }),
  ),
});

export type TrainRequest = z.infer<typeof trainRequestSchema>;

export const predictRequestSchema = z.object({
  datasetId: z.string().uuid(),
  modelVersionId: z.string().uuid().optional(),
  features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export type PredictRequest = z.infer<typeof predictRequestSchema>;

export const planSchema = z.object({
  code: z.string(),
  name: z.string(),
  monthlyPrice: z.number(),
  monthlyCredits: z.number(),
  stripePriceId: z.string(),
});

export type Plan = z.infer<typeof planSchema>;

export const billingBalanceSchema = z.object({
  tenantId: z.string(),
  balance: z.number(),
  reserved: z.number(),
  available: z.number(),
  used: z.number().default(0),
});

export type BillingBalance = z.infer<typeof billingBalanceSchema>;

export const explanationContributorSchema = z.object({
  feature: z.string(),
  impact: z.number(),
});

export type ExplanationContributor = z.infer<typeof explanationContributorSchema>;

export const explanationSchema = z.object({
  topContributors: z.array(explanationContributorSchema).default([]),
  summary: z.object({
    positiveDrivers: z.array(explanationContributorSchema).default([]),
    negativeDrivers: z.array(explanationContributorSchema).default([]),
  }).default({ positiveDrivers: [], negativeDrivers: [] }),
  approximationInfo: z
    .object({
      isApproximated: z.boolean(),
      nsamples: z.number().nullable().default(null),
      method: z.string(),
    })
    .optional(),
  isComputing: z.boolean().default(false),
});

export type Explanation = z.infer<typeof explanationSchema>;

export const fraudEvaluationSchema = z.object({
  riskBand: z.enum(["low", "medium", "high", "unknown"]).default("unknown"),
  anomalyScore: z.number().nullable().default(null),
  riskScore: z.number().nullable().default(null),
  ruleFlags: z.array(z.string()).default([]),
  unavailable: z.boolean().optional(),
});

export type FraudEvaluation = z.infer<typeof fraudEvaluationSchema>;

export const modelMetricsSchema = z.object({
  rocAuc: z.number().default(0),
  f1Score: z.number().default(0),
  precision: z.number().default(0),
  recall: z.number().default(0),
  accuracy: z.number().default(0),
});

export type ModelMetrics = z.infer<typeof modelMetricsSchema>;

export const publicModelVersionSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().uuid(),
  family: z.string(),
  metrics: modelMetricsSchema,
  createdAt: z.string().optional(),
});

export type PublicModelVersion = z.infer<typeof publicModelVersionSchema>;

export const predictResponseSchema = z.object({
  predictionId: z.string().uuid(),
  approved: z.boolean(),
  decision: z.enum(["Approved", "Rejected"]),
  probability: z.number(),
  modelVersion: publicModelVersionSchema,
  explanation: explanationSchema,
  fraud: fraudEvaluationSchema,
  remainingCredits: z.number(),
});

export type PredictResponse = z.infer<typeof predictResponseSchema>;

export const dashboardActivitySchema = z.object({
  topic: z.string(),
  payload: z.unknown(),
  createdAt: z.string(),
});

export type DashboardActivity = z.infer<typeof dashboardActivitySchema>;

export const dashboardMetricsSchema = z.object({
  totalDatasets: z.number(),
  totalModels: z.number(),
  totalPredictions: z.number(),
  creditsUsed: z.number(),
  fraudAlerts: z.number(),
  lastTrainingStatus: z.string().nullable().default(null),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const dashboardDatasetSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  status: z.string(),
  rowCount: z.number(),
});

export type DashboardDataset = z.infer<typeof dashboardDatasetSchema>;

export const dashboardModelSchema = z.object({
  id: z.string().uuid(),
  datasetId: z.string().uuid(),
  championFamily: z.string().nullable().default(null),
  championMetrics: modelMetricsSchema,
  pinnedVersionId: z.string().uuid().nullable().default(null),
  lastTrainingStatus: z.enum(["queued", "processing", "completed", "failed"]).default("completed"),
  lastTrainingError: z.string().nullable().default(null),
  updatedAt: z.string().nullable().default(null),
});

export type DashboardModel = z.infer<typeof dashboardModelSchema>;

export const dashboardResponseSchema = z.object({
  analytics: z.object({
    metrics: dashboardMetricsSchema,
    activities: z.array(dashboardActivitySchema).default([]),
  }),
  balance: billingBalanceSchema,
  datasets: z.array(dashboardDatasetSchema).default([]),
  models: z.array(dashboardModelSchema).default([]),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

export const batchJobStatusSchema = z.object({
  batchJobId: z.string(),
  status: z.string(),
  rowCount: z.number(),
  reservedCredits: z.number().default(0),
  remainingCredits: z.number().optional(),
  outputReady: z.boolean(),
  downloadUrl: z.string().nullable().default(null),
  createdAt: z.string().nullable().default(null),
  updatedAt: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
});

export type BatchJobStatus = z.infer<typeof batchJobStatusSchema>;

export function assertSchema<T>(schema: z.ZodType<T>, payload: unknown): T {
  return schema.parse(payload);
}

export const updateUserRoleSchema = z.object({
  role: z.enum(roles),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
