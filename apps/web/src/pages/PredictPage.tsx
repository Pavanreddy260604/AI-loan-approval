'use client';

import { startTransition, useState, useMemo, useCallback, useEffect } from "react";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  ArrowRight,
  BrainCircuit,
  BarChart3,
  Layers,
  Download,
  Activity,
  FileText,
  ChevronRight,
  TrendingUp,
  Target,
  Gauge,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EliteCard as Card,
  EliteButton as Button,
  EliteBadge as Badge,
  EliteSelect as Select,
  EliteInlineError as InlineError,
  Tooltip,
  useToast
} from "../components/ui";
import { apiFetch, toGatewayUrl } from "../lib/api";
import { ensureApplicantName, generateSyntheticName } from "../lib/loan-names";
import { type AuthContextValue } from "../App";

import {
  type BatchJobStatus,
  type PredictResponse as PredictionResult
} from "@ai-loan/contracts";

// ============================================================================
// COCKPIT MODE: VISUAL_DENSITY 9-10
// Dense information display, no wasted space, real-time feedback
// ============================================================================

interface PredictionDetail {
  predictionId: string;
  approved: boolean;
  decision: "Approved" | "Rejected";
  probability: number;
  explanation?: PredictionResult["explanation"];
  fraud?: PredictionResult["fraud"];
}

const ENRICHMENT_TIMEOUT_MS = 15_000;  // Reduced from 20s - backend now optimized for faster fraud scoring and explanations

