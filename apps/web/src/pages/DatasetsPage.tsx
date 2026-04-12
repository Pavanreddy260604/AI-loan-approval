import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  Database, 
  FileSpreadsheet, 
  LoaderCircle, 
  Play, 
  Search, 
  Plus, 
  Filter, 
  Info, 
  Upload, 
  Target,
  ArrowRight,
  ArrowLeft
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
  EliteInlineError as InlineError
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
  const [mode, setMode] = useState<PageMode>("list");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [mapping, setMapping] = useState<MappingState>(EMPTY_MAPPING);
  const [initializedDatasetId, setInitializedDatasetId] = useState<string | null>(null);

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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("Choose a file before continuing.");
      const formData = new FormData();
      formData.append("file", selectedFile);
      return apiFetch<any>("/datasets", { method: "POST", token: auth.session?.token, rawBody: formData });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      setSelectedDataset(data.id);
      setMode("mapping");
    },
  });

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
       queryClient.invalidateQueries({ queryKey: ["datasets"] });
       setMode("list");
       setSelectedDataset(null);
       setInitializedDatasetId(null);
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
       // Logic to show a standard "Training Started" notice could be added here
    }
  });

  useEffect(() => {
    if (!preview.data || !selectedDataset || initializedDatasetId === selectedDataset) return;
    setMapping(buildInitialMapping(preview.data));
    setInitializedDatasetId(selectedDataset);
  }, [preview.data, selectedDataset, initializedDatasetId]);

  const filteredDatasets = useMemo(() => {
    const search = datasetSearch.trim().toLowerCase();
    if (!search) return datasets.data ?? [];
    return (datasets.data ?? []).filter((d) => d.fileName.toLowerCase().includes(search));
  }, [datasetSearch, datasets.data]);

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
      render: (row) => (
        <Badge tone={row.status === 'mapped' ? 'success' : row.status === 'processing' ? 'warning' : 'ghost'}>
           {row.status}
        </Badge>
      ),
    },
    {
      header: 'Rows',
      accessor: 'rowCount',
      className: 'text-sm font-bold text-base-200 tabular-nums',
      render: (row) => row.rowCount.toLocaleString(),
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
           <Button variant="outline" size="sm" onClick={() => { setSelectedDataset(row.id); setMode("mapping"); }}>
             Configure
           </Button>
            <Button 
             variant="primary" 
             size="sm" 
             leftIcon={<Play size={12} />} 
             loading={calibrateMutation.isPending && calibrateMutation.variables === row.id}
             onClick={() => calibrateMutation.mutate(row.id)}
             disabled={row.status !== 'mapped' || calibrateMutation.isPending}
           >
             Train Model
           </Button>
        </div>
      ),
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-base-600 uppercase tracking-widest leading-none">Data Management</span>
           <h1 className="text-2xl font-bold tracking-tight text-base-50">Datasets</h1>
           <p className="text-sm text-base-500 mt-1">Manage your data and configure results.</p>
        </div>
        <div className="flex items-center gap-3">
           {mode === "list" ? (
            <Button onClick={() => setMode("upload")} variant="primary" leftIcon={<Plus size={16} />}>
              Upload Dataset
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setMode("list")} leftIcon={<ArrowLeft size={16} />}>
              Back to Datasets
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Stepper */}
      <div className="grid grid-cols-5 gap-4">
        {WORKFLOW_STEPS.map((step, i) => {
          const isActive = i === (mode === 'upload' ? 0 : mode === 'mapping' ? 1 : 0);
          return (
            <div 
              key={i} 
              className={`p-4 border rounded-pro overflow-hidden relative transition-all duration-300 ${isActive ? 'border-primary/20 bg-primary/5' : 'border-base-800 bg-base-900/40 opacity-50'}`}
            >
               <div className="flex flex-col">
                  <span className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-2 ${isActive ? 'text-primary' : 'text-base-600'}`}>Step 0{i+1}</span>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-base-50' : 'text-base-500'}`}>{step}</p>
               </div>
               {isActive && <div className="absolute bottom-0 left-0 h-1 bg-primary w-full animate-in slide-in-from-left duration-700" />}
            </div>
          );
        })}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <ShinyMetricCard title="Total Datasets" value={datasets.data?.length ?? 0} icon={Database} />
               <ShinyMetricCard title="Ready for Training" value={datasets.data?.filter(d => d.status === 'mapped').length ?? 0} icon={CheckCircle2} />
               <ShinyMetricCard title="Processing" value={datasets.data?.filter(d => d.status === 'processing').length ?? 0} icon={LoaderCircle} />
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Your Datasets</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-base-900 border border-base-800 rounded-pro text-[10px] font-bold text-base-500 hover:text-base-300 transition-colors">
                     <Search size={14} className="mr-2" /> 
                     <input
                       placeholder="Search datasets..."
                       className="bg-transparent border-none text-[11px] p-0 focus:ring-0 w-32 outline-none"
                       onChange={(e) => setDatasetSearch(e.target.value)}
                       aria-label="Search datasets"
                     />
                  </div>
               </div>

               <Table
                 data={filteredDatasets}
                 columns={datasetColumns}
                 loading={datasets.isLoading}
                 className="shadow-2xl"
               />
               {filteredDatasets.length === 0 && !datasets.isLoading && (
                 <div className="py-16 text-center border border-base-800 rounded-lg bg-base-900/20">
                   <p className="text-sm text-base-400">No datasets found.</p>
                   <p className="text-xs text-base-600 mt-1">
                     {datasetSearch ? "Try a different search term." : "Upload a dataset to get started."}
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
                
                <div className="p-12 border-2 border-dashed border-base-800 rounded-pro-lg hover:border-primary/40 focus-within:border-primary/60 transition-all group cursor-pointer relative bg-base-950/40">
                   <input 
                     type="file" 
                     className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                     onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                   />
                   <div className="space-y-2">
                      <p className="text-sm font-bold text-base-200">{selectedFile?.name || "Drop files here or click to browse"}</p>
                      <p className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Max size 50MB • Tabular format required</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                   <Button variant="ghost" className="flex-1" onClick={() => setMode("list")}>Discard</Button>
                   <Button 
                      variant="primary" 
                      className="flex-1" 
                      loading={uploadMutation.isPending} 
                      onClick={() => uploadMutation.mutate()} 
                      disabled={!selectedFile}
                   >
                      Start Analysis
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
             <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
                       <Target className="h-5 w-5 text-primary" />
                       Configure Columns
                    </h3>
                   <div className="flex items-center gap-2">
                      <Button variant="outline" size="xs" leftIcon={<Search size={12} />}>Search Fields</Button>
                      <Button variant="outline" size="xs" leftIcon={<Filter size={12} />}>Filter</Button>
                   </div>
                </div>

                {preview.isError && (
                  <InlineError message={(preview.error as Error).message} />
                )}
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
                   className="shadow-2xl"
                />
             </div>

             {/* Sticky Control Panel */}
             <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-[72px]">
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
    </div>
  );
}
