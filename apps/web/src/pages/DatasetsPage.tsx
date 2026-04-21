import { useEffect, useMemo, useState } from "react";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useAutoSave } from "../hooks/useAutoSave";
import { useFileUpload } from "../hooks/useFileUpload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  LoaderCircle,
  Play,
  Plus,
  Info,
  Upload,
  Target,
  ArrowRight,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EliteCard as Card,
  EliteBadge as Badge,
  EliteButton as Button,
  EliteSelect as Select,
  ShinyMetricCard,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader,
  EliteInlineError as InlineError,
  Modal,
  UploadProgress,
  Tooltip,
  useToast
} from "../components/ui";
import { apiFetch } from "../lib/api";
import { type AuthContextValue } from "../App";
import { type DashboardDataset as Dataset } from "@ai-loan/contracts";

type DatasetValue = string | number | boolean | null;
type PageMode = "list" | "upload" | "mapping";

interface DatasetMappingPayload {
  targetColumn: string;
  positiveLabel: DatasetValue;
  excludedColumns: string[];
  idColumn?: string;
}

interface ColumnValueCount {
  value: DatasetValue;
  count: number;
}

interface ColumnStats {
  uniqueCount: number;
  nullCount: number;
  nonNullCount: number;
  topValues: ColumnValueCount[];
  truncated: boolean;
  isBinaryCandidate: boolean;
  candidateLabels: DatasetValue[];
  looksLikeIdentifier?: boolean;
}

interface ColumnDefinition {
  name: string;
  inferredType: string;
  sampleValues: DatasetValue[];
  stats: ColumnStats | null;
}

interface PreviewData {
  id: string;
  fileName: string;
  rowCount: number;
  status: string;
  profileStatus: string;
  statsReady: boolean;
  mapping?: DatasetMappingPayload | null;
  columns: ColumnDefinition[];
  preview: Record<string, unknown>[];
}

interface DatasetListItem extends Dataset {
  profileStatus?: string;
  mapping?: DatasetMappingPayload | null;
}

interface MappingState {
  targetColumn: string;
  positiveLabelKey: string;
  excludedColumns: string[];
  idColumn: string;
}

interface MappingValidation {
  state: "pending" | "info" | "warning" | "error" | "ready";
  title: string;
  message: string;
  targetColumn?: ColumnDefinition;
  selectedLabel?: DatasetValue;
  positiveCount: number;
  negativeCount: number;
  total: number;
}

const WORKFLOW_STEPS = [
  "Upload",
  "Columns",
  "Outcome",
  "Review",
  "Train",
];

const EMPTY_MAPPING: MappingState = {
  targetColumn: "",
  positiveLabelKey: "",
  excludedColumns: [],
  idColumn: "",
};

function serializeChoice(value: DatasetValue): string {
  return JSON.stringify(value);
}

function deserializeChoice(value: string): DatasetValue {
  try {
     return JSON.parse(value) as DatasetValue;
  } catch {
     return value;
  }
}