// Sparkline component for real-time vector visualization
function Sparkline({
  values,
  color = 'primary',
  height = 24,
  width = 60
}: {
  values: number[];
  color?: 'primary' | 'success' | 'danger';
  height?: number;
  width?: number;
}) {
  // Use CSS variables for proper theming support
  const colorMap = {
    primary: 'rgb(var(--color-primary))',
    success: 'rgb(var(--color-success))', 
    danger: 'rgb(var(--color-danger))'
  };
  const colorClass = colorMap[color] || colorMap.primary;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="inline-block"
      role="img"
      aria-label={`Trend chart showing ${values.length} data points, range ${min.toFixed(1)} to ${max.toFixed(1)}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={colorClass}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Live XAI Factor Row - shows impact in real-time
function XAIFactorRow({
  feature,
  impact,
  index,
  isAnimating
}: {
  feature: string;
  impact: number;
  index: number;
  isAnimating: boolean;
}) {
  const absImpact = Math.abs(impact);
  const barWidth = Math.min(100, absImpact * 200);

  return (
    <motion.div
      className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-base-800/50 last:border-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <div className="col-span-5 flex items-center gap-2">
        <span className="text-xs font-medium text-base-300 truncate capitalize" title={feature.replace(/_/g, ' ')}>
          {feature.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="col-span-4 h-1.5 bg-base-950 rounded-full overflow-hidden border border-base-800">
        <motion.div
          className={`h-full rounded-full ${impact > 0 ? 'bg-success' : 'bg-danger'}`}
          initial={{ width: 0 }}
          animate={{ width: isAnimating ? `${barWidth}%` : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="col-span-3 text-right">
        <span className={`text-xs font-semibold tabular-nums ${impact > 0 ? 'text-success' : 'text-danger'}`}>
          {impact > 0 ? '+' : ''}{impact.toFixed(4)}
        </span>
      </div>
    </motion.div>
  );
}

// Model Performance Dashboard (shown when idle)
function ModelPerformanceIdle({ model }: { model: any }) {
  const metrics = model?.championMetrics || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-base-950 border border-base-800 rounded-md p-2.5">
          <p className="text-[10px] font-semibold text-base-500 uppercase tracking-wider">ROC AUC</p>
          <p className="text-lg font-semibold text-base-50 tabular-nums mt-0.5">
            {((metrics.rocAuc || 0) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-base-950 border border-base-800 rounded-md p-2.5">
          <p className="text-[10px] font-semibold text-base-500 uppercase tracking-wider">Accuracy</p>
          <p className="text-lg font-semibold text-base-50 tabular-nums mt-0.5">
            {((metrics.accuracy || 0) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-base-950 border border-base-800 rounded-md p-2.5">
          <p className="text-[10px] font-semibold text-base-500 uppercase tracking-wider">F1</p>
          <p className="text-lg font-semibold text-base-50 tabular-nums mt-0.5">
            {(metrics.f1Score || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-base-950 border border-base-800 rounded-md p-2.5">
          <p className="text-[10px] font-semibold text-base-500 uppercase tracking-wider">Precision</p>
          <p className="text-lg font-semibold text-base-50 tabular-nums mt-0.5">
            {(metrics.precision || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border-t border-base-800 pt-3">
        <p className="text-[11px] font-semibold text-base-500 uppercase tracking-wider mb-2">Top Features</p>
        <div className="space-y-2">
          {(metrics.featureImportance || []).slice(0, 4).map((f: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-xs text-base-300 capitalize truncate" title={f.feature || f.name}>
                {(f.feature || f.name || "").replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Sparkline values={[0.2, 0.4, 0.3, 0.6, 0.5, 0.7, 0.8]} height={14} width={40} />
                <span className="text-xs font-medium text-base-400 w-12 text-right tabular-nums">
                  {((f.importance || f.weight || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-base-800 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-semibold text-success">Model ready</span>
        </div>
        <span className="text-[11px] text-base-500 tabular-nums">
          v{model?.championVersion || '1.0'}
        </span>
      </div>
    </div>
  );
}

// Dense Input Grid for Cockpit Mode
// Detect likely numeric fields by name heuristics
function isNumericField(name: string): boolean {
  const n = name.toLowerCase();
  return /amount|_amt|_amnt|income|rate|score|count|num_|number|age|year|month|term|percent|ratio|total|balance|credit|debt|loan|funded|int_rate|revol|dti|emp_length/.test(n);
}

function DenseInputGrid({
  fields,
  values,
  onChange,
  onMagicFill
}: {
  fields: string[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onMagicFill: () => void;
}) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const filledCount = fields.filter(f => (values[f] || '').trim() !== '').length;
  const totalCount = fields.length;

  return (
    <div className="space-y-4">
      {/* Sample row quick-fill + progress indicator */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onMagicFill}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 border border-primary/30 rounded-lg text-primary hover:bg-primary/15 hover:border-primary/50 transition-all group"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          title="Load Row 1 from the dataset preview"
          aria-label="Load sample data from dataset preview"
        >
          <Sparkles size={14} className="group-hover:rotate-12 transition-transform shrink-0" />
          <span className="text-xs font-semibold">Load Sample Row</span>
        </motion.button>
        {totalCount > 0 && (
          <span className="text-[11px] font-medium text-base-500 tabular-nums shrink-0">
            {filledCount}/{totalCount} filled
          </span>
        )}
      </div>

      {/* Feature field grid - responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
        {fields.map((field) => {
          const label = field.replace(/_/g, ' ');
          const isNumeric = isNumericField(field);
          const isFilled = (values[field] || '').trim() !== '';
          return (
            <div key={field} className="relative">
              <label
                htmlFor={`field-${field}`}
                className="block text-[10px] font-semibold text-base-500 uppercase tracking-wider mb-1 ml-0.5 truncate capitalize"
                title={label}
              >
                {label}
              </label>
              <input
                id={`field-${field}`}
                type={isNumeric ? 'number' : 'text'}
                inputMode={isNumeric ? 'decimal' : 'text'}
                value={values[field] || ''}
                onChange={(e) => onChange(field, e.target.value)}
                onFocus={() => setFocusedField(field)}
                onBlur={() => setFocusedField(null)}
                placeholder="—"
                autoComplete="off"
                className={`
                  w-full h-9 px-2.5 text-xs font-medium tabular-nums
                  bg-base-950 border rounded-md
                  transition-all duration-150
                  ${focusedField === field
                    ? 'border-primary bg-base-950 ring-1 ring-primary/30 text-base-50'
                    : isFilled
                      ? 'border-base-700 text-base-100 hover:border-base-600'
                      : 'border-base-800 text-base-300 hover:border-base-700'
                  }
                  placeholder:text-base-700
                  focus:outline-none
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                `}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Live Decision Matrix with Real-time Feedback
function DecisionMatrix({
  prediction,
  isComputing,
  showExplanation,
  onShowExplanation,
  onRefetch
}: {
  prediction: PredictionDetail | null;
  isComputing: boolean;
  showExplanation: boolean;
  onShowExplanation: () => void;
  onRefetch?: () => void;
}) {
  const contributors = prediction?.explanation?.topContributors || [];
  const isApproved = prediction?.approved;
  const isExplanationPending = !!prediction && (!!prediction.explanation?.isComputing || contributors.length === 0);
  const isFraudPending = !!prediction && !!prediction.fraud?.unavailable;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-base-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <BrainCircuit size={14} />
          </div>
          <h3 className="text-sm font-semibold text-base-50">Decision</h3>
        </div>
        <AnimatePresence mode="wait">
          {prediction && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Badge tone={isApproved ? 'success' : 'danger'} size="sm">
                {prediction.decision}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto py-4">
        {prediction ? (
          <div className="space-y-5">
            {/* Confidence Score */}
            <div>
              <p className="text-[11px] font-semibold text-base-500 uppercase tracking-wider mb-1.5">Confidence</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-base-50 tracking-tight">
                  {((prediction.probability ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-base-950 rounded-full overflow-hidden border border-base-800">
                <motion.div
                  className={`h-full rounded-full ${isApproved ? 'bg-success' : 'bg-danger'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(prediction.probability ?? 0) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* XAI Factors */}
            <div className="border-t border-base-800 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-base-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-primary" />
                  Risk Factors
                </span>
                {contributors.length > 4 && (
                  <button
                    onClick={onShowExplanation}
                    className="text-[11px] font-medium text-primary hover:text-primary/80"
                  >
                    {showExplanation ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              <div className="space-y-0">
                {contributors.length > 0 ? (
                  contributors.slice(0, showExplanation ? 8 : 4).map((exp: any, i: number) => (
                    <XAIFactorRow
                      key={i}
                      feature={exp.feature}
                      impact={exp.impact}
                      index={i}
                      isAnimating={!!prediction}
                    />
                  ))
                ) : isExplanationPending ? (
                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-primary animate-pulse" />
                      <span className="text-xs font-medium text-base-400">
                        Computing explanation...
                      </span>
                    </div>
                    <p className="text-[11px] text-base-600 pl-5">
                      This may take up to 15 seconds. The explanation will appear automatically when ready.
                    </p>
                    {onRefetch && (
                      <button
                        onClick={onRefetch}
                        className="text-[11px] text-primary hover:text-primary/80 pl-5"
                      >
                        Refresh now
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-base-600">
                    No factors available for this prediction.
                  </span>
                )}
              </div>
            </div>

            {/* Fraud */}
            {prediction.fraud ? (
              <div className="border-t border-base-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Fraud Analysis
                  </span>
                  {isFraudPending ? (
                    <span className="text-[11px] font-medium text-base-500 flex items-center gap-1">
                      <Activity size={10} className="animate-pulse" />
                      Scoring…
                    </span>
                  ) : (
                    <span className={`text-sm font-semibold tabular-nums ${(prediction.fraud.riskScore || 0) > 0.5 ? 'text-danger' : 'text-success'}`}>
                      {((prediction.fraud.riskScore || 0) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Activity size={28} className={`mx-auto ${isComputing ? 'text-primary animate-pulse' : 'text-base-700'}`} />
              <p className="text-xs font-medium text-base-500">
                {isComputing ? 'Computing...' : 'Fill in the form to get a decision'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PredictPage({ auth }: { auth: AuthContextValue }) {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState<number | "">("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);
  const [predictionPollDeadline, setPredictionPollDeadline] = useState<number | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchFileName, setBatchFileName] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [applicantName, setApplicantName] = useState<string>("");
  const [loanId, setLoanId] = useState<string>("");

  // Check if form has unsaved data
  const hasUnsavedFormData = useMemo(() => {
    return applicantName.trim() !== '' || loanId.trim() !== '' || Object.values(fieldValues).some(v => v.trim() !== '');
  }, [applicantName, loanId, fieldValues]);

  // Warn before leaving with unsaved form data
  useBeforeUnload(hasUnsavedFormData, "You have unsaved prediction data. Are you sure you want to leave?");
  const toast = useToast();
  const queryClient = useQueryClient();

  // ALL useQuery hooks MUST come before useCallback that depends on them
  const datasets = useQuery<any[]>({
    queryKey: ["datasets", auth.session?.token],
    queryFn: () => apiFetch("/datasets", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  const models = useQuery<any[]>({
    queryKey: ["models", auth.session?.token],
    queryFn: () => apiFetch("/models", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  const datasetDetail = useQuery<any>({
    queryKey: ["datasets", selectedDatasetId, auth.session?.token],
    queryFn: () => apiFetch(`/datasets/${selectedDatasetId}`, { token: auth.session?.token }),
    enabled: !!selectedDatasetId && !!auth.session?.token,
  });

  const availableDatasetIds = useMemo(
    () => new Set((datasets.data || []).map((dataset: any) => dataset.id).filter(Boolean)),
    [datasets.data],
  );

  useEffect(() => {
    if (!selectedDatasetId || datasets.isLoading) return;
    if (availableDatasetIds.has(selectedDatasetId)) return;

    startTransition(() => {
      setSelectedDatasetId("");
      setSelectedApplicantIndex("");
      setShowExplanation(false);
      setActivePredictionId(null);
      setPredictionPollDeadline(null);
      setBatchJobId(null);
      setBatchFileName(null);
      setFieldValues({});
      setApplicantName("");
      setLoanId("");
    });
    toast.warning("The selected dataset was removed. Pick another dataset to continue.");
  }, [availableDatasetIds, datasets.isLoading, selectedDatasetId, toast]);

  // Now we can define callbacks that depend on datasetDetail
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMagicFill = useCallback((index: number = 0) => {
    if (!datasetDetail.data?.preview?.[index]) return;
    const sample = datasetDetail.data.preview[index];
    const newValues: Record<string, string> = {};
    let sampledName: string | null = null;
    Object.entries(sample).forEach(([key, value]) => {
      newValues[key] = value === null ? "" : String(value);
      // If the dataset happens to carry a readable name column, surface it
      const lower = key.toLowerCase();
      if (
        sampledName === null &&
        typeof value === "string" &&
        value.trim().length > 1 && value.trim().length < 80 &&
        /^(applicant_?name|full_?name|customer_?name|borrower_?name|name)$/i.test(lower)
      ) {
        sampledName = value.trim();
      }
    });
    setFieldValues(newValues);
    // Synthesise a friendly placeholder name so the dashboard entry isn't anonymous
    setApplicantName(sampledName ?? generateSyntheticName(`${selectedDatasetId}:${index}`));
  }, [datasetDetail.data, selectedDatasetId]);

  const singleMutation = useMutation<PredictionResult, Error, any>({
    mutationFn: async (payload: any) =>
      apiFetch("/predict", { method: "POST", token: auth.session?.token, body: payload }),
    onSuccess: (result) => {
      setShowExplanation(false);
      setActivePredictionId(result.predictionId);
      setPredictionPollDeadline(Date.now() + ENRICHMENT_TIMEOUT_MS);
      toast.success("Decision returned.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Prediction failed.");
    },
  });

  const predictionDetail = useQuery<PredictionDetail>({
    queryKey: ["prediction-detail", activePredictionId, auth.session?.token],
    queryFn: () => apiFetch(`/predictions/${activePredictionId}`, { token: auth.session?.token }),
    enabled: !!activePredictionId && !!auth.session?.token && !!predictionPollDeadline,
    refetchInterval: (query) => {
      if (!predictionPollDeadline || Date.now() > predictionPollDeadline) return false;
      const data = query.state.data as PredictionDetail | undefined;
      // Poll every 1 second for faster updates (was 2s)
      return needsEnrichment(data ?? (singleMutation.data as any)) ? 1000 : false;
    },
  });

  const batchMutation = useMutation<BatchJobStatus, Error, any>({
    mutationFn: async (payload: { file: File; datasetId: string }) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("datasetId", payload.datasetId);
      return apiFetch("/predict/batch", { method: "POST", token: auth.session?.token, rawBody: formData });
    },
    onSuccess: (result) => {
      setBatchJobId(result.batchJobId);
      toast.success("Batch job queued. Progress will update automatically.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Batch submission failed. Please try again.");
    },
  });

  const batchJob = useQuery<BatchJobStatus>({
    queryKey: ["batch-job", batchJobId, auth.session?.token],
    queryFn: () => apiFetch(`/predict/batch/${batchJobId}`, { token: auth.session?.token }),
    enabled: !!batchJobId && !!auth.session?.token,
    refetchInterval: (query) => {
      const data = query.state.data as BatchJobStatus | undefined;
      return !data || data.status === "queued" || data.status === "processing" ? 2000 : false;
    },
  });

  const activeModel = useMemo(() => models.data?.find(m => m.datasetId === selectedDatasetId), [models.data, selectedDatasetId]);
  const displayedPrediction = useMemo(() => merge(singleMutation.data as any, predictionDetail.data), [singleMutation.data, predictionDetail.data]);
  const currentBatchJob = batchJob.data ?? batchMutation.data;
  const batchDownloadUrl = currentBatchJob?.downloadUrl ? toGatewayUrl(currentBatchJob.downloadUrl) : null;

  // STRICT DEPENDENCY CHAIN: Dataset -> Model Ready -> Prediction Enabled
  // Compute the reason a prediction cannot run right now (null if OK).
  const modelReadinessBlock = useMemo<string | null>(() => {
    if (!selectedDatasetId) return "Select a dataset model to continue.";
    if (models.isLoading) return "Loading model state...";
    if (!activeModel) return "No model has been trained on this dataset yet.";
    const status = (activeModel.lastTrainingStatus || "").toLowerCase();
    if (status === "queued" || status === "processing") return "Model training is still in progress. Wait for it to complete.";
    if (status === "failed") return "The latest training run failed. Re-train before predicting.";
    if (status && status !== "completed") return `Model is not ready (status: ${status}).`;
    return null;
  }, [selectedDatasetId, activeModel, models.isLoading]);

  const isModelReady = modelReadinessBlock === null;

  // Get feature names for the dense input grid
  const featureNames = useMemo(() => {
    const fi = activeModel?.championMetrics?.featureImportance as any[];
    const ds = datasetDetail.data;
    let names: string[] = [];

    if (fi && Array.isArray(fi)) {
      names = fi.map(f => f.feature || f.name || (f as any).source);
    } else if (ds?.columns && Array.isArray(ds.columns)) {
      const mapping = ds.mapping || { targetColumn: "", excludedColumns: [] };
      names = ds.columns
        .map((c: any) => c.name)
        .filter((n: string) => n && n !== mapping.targetColumn && !mapping.excludedColumns.includes(n));
    }

    return Array.from(new Set(names));
  }, [activeModel, datasetDetail.data]);

  return (
    <div className="min-h-screen -mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-base-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-base-50">
              Predictions
            </h1>
            <p className="text-sm text-base-500 mt-1">
              Score loan applications or upload batch files for bulk decisions.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-base-950 border border-base-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'single' ? 'bg-primary text-white shadow-sm' : 'text-base-500 hover:text-base-200'}`}
            >
              Single
            </button>
            <button
              onClick={() => setActiveTab("batch")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'batch' ? 'bg-primary text-white shadow-sm' : 'text-base-500 hover:text-base-200'}`}
            >
              Batch
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-base-900/60 border border-base-800 rounded-lg">
          <div className="flex items-center gap-2 shrink-0">
            <Target size={16} className="text-primary" />
            <span className="text-sm text-base-400">Model</span>
          </div>
          <div className="flex-1 w-full sm:w-auto min-w-0">
            <Select
              value={selectedDatasetId}
              placeholder="Select a trained model..."
              options={(datasets.data || []).map((ds: any) => ({ label: ds.fileName, value: ds.id }))}
              onChange={(val) => { setSelectedDatasetId(val); setSelectedApplicantIndex(""); setFieldValues({}); setApplicantName(""); }}
            />
          </div>
          {activeModel && (
            <div className="flex items-center gap-2.5 sm:ml-auto shrink-0">
              <Badge
                tone={isModelReady ? "success" : (activeModel.lastTrainingStatus === "failed" ? "danger" : "warning")}
                size="sm"
              >
                {isModelReady
                  ? (activeModel.championFamily || "Ready")
                  : (activeModel.lastTrainingStatus || "Not Ready")}
              </Badge>
              <span className="text-[11px] font-medium text-base-500 hidden sm:inline">
                ROC {((activeModel.championMetrics?.rocAuc || 0) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {modelReadinessBlock && selectedDatasetId && (
          <div className="flex items-start gap-3 p-4 border border-warning/30 bg-warning/5 rounded-lg">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warning">Predictions blocked</p>
              <p className="text-xs text-base-300 mt-0.5">{modelReadinessBlock}</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "single" ? (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4"
            >
              {/* Left: Applicant + Feature form */}
              <div className="col-span-1 lg:col-span-7">
                <Card padded border className="h-full">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                        <FileText size={14} />
                      </div>
                      <h2 className="text-sm font-semibold text-base-50">Loan Details</h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-base-500">
                      <Gauge size={12} />
                      <span className="text-[11px] font-medium tabular-nums">
                        {featureNames.length} field{featureNames.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {/* Applicant identity - always visible, prominent */}
                  <div className="mb-4 pb-4 border-b border-base-800">
                    <label htmlFor="applicant-name" className="block text-[11px] font-semibold text-base-500 uppercase tracking-wider mb-1.5">
                      Applicant Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="applicant-name"
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        autoComplete="off"
                        maxLength={80}
                        className="flex-1 h-10 px-3 text-sm font-medium bg-base-950 border border-base-800 rounded-lg text-base-100 placeholder:text-base-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setApplicantName(generateSyntheticName())}
                        className="h-10 px-3 text-xs font-medium text-base-400 hover:text-primary bg-base-950 border border-base-800 hover:border-primary/40 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Generate a random name"
                      >
                        <Sparkles size={12} />
                        <span className="hidden sm:inline">Random</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-base-600 mt-1.5">
                      Shown on the dashboard and decision history. If left blank we'll fill in a placeholder.
                    </p>
                  </div>

                  {/* Loan ID */}
                  <div>
                    <label htmlFor="loan-id" className="block text-xs font-medium text-base-400 mb-2">
                      Loan ID <span className="text-base-600">(Optional)</span>
                    </label>
                    <input
                      id="loan-id"
                      type="text"
                      value={loanId}
                      onChange={(e) => setLoanId(e.target.value)}
                      placeholder="e.g. LOAN-2024-001"
                      autoComplete="off"
                      maxLength={50}
                      className="w-full h-10 px-3 text-sm font-medium bg-base-950 border border-base-800 rounded-lg text-base-100 placeholder:text-base-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                    <p className="text-[11px] text-base-600 mt-1.5">
                      Your internal reference ID for this loan application.
                    </p>
                  </div>

                  {featureNames.length > 0 ? (
                    <DenseInputGrid
                      fields={featureNames}
                      values={fieldValues}
                      onChange={handleFieldChange}
                      onMagicFill={() => handleMagicFill(0)}
                    />
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-xs text-base-500">
                        Select a model above to load its feature fields.
                      </p>
                    </div>
                  )}

                  {/* Submit Row */}
                  <div className="mt-5 pt-4 border-t border-base-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Tooltip
                      content={
                        !selectedDatasetId
                          ? "Pick a dataset first."
                          : !(datasetDetail.data?.preview?.length)
                            ? "No sample rows available."
                            : "Load a sample row from this dataset."
                      }
                      placement="top"
                    >
                      <span className="sm:w-48 w-full">
                        <Select
                          value={selectedApplicantIndex === "" ? "" : String(selectedApplicantIndex)}
                          placeholder="Load sample row..."
                          disabled={!selectedDatasetId || !(datasetDetail.data?.preview?.length)}
                          options={(datasetDetail.data?.preview || []).slice(0, 10).map((row: any, i: number) => {
                            const idCol = datasetDetail.data?.mapping?.idColumn;
                            const idValue = idCol ? row?.[idCol] : undefined;
                            const label = idValue !== undefined && idValue !== null && String(idValue).trim() !== ""
                              ? `Row ${i + 1} · ${String(idValue)}`
                              : `Row ${i + 1}`;
                            return { label, value: String(i) };
                          })}
                          onChange={(val) => {
                            const idx = val === "" ? "" : Number(val);
                            setSelectedApplicantIndex(idx);
                            if (idx !== "") handleMagicFill(idx);
                          }}
                        />
                      </span>
                    </Tooltip>

                    <Tooltip
                      content={modelReadinessBlock || (featureNames.length === 0 ? "No feature fields available." : "Run prediction")}
                      placement="top"
                    >
                      <span className="flex-1 contents">
                        <Button
                          className="flex-1 h-10 shadow-elite-primary"
                          type="submit"
                          loading={singleMutation.isPending}
                          disabled={!isModelReady || featureNames.length === 0}
                          rightIcon={<ChevronRight size={14} />}
                          onClick={() => {
                            if (!isModelReady) {
                              toast.error(modelReadinessBlock || "Model is not ready.");
                              return;
                            }
                            // Always stamp an applicant name (user-provided or synthetic)
                            // so dashboard / history entries are readable.
                            let features = ensureApplicantName(fieldValues, applicantName);
                            // Add loan ID if provided
                            if (loanId.trim()) {
                              features = { ...features, loan_id: loanId.trim(), Loan_ID: loanId.trim() };
                            }
                            singleMutation.mutate({ datasetId: selectedDatasetId, features, explain: true });
                          }}
                        >
                          Get Decision
                        </Button>
                      </span>
                    </Tooltip>
                  </div>

                  {singleMutation.isError && (
                    <div className="mt-3">
                      <InlineError message={(singleMutation.error as Error).message} />
                    </div>
                  )}
                </Card>
              </div>

              {/* Right: Decision Matrix - 5 cols on desktop, full on mobile */}
              <div className="col-span-1 lg:col-span-5">
                <Card padded border className="h-full">
                  {displayedPrediction ? (
                    <DecisionMatrix
                      prediction={displayedPrediction}
                      isComputing={singleMutation.isPending || predictionDetail.isLoading}
                      showExplanation={showExplanation}
                      onShowExplanation={() => setShowExplanation(!showExplanation)}
                      onRefetch={() => {
                        queryClient.invalidateQueries({ queryKey: ["prediction-detail", displayedPrediction?.predictionId] });
                      }}
                    />
                  ) : activeModel ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-base-800">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                          <TrendingUp size={14} />
                        </div>
                        <h3 className="text-sm font-semibold text-base-50">Model Performance</h3>
                      </div>
                      <div className="flex-1 py-4">
                        <ModelPerformanceIdle model={activeModel} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center py-16">
                      <div className="text-center space-y-2">
                        <BrainCircuit size={32} className="mx-auto text-base-700" />
                        <p className="text-sm font-medium text-base-400">Select a model</p>
                        <p className="text-xs text-base-600">
                          Model metrics will appear here.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="batch"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto"
            >
              <Card padded border className="text-center py-8">
                <div className="inline-flex p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary mb-4">
                  <Layers size={28} />
                </div>
                <h2 className="text-lg font-semibold text-base-50 mb-1.5">Batch Processing</h2>
                <p className="text-sm text-base-500 mb-6">
                  Upload a CSV or Excel file to score multiple loans at once.
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
                  if (!file) {
                    toast.error("Please select a CSV or Excel file to upload.");
                    return;
                  }
                  if (!selectedDatasetId) {
                    toast.error("Select a dataset first so we know how to map columns.");
                    return;
                  }
                  batchMutation.mutate({ file, datasetId: selectedDatasetId });
                }}>
                  <label className={`block p-8 border-2 border-dashed rounded-lg cursor-pointer mb-4 transition-colors ${batchFileName ? 'border-primary/60 bg-primary/5' : 'border-base-700 hover:border-primary/50'}`}>
                    <input
                      type="file"
                      name="file"
                      accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 100 * 1024 * 1024) {
                        toast.error(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 100 MB.`);
                        e.target.value = "";
                        return;
                      }
                      setBatchFileName(f?.name ?? null);
                    }}
                    />
                    <Upload size={20} className={`mx-auto mb-2 ${batchFileName ? 'text-primary' : 'text-base-500'}`} />
                    <p className={`text-xs font-bold ${batchFileName ? 'text-base-50' : 'text-base-400'}`}>
                      {batchFileName ?? 'Drop file or click to upload'}
                    </p>
                    <p className="text-[10px] text-base-600 mt-1">
                      {batchFileName ? 'Click again to change file' : 'Accepts .csv, .xls, .xlsx · Max 100 MB'}
                    </p>
                  </label>
                  <Tooltip
                    content={!selectedDatasetId ? "Select a dataset first." : modelReadinessBlock || "Run batch prediction"}
                    placement="top"
                  >
                    <span className="block">
                      <Button
                        className="w-full"
                        type="submit"
                        loading={batchMutation.isPending}
                        disabled={!isModelReady || !selectedDatasetId}
                        rightIcon={<ArrowRight size={14} />}
                      >
                        Start Batch
                      </Button>
                    </span>
                  </Tooltip>
                </form>

                {currentBatchJob && (
                  <div className="mt-6 p-4 bg-base-950 border border-base-800 rounded-lg text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold text-base-500 uppercase tracking-wider">Status</span>
                      <Badge
                        tone={
                          currentBatchJob.status === 'completed'
                            ? 'success'
                            : currentBatchJob.status === 'failed'
                              ? 'danger'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {currentBatchJob.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-semibold text-base-50 tabular-nums">{currentBatchJob.rowCount ?? '—'}</p>
                        <p className="text-[10px] text-base-500 uppercase tracking-wider mt-0.5">Records</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-primary tabular-nums">{currentBatchJob.reservedCredits ?? '—'}</p>
                        <p className="text-[10px] text-base-500 uppercase tracking-wider mt-0.5">Credits</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-base-50 tabular-nums">
                          {currentBatchJob.outputReady
                            ? '100%'
                            : currentBatchJob.status === 'failed'
                              ? '—'
                              : currentBatchJob.status === 'processing'
                                ? 'Running…'
                                : 'Queued'}
                        </p>
                        <p className="text-[10px] text-base-500 uppercase tracking-wider mt-0.5">Progress</p>
                      </div>
                    </div>
                    {currentBatchJob.outputReady && batchDownloadUrl && (
                      <a href={batchDownloadUrl} download className="block mt-3">
                        <Button variant="primary" className="w-full" leftIcon={<Download size={14} />}>
                          Download Results
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function needsEnrichment(p: any) {
  if (!p || typeof p !== 'object') return false;
  if (!p.predictionId) return false;
  const explanationComputing = !!p.explanation?.isComputing;
  const fraudUnavailable = !!p.fraud?.unavailable;
  const missingContributors = !p.explanation?.topContributors || p.explanation.topContributors.length === 0;
  return explanationComputing || fraudUnavailable || missingContributors;
}

function merge(initial: any, detail: any) {
  if (!initial && !detail) return null;
  if (!initial) return detail;
  if (!detail) return initial;
  return {
    ...initial,
    ...detail,
    explanation: detail.explanation ?? initial.explanation ?? null,
    fraud: detail.fraud ?? initial.fraud ?? null,
  };
}