function normalizeComparableValue(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function dedupeDatasetValues(values: DatasetValue[]): DatasetValue[] {
  const seen = new Set<string>();
  const result: DatasetValue[] = [];
  for (const value of values) {
    const comparable = normalizeComparableValue(value);
    if (seen.has(comparable)) continue;
    seen.add(comparable);
    result.push(value);
  }
  return result;
}

function formatDatasetValue(value: DatasetValue): string {
  if (value === null) return "Null";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

function getCandidateCount(stats: ColumnStats, labelKey: string): number {
  const comparable = normalizeComparableValue(deserializeChoice(labelKey));
  return stats.topValues.reduce(
    (total, entry) => total + (normalizeComparableValue(entry.value) === comparable ? entry.count : 0),
    0,
  );
}

function getCandidateLabels(stats: ColumnStats | null | undefined): DatasetValue[] {
  return stats ? dedupeDatasetValues(stats.candidateLabels) : [];
}

function getColumnSuitability(column: ColumnDefinition): {
  selectable: boolean;
  tone: "success" | "warning" | "danger" | "ghost";
  label: string;
  reason: string;
} {
  const stats = column.stats;
  if (!stats) {
    return {
      selectable: false,
      tone: "warning",
      label: "Profiling",
      reason: "Full-dataset insights are still being refreshed.",
    };
  }
  if (stats.looksLikeIdentifier) {
    return {
      selectable: false,
      tone: "warning",
      label: "Identifier",
      reason: "Identifier-like columns should stay excluded from model outcomes.",
    };
  }
  if (stats.uniqueCount <= 1) {
    return {
      selectable: false,
      tone: "danger",
      label: "Constant",
      reason: "Only one distinct value detected.",
    };
  }
  if (stats.uniqueCount > 12) {
    return {
      selectable: false,
      tone: "warning",
      label: "High Cardinality",
      reason: `${stats.uniqueCount} distinct values detected.`,
    };
  }
  if (stats.isBinaryCandidate) {
    return {
      selectable: true,
      tone: "success",
      label: "Outcome Ready",
      reason: "Binary target candidate.",
    };
  }
  return {
    selectable: true,
    tone: "ghost",
    label: "Selectable",
    reason: `${stats.uniqueCount} distinct values detected.`,
  };
}

function buildInitialMapping(preview: PreviewData): MappingState {
  if (preview.mapping) {
    return {
      targetColumn: preview.mapping.targetColumn,
      positiveLabelKey: serializeChoice(preview.mapping.positiveLabel),
      excludedColumns: Array.from(new Set(preview.mapping.excludedColumns ?? [])),
      idColumn: preview.mapping.idColumn ?? "",
    };
  }

  const identifierColumn = preview.columns.find((column) => column.stats?.looksLikeIdentifier);
  const binaryCandidates = preview.columns.filter((column) => getColumnSuitability(column).selectable && column.stats?.isBinaryCandidate);

  return {
    targetColumn: preview.statsReady && binaryCandidates.length === 1 ? binaryCandidates[0].name : "",
    positiveLabelKey: "",
    excludedColumns: identifierColumn ? [identifierColumn.name] : [],
    idColumn: identifierColumn?.name ?? "",
  };
}

function buildMappingValidation(preview: PreviewData | undefined, mapping: MappingState): MappingValidation {
  if (!preview) {
    return { state: "info", title: "Select a portfolio", message: "Choose a dataset to review its schema.", positiveCount: 0, negativeCount: 0, total: 0 };
  }

  if (preview.profileStatus === "processing" || !preview.statsReady) {
    return { state: "pending", title: "Profiling Dataset", message: "Refreshing full-dataset insights...", positiveCount: 0, negativeCount: 0, total: preview.rowCount };
  }

  if (!mapping.targetColumn) {
    return { state: "info", title: "Choose Outcome", message: "Pick the column representing the underwriting decision.", positiveCount: 0, negativeCount: 0, total: preview.rowCount };
  }

  const targetColumn = preview.columns.find((column) => column.name === mapping.targetColumn);
  if (!targetColumn) {
    return { state: "error", title: "Unavailable", message: "Selected column no longer exists.", positiveCount: 0, negativeCount: 0, total: preview.rowCount };
  }

  const suitability = getColumnSuitability(targetColumn);
  if (!suitability.selectable || !targetColumn.stats) {
    return { state: "error", title: "Not Suitable", message: suitability.reason, targetColumn, positiveCount: 0, negativeCount: 0, total: targetColumn.stats?.nonNullCount ?? preview.rowCount };
  }

  if (!mapping.positiveLabelKey) {
    return { state: "warning", title: "Approval Value", message: "Select which value represents an approval.", targetColumn, positiveCount: 0, negativeCount: targetColumn.stats.nonNullCount, total: targetColumn.stats.nonNullCount };
  }

  const selectedLabel = deserializeChoice(mapping.positiveLabelKey);
  const positiveCount = getCandidateCount(targetColumn.stats, mapping.positiveLabelKey);
  const negativeCount = targetColumn.stats.nonNullCount - positiveCount;

  return {
    state: "ready",
    title: "Mapping Ready",
    message: "The outcome split is valid. Ready for calibration.",
    targetColumn,
    selectedLabel,
    positiveCount,
    negativeCount,
    total: targetColumn.stats.nonNullCount,
  };
}

export function DatasetsPage({ auth }: { auth: AuthContextValue }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<PageMode>("list");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<MappingState>(EMPTY_MAPPING);
  const [initializedDatasetId, setInitializedDatasetId] = useState<string | null>(null);
  const [initialMapping, setInitialMapping] = useState<MappingState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatasetListItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // File upload with progress
  const { upload, cancel, isUploading, percentage } = useFileUpload();

  const datasets = useQuery<DatasetListItem[]>({
    queryKey: ["datasets", auth.session?.token],
    queryFn: () => apiFetch("/datasets", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  const preview = useQuery<PreviewData>({
    queryKey: ["dataset-preview", selectedDataset, auth.session?.token],
    enabled: Boolean(selectedDataset) && mode === "mapping" && !!auth.session?.token,
    queryFn: () => apiFetch(`/datasets/${selectedDataset}/preview`, { token: auth.session?.token }),
    refetchInterval: (query) => {
      const data = query.state.data as PreviewData | undefined;
      return data && (data.profileStatus === "processing" || !data.statsReady) ? 2500 : false;
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      await upload(selectedFile, {
        url: `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:4000'}/api/v1/datasets`,
        token: auth.session?.token,
        onSuccess: (data) => {
          setUploadSuccess(true);
          queryClient.invalidateQueries({ queryKey: ["datasets"] });
          setSelectedDataset(data.id);
          setMode("mapping");
        },
        onError: (error) => {
          setUploadError(error.message);
          toast.error(error.message);
        }
      });
    } catch {
      // Error handled in onError callback
    }
  };

  const mappingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDataset) throw new Error("Choose a dataset first.");
      return apiFetch(`/datasets/${selectedDataset}/mapping`, {
        method: "POST",
        token: auth.session?.token,
        body: {
          targetColumn: mapping.targetColumn.trim(),
          positiveLabel: deserializeChoice(mapping.positiveLabelKey),
          excludedColumns: Array.from(new Set(mapping.excludedColumns.filter((column) => column !== mapping.targetColumn))),
          idColumn: mapping.idColumn || undefined,
        },
      });
    },
    onSuccess: () => {
       toast.success("Schema saved. Dataset is ready for training.");
       queryClient.invalidateQueries({ queryKey: ["datasets"] });
       setMode("list");
       setSelectedDataset(null);
       setInitializedDatasetId(null);
    },
    onError: (err: any) => {
       toast.error(err?.message || "Failed to save schema mapping. Please try again.");
    }
  });

  const calibrateMutation = useMutation({
    mutationFn: async (datasetId: string) => {
      return apiFetch("/models/train", {
        method: "POST",
        token: auth.session?.token,
        body: { datasetId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Training started. Track progress on the Models page.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Training failed to start. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (datasetId: string) =>
      apiFetch(`/datasets/${datasetId}`, { method: "DELETE", token: auth.session?.token }),
    onSuccess: (_result, deletedDatasetId) => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["model-versions"] });
      queryClient.removeQueries({ queryKey: ["dataset-preview", deletedDatasetId] });
      if (selectedDataset === deletedDatasetId) {
        setMode("list");
        setSelectedDataset(null);
        setMapping(EMPTY_MAPPING);
        setInitialMapping(null);
        setInitializedDatasetId(null);
      }
      toast.success("Dataset deleted and related model access removed.");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Delete failed. Please try again.");
    },
  });

  useEffect(() => {
    if (!preview.data || !selectedDataset || initializedDatasetId === selectedDataset) return;
    const initial = buildInitialMapping(preview.data);
    setMapping(initial);
    setInitialMapping(initial);
    setInitializedDatasetId(selectedDataset);
  }, [preview.data, selectedDataset, initializedDatasetId]);

  // Detect unsaved changes in mapping mode
  const hasUnsavedMappingChanges = useMemo(() => {
    if (mode !== "mapping" || !initialMapping) return false;
    return (
      mapping.targetColumn !== initialMapping.targetColumn ||
      mapping.positiveLabelKey !== initialMapping.positiveLabelKey ||
      mapping.excludedColumns.length !== initialMapping.excludedColumns.length ||
      mapping.excludedColumns.some((col, i) => col !== initialMapping.excludedColumns[i]) ||
      mapping.idColumn !== initialMapping.idColumn
    );
  }, [mode, mapping, initialMapping]);

  // Warn before leaving with unsaved changes
  useBeforeUnload(hasUnsavedMappingChanges, "You have unsaved mapping changes. Are you sure you want to leave?");

  // Auto-save mapping every 5 seconds when in mapping mode
  useAutoSave({
    key: `dataset-mapping-${selectedDataset || 'draft'}`,
    data: mapping,
    interval: 5000,
    enabled: mode === "mapping" && !!selectedDataset,
  });

  const filteredDatasets = useMemo(() => {
    return datasets.data ?? [];
  }, [datasets.data]);

  const validation = useMemo(() => buildMappingValidation(preview.data, mapping), [preview.data, mapping]);

  // Table Column Definitions: Dataset List
  const datasetColumns: TableColumn<DatasetListItem>[] = [
    {
      header: 'Filename',
      accessor: 'fileName',
      render: (row) => (
        <div className="flex items-center gap-3">
           <FileSpreadsheet className="text-base-600 h-4 w-4" />
           <span className="text-sm font-bold text-base-50">{row.fileName}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusMap: Record<string, { tone: 'success' | 'warning' | 'danger' | 'ghost' | 'primary'; label: string }> = {
          mapped: { tone: 'success', label: 'Ready' },
          ready: { tone: 'success', label: 'Ready' },
          processing: { tone: 'warning', label: 'Profiling' },
          profiling: { tone: 'warning', label: 'Profiling' },
          pending: { tone: 'ghost', label: 'Pending' },
          uploaded: { tone: 'primary', label: 'Uploaded' },
          failed: { tone: 'danger', label: 'Failed' },
          error: { tone: 'danger', label: 'Failed' },
        };
        const normalized = (row.status ?? 'unknown').toString().toLowerCase();
        const config = statusMap[normalized] ?? { tone: 'ghost' as const, label: normalized || 'Unknown' };
        return (
          <Badge tone={config.tone}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Rows',
      accessor: 'rowCount',
      className: 'text-sm font-bold text-base-200 tabular-nums hidden sm:table-cell',
      render: (row) => row.rowCount.toLocaleString(),
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      render: (row) => {
        const disabledReason =
          row.status !== 'mapped'
            ? row.status === 'processing'
              ? 'Dataset is still being profiled. Wait until profiling completes.'
              : 'Map the target column before training can start.'
            : calibrateMutation.isPending && calibrateMutation.variables === row.id
              ? 'Training request already in flight.'
              : null;

        const trainButton = (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play size={12} />}
            loading={calibrateMutation.isPending && calibrateMutation.variables === row.id}
            onClick={() => calibrateMutation.mutate(row.id)}
            disabled={!!disabledReason}
          >
            Train Model
          </Button>
        );

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelectedDataset(row.id); setMode("mapping"); }}>
              Configure
            </Button>
            {disabledReason ? (
              <Tooltip content={disabledReason} placement="top">
                <span>{trainButton}</span>
              </Tooltip>
            ) : (
              trainButton
            )}
            <Tooltip content="Delete this dataset" placement="top">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={12} />}
                onClick={() => setDeleteTarget(row)}
                disabled={deleteMutation.isPending}
                aria-label={`Delete dataset ${row.fileName}`}
              >
                Delete
              </Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  // Table Column Definitions: Schema Review
  const schemaColumns: TableColumn<ColumnDefinition>[] = [
    {
      header: 'Field Name',
      accessor: 'name',
      render: (row) => {
        const isTarget = mapping.targetColumn === row.name;
        return (
          <div className="flex items-center gap-3">
             <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${isTarget ? 'bg-primary border-primary' : 'border-base-700'}`}>
                {isTarget && <CheckCircle2 size={12} className="text-white" />}
             </div>
             <span className={`text-sm font-bold ${isTarget ? 'text-primary' : 'text-base-200'}`}>{row.name}</span>
          </div>
        );
      },
    },
    {
      header: 'Inferred Type',
      accessor: 'inferredType',
      align: 'center',
      render: (row) => <Badge tone="ghost" size="xs">{row.inferredType}</Badge>,
    },
    {
      header: 'Suitability',
      accessor: (row) => getColumnSuitability(row).label,
      align: 'right',
      render: (row) => {
        const suitability = getColumnSuitability(row);
        return <Badge tone={suitability.tone} size="xs">{suitability.label}</Badge>;
      },
    },
  ];

  if (datasets.error && mode === "list") {
    return <InlineError message={(datasets.error as Error).message} />;
  }

  if (datasets.isLoading && mode === "list") {
     return (
       <div className="py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <SkeletonLoader variant="rectangle" height="100px" />
             <SkeletonLoader variant="rectangle" height="100px" />
             <SkeletonLoader variant="rectangle" height="100px" />
          </div>
          <SkeletonLoader variant="rectangle" height="500px" />
       </div>
     );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
           <h1 className="text-xl sm:text-2xl font-semibold text-base-50">Datasets</h1>
           <p className="text-sm text-base-500 mt-1">Manage your data and configure results.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           {mode === "list" ? (
            <Button onClick={() => setMode("upload")} variant="primary" leftIcon={<Plus size={16} />} className="w-full md:w-auto">
              Upload Dataset
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setMode("list")} leftIcon={<ArrowLeft size={16} />} className="w-full md:w-auto">
              Back to Datasets
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Stepper - horizontal scroll on mobile, grid on md+ */}
      <div className="-mx-4 sm:mx-0 overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-[minmax(120px,1fr)] sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-5 gap-3 sm:gap-4 px-4 sm:px-0 min-w-max sm:min-w-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const activeIndex = mode === 'upload' ? 0 : mode === 'mapping' ? 1 : -1;
            const isActive = i === activeIndex;
            const isComplete = activeIndex !== -1 && i < activeIndex;
            return (
              <div
                key={i}
                className={`p-3 sm:p-4 border rounded-lg relative ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : isComplete
                      ? 'border-success bg-success/5'
                      : 'border-base-800 bg-base-900'
                }`}
              >
                 <div className="flex flex-col">
                    <span className={`text-xs mb-1 ${
                      isActive ? 'text-primary' : isComplete ? 'text-success' : 'text-base-500'
                    }`}>Step {i+1}</span>
                    <p className={`text-sm truncate ${
                      isActive ? 'text-base-50' : isComplete ? 'text-base-200' : 'text-base-400'
                    }`}>{step}</p>
                 </div>
                 {isActive && <div className="absolute bottom-0 left-0 h-1 bg-primary w-full animate-in slide-in-from-left duration-700" />}
                 {isComplete && <div className="absolute bottom-0 left-0 h-1 bg-success/60 w-full" />}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "list" ? (
          <motion.div 
            key="list" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
               <ShinyMetricCard title="Total Datasets" value={datasets.data?.length ?? 0} icon={Database} />
               <ShinyMetricCard title="Ready for Training" value={datasets.data?.filter(d => d.status === 'mapped').length ?? 0} icon={CheckCircle2} />
               <ShinyMetricCard title="Processing" value={datasets.data?.filter(d => d.status === 'processing').length ?? 0} icon={LoaderCircle} />
            </div>

            <div className="space-y-4">
               <h2 className="text-lg sm:text-xl font-bold tracking-tight">Your Datasets</h2>

               <div className="-mx-4 sm:mx-0 overflow-x-auto">
                 <Table
                   data={filteredDatasets}
                   columns={datasetColumns}
                   loading={datasets.isLoading}
                   className="shadow-2xl min-w-[720px] sm:min-w-0"
                 />
               </div>
               {filteredDatasets.length === 0 && !datasets.isLoading && (
                 <div className="py-16 text-center border border-base-800 rounded-lg bg-base-900/20">
                   <p className="text-sm text-base-400">No datasets found.</p>
                   <p className="text-xs text-base-600 mt-1">
                     Upload a dataset to get started.
                   </p>
                 </div>
               )}
            </div>
          </motion.div>
        ) : mode === "upload" ? (
          <motion.div 
            key="upload" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }} 
            className="max-w-xl mx-auto py-12"
          >
             <Card padded className="border-base-800 text-center space-y-8 bg-base-900/50 shadow-3xl">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                   <Upload size={40} />
                </div>
                 <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-base-50">Upload Data</h2>
                    <p className="text-sm text-base-500">Provide a file (CSV/XLSX) containing loan data to train your model.</p>
                 </div>
                
                {selectedFile ? (
                  <UploadProgress
                    fileName={selectedFile.name}
                    percentage={percentage}
                    isUploading={isUploading}
                    isSuccess={uploadSuccess}
                    isError={!!uploadError}
                    errorMessage={uploadError || undefined}
                    onCancel={cancel}
                    onRetry={handleUpload}
                  />
                ) : (
                  <div className="p-12 border-2 border-dashed border-base-800 rounded-pro-lg hover:border-primary/40 focus-within:border-primary/60 transition-all group cursor-pointer relative bg-base-950/40" style={{ minHeight: '160px' }}>
                     <input
                       type="file"
                       accept=".csv,.txt,.tsv,.xls,.xlsx,.xlsm,.ods,.parquet,.json,text/csv,text/plain,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/json"
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                       onChange={(e) => {
                         const file = e.target.files?.[0] || null;
                         if (file && file.size > 50 * 1024 * 1024) {
                           setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.`);
                           setSelectedFile(null);
                           e.target.value = "";
                           return;
                         }
                         setSelectedFile(file);
                         setUploadError(null);
                         setUploadSuccess(false);
                       }}
                     />
                     <div className="space-y-2">
                        <p className="text-sm font-bold text-base-200">Drop files here or click to browse</p>
                        <p className="text-[10px] text-base-600 font-bold uppercase tracking-widest">CSV or Excel • Max 50 MB</p>
                     </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                   <Button 
                     variant="ghost" 
                     className="flex-1" 
                     onClick={() => {
                       setMode("list");
                       setSelectedFile(null);
                       setUploadError(null);
                     }}
                     disabled={isUploading}
                   >
                     Discard
                   </Button>
                   <Button 
                      variant="primary" 
                      className="flex-1" 
                      loading={isUploading} 
                      onClick={handleUpload} 
                      disabled={!selectedFile || isUploading}
                   >
                      {isUploading ? 'Uploading...' : 'Start Analysis'}
                   </Button>
                </div>
             </Card>
          </motion.div>
        ) : (
          <motion.div
            key="mapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
             <div className="lg:col-span-8 space-y-4 sm:space-y-6 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-3">
                       <Target className="h-5 w-5 text-primary shrink-0" />
                       Configure Columns
                    </h3>
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest">
                         {preview.data?.columns?.length ?? 0} columns detected
                      </span>
                   </div>
                </div>

                {preview.isError && (
                  <InlineError message={(preview.error as Error).message} />
                )}
                <div className="-mx-4 sm:mx-0 overflow-x-auto">
                  <Table
                     data={preview.data?.columns || []}
                     columns={schemaColumns}
                     loading={preview.isLoading}
                     rowId="name"
                     onRowClick={(row) => {
                        const suitability = getColumnSuitability(row);
                        if (suitability.selectable) {
                           setMapping(m => ({ ...m, targetColumn: row.name }));
                        }
                     }}
                     className="shadow-2xl min-w-[560px] sm:min-w-0"
                  />
                </div>
             </div>

             {/* Sticky Control Panel - NOT sticky on mobile to avoid cramped layout */}
             <div className="lg:col-span-4 space-y-6">
                <div className="lg:sticky lg:top-[72px]">
                   <Card border padded className="bg-base-900 border-base-800 shadow-xl overflow-hidden">
                      <div className="space-y-8">
                         <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest leading-none">Status</span>
                                <Badge tone={validation.state === 'ready' ? 'success' : 'warning'}>{validation.state}</Badge>
                             </div>
                            <div className="p-4 border rounded-pro bg-base-950 border-base-800 relative overflow-hidden">
                               <div className="flex gap-4">
                                  <div className="mt-1"><Info size={16} className="text-primary" /></div>
                                  <div className="space-y-1">
                                     <p className="text-xs font-bold text-base-50">{validation.title}</p>
                                     <p className="text-[11px] text-base-500 leading-normal">{validation.message}</p>
                                  </div>
                               </div>
                               {validation.state === 'ready' && <div className="absolute left-0 top-0 h-full w-1 bg-success" />}
                            </div>
                         </div>

                         {mapping.targetColumn && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                               <div className="space-y-2">
                                   <label className="text-[10px] font-bold text-base-500 uppercase tracking-widest ml-1">Approval Value</label>
                                   <Select 
                                      value={mapping.positiveLabelKey} 
                                      onChange={(val) => setMapping(m => ({ ...m, positiveLabelKey: val }))}
                                      placeholder="Select approval value..."
                                     options={getCandidateLabels(preview.data?.columns.find(c => c.name === mapping.targetColumn)?.stats).map(l => ({
                                        value: serializeChoice(l),
                                        label: formatDatasetValue(l)
                                     }))}
                                  />
                               </div>

                               <div className="space-y-2">
                                   <div className="flex items-center justify-between ml-1">
                                      <label className="text-[10px] font-bold text-base-500 uppercase tracking-widest">Identifier Column</label>
                                      <Badge tone="ghost" size="xs">Optional</Badge>
                                   </div>
                                   <Select 
                                      value={mapping.idColumn} 
                                      onChange={(val) => setMapping(m => ({ ...m, idColumn: val }))}
                                      placeholder="Select ID column (optional)..."
                                      options={preview.data?.columns.map(c => ({
                                         value: c.name,
                                         label: c.name
                                      })) || []}
                                   />
                                   <p className="text-[9px] text-base-600 italic px-1">Selected ID will be excluded from training.</p>
                               </div>

                               {validation.state === 'ready' && (
                                  <div className="grid grid-cols-2 gap-px p-px bg-base-800 rounded-pro overflow-hidden">
                                     <div className="p-4 bg-base-950 text-center">
                                        <p className="text-2xl font-bold text-success tabular-nums tracking-tighter">{validation.positiveCount}</p>
                                        <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Approvals</p>
                                      </div>
                                     <div className="p-4 bg-base-950 text-center">
                                        <p className="text-2xl font-bold text-warning tabular-nums tracking-tighter">{validation.negativeCount}</p>
                                        <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Rejections</p>
                                     </div>
                                  </div>
                               )}
                            </div>
                         )}

                         <div className="pt-2">
                             <Button 
                               className="w-full" 
                               disabled={validation.state !== 'ready'} 
                               loading={mappingMutation.isPending}
                               onClick={() => mappingMutation.mutate()}
                               rightIcon={<ArrowRight size={16} />}
                            >
                               Save and Continue
                            </Button>
                         </div>
                      </div>
                   </Card>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Delete dataset?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete permanently
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-base-100">
              You're about to permanently delete
              {" "}
              <span className="font-bold text-base-50">{deleteTarget?.fileName ?? "this dataset"}</span>
              {" "}
              and all its schema metadata.
            </p>
            <p className="text-xs text-base-500">
              Models and prediction inputs tied to this dataset will disappear from the workspace after deletion. This cannot be undone.
            </p>
            {deleteMutation.isError && (
              <InlineError message={(deleteMutation.error as Error)?.message ?? "Delete failed."} />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
