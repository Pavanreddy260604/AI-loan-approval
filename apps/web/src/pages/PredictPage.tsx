import { useState, useRef, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Zap, 
  Upload, 
  ArrowRight,
  BrainCircuit,
  BarChart3,
  ShieldCheck,
  Info,
  Layers,
  Download,
  LoaderCircle,
  UserCheck,
  CheckCircle2,
  Activity,
  FileText,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EliteCard as Card, 
  EliteButton as Button, 
  EliteInput as Input, 
  EliteBadge as Badge, 
  EliteSelect as Select
} from "../components/ui";
import { apiFetch, toGatewayUrl } from "../lib/api";
import { type AuthContextValue } from "../App";

import { 
  type BatchJobStatus,
  type PredictResponse as PredictionResult
} from "@ai-loan/contracts";

interface PredictionDetail {
  predictionId: string;
  approved: boolean;
  decision: "Approved" | "Rejected";
  probability: number;
  explanation?: PredictionResult["explanation"];
  fraud?: PredictionResult["fraud"];
}

const ENRICHMENT_TIMEOUT_MS = 20_000;

export function PredictPage({ auth }: { auth: AuthContextValue }) {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState<number | "">("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);
  const [predictionPollDeadline, setPredictionPollDeadline] = useState<number | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleMagicFill = (index: number = 0) => {
    if (!datasetDetail.data?.preview?.[index] || !formRef.current) return;
    const sample = datasetDetail.data.preview[index];
    const form = formRef.current;
    
    Object.entries(sample).forEach(([key, value]) => {
      const input = form.elements.namedItem(key) as HTMLInputElement | null;
      if (input) input.value = value === null ? "" : String(value);
    });
  };

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

  const singleMutation = useMutation<PredictionResult, Error, any>({
    mutationFn: async (payload: any) =>
      apiFetch("/predict", { method: "POST", token: auth.session?.token, body: payload }),
    onSuccess: (result) => {
      setShowExplanation(false);
      setActivePredictionId(result.predictionId);
      setPredictionPollDeadline(Date.now() + ENRICHMENT_TIMEOUT_MS);
    },
  });

  const predictionDetail = useQuery<PredictionDetail>({
    queryKey: ["prediction-detail", activePredictionId, auth.session?.token],
    queryFn: () => apiFetch(`/predictions/${activePredictionId}`, { token: auth.session?.token }),
    enabled: !!activePredictionId && !!auth.session?.token && !!predictionPollDeadline,
    refetchInterval: (query) => {
      if (!predictionPollDeadline || Date.now() > predictionPollDeadline) return false;
      const data = query.state.data as PredictionDetail | undefined;
      return needsEnrichment(data ?? (singleMutation.data as any)) ? 2000 : false;
    },
  });

  const batchMutation = useMutation<BatchJobStatus, Error, any>({
    mutationFn: async (payload: { file: File; datasetId: string }) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("datasetId", payload.datasetId);
      return apiFetch("/predict/batch", { method: "POST", token: auth.session?.token, rawBody: formData });
    },
    onSuccess: (result) => setBatchJobId(result.batchJobId),
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

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-base-600 uppercase tracking-widest leading-none">Decision Tool</span>
           <h1 className="text-2xl font-bold tracking-tight text-base-50">Make Decisions</h1>
           <p className="text-sm text-base-500 mt-1">Check individual loans or upload a list of loans for quick decisions.</p>
        </div>
        <div className="flex p-1 bg-base-900 border border-base-800 rounded-pro shadow-inner">
           <button 
             onClick={() => setActiveTab("single")} 
             className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-pro transition-all duration-300 ${activeTab === 'single' ? 'bg-primary text-white shadow-elite-primary' : 'text-base-500 hover:text-base-300'}`}
           >
             One Loan
           </button>
           <button 
             onClick={() => setActiveTab("batch")} 
             className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-pro transition-all duration-300 ${activeTab === 'batch' ? 'bg-primary text-white shadow-elite-primary' : 'text-base-500 hover:text-base-300'}`}
           >
             Many Loans (Batch)
           </button>
        </div>
      </div>

      <Card padded border className="bg-base-900 border-base-800 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
           <Select 
             label="AI Model"
             value={selectedDatasetId}
             placeholder="Select an AI Scorecard..."
             options={(datasets.data || []).map((ds: any) => ({ label: ds.fileName, value: ds.id }))}
             onChange={(val) => { setSelectedDatasetId(val); setSelectedApplicantIndex(""); }}
           />
           {selectedDatasetId ? (
              <div className="flex items-center gap-4 bg-base-950 p-4 border border-base-800 rounded-pro animate-in slide-in-from-right-4">
                 <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <BrainCircuit size={20} />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-base-600 uppercase tracking-widest leading-none">Active Scorecard</p>
                    <p className="text-sm font-bold text-base-50 mt-1">{activeModel?.championFamily || "Standard Inference Model"}</p>
                 </div>
                 <Badge tone="success" className="ml-auto shadow-sm">Ready</Badge>
              </div>
           ) : (
              <div className="flex items-center gap-3 text-base-600 italic text-xs px-2">
                 <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                 <span>Select an AI Scorecard to begin automated decisioning</span>
              </div>
           )}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {activeTab === "single" ? (
          <motion.div 
            key="single" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
             <div className="lg:col-span-7 space-y-6">
                <Card padded border className="bg-base-900/40 border-base-800 shadow-3xl">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-base-800/50">
                      <h3 className="font-bold tracking-tight text-base-50 flex items-center gap-2">
                         <FileText size={18} className="text-primary" />
                         Loan Details
                      </h3>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        leftIcon={<Zap size={14} />} 
                        onClick={() => handleMagicFill(0)} 
                        disabled={!datasetDetail.data?.preview?.length}
                        className="text-[10px] uppercase tracking-widest"
                      >
                         Magic Fill
                      </Button>
                   </div>
                   
                   <form ref={formRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const features = Object.fromEntries(Array.from(formData.entries()).map(([k,v]) => [k, isNaN(Number(v)) ? v : Number(v)]));
                      singleMutation.mutate({ datasetId: selectedDatasetId, features, explain: true });
                   }}>
                      {(() => {
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
                         
                         if (!names.length) return Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                               <div className="h-3 w-20 bg-base-800 rounded animate-pulse" />
                               <div className="h-10 bg-base-950/50 border border-base-800 rounded-pro animate-pulse" />
                            </div>
                         ));
                         
                         // Dedup with Set for performance (O(n) instead of O(n^2))
                         return Array.from(new Set(names)).map(name => (
                            <Input 
                               key={name} 
                               name={name}
                               label={name.replace(/_/g, ' ')} 
                               placeholder="0.00" 
                               className="text-base-50"
                            />
                         ));
                      })()}
                      <div className="sm:col-span-2 pt-6">
                         <Button 
                           className="w-full h-12 shadow-elite-primary" 
                           type="submit" 
                           loading={singleMutation.isPending} 
                           disabled={!selectedDatasetId}
                           rightIcon={<ChevronRight size={18} />}
                         >
                            Get Decision
                         </Button>
                      </div>
                   </form>
                </Card>

                <Card border className="p-6 bg-base-900/60 border-base-800 shadow-xl">
                   <div className="flex items-center gap-3 mb-4">
                      <UserCheck size={18} className="text-primary" />
                      <h3 className="text-xs font-bold text-base-50 uppercase tracking-widest">Example Data</h3>
                   </div>
                   <Select 
                      value={selectedApplicantIndex === "" ? "" : String(selectedApplicantIndex)}
                      placeholder="Browse training samples..."
                      options={(datasetDetail.data?.preview || []).map((row: any, i: number) => ({ 
                         label: String(row[datasetDetail.data?.mapping?.idColumn] || `Instance #${i+1}`), 
                         value: String(i) 
                      }))}
                      onChange={(val) => { 
                         const idx = val === "" ? "" : Number(val); 
                         setSelectedApplicantIndex(idx); 
                         if (idx !== "") handleMagicFill(idx); 
                      }}
                   />
                </Card>
             </div>

             <div className="lg:col-span-5">
                <Card border padded className={`sticky top-[72px] transition-all duration-700 bg-base-900 border-base-800 shadow-3xl overflow-hidden ${singleMutation.isSuccess ? 'ring-1 ring-inset ring-primary/20' : 'opacity-40 grayscale-[0.5]'}`}>
                   <div className="flex items-center justify-between mb-10 pb-4 border-b border-base-800/50 relative z-10">
                      <div>
                         <h3 className="font-bold tracking-tight text-lg text-base-50">AI Decision Matrix</h3>
                         <p className="text-[10px] text-base-600 font-bold uppercase tracking-widest mt-1 italic leading-none">Real-time inference pipeline</p>
                      </div>
                      <AnimatePresence mode="wait">
                         {singleMutation.isSuccess && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                               <Badge tone={displayedPrediction?.approved ? 'success' : 'danger'} size="md" className="shadow-lg">
                                  {displayedPrediction?.decision}
                               </Badge>
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   {singleMutation.isSuccess ? (
                      <div className="space-y-12 relative z-10">
                         <div className="flex flex-col">
                            <div className="flex items-baseline gap-3">
                               <span className="text-6xl font-black text-base-50 tabular-nums tracking-tighter">
                                  {((displayedPrediction?.probability ?? 0) * 100).toFixed(1)}%
                               </span>
                               <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest mb-1.5">Accuracy</span>
                            </div>
                            <div className="h-2 w-full bg-base-950 rounded-full mt-6 overflow-hidden border border-base-800 p-px">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(displayedPrediction?.probability ?? 0) * 100}%` }}
                                 transition={{ duration: 1, ease: "easeOut" }}
                                 className={`h-full rounded-full ${displayedPrediction?.approved ? 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.3)]'}`} 
                               />
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-base-800/50 pb-2">
                               <p className="text-[10px] font-bold text-base-500 uppercase tracking-widest flex items-center gap-2">
                                  <BarChart3 size={16} className="text-primary" /> Why this decision?
                               </p>
                               {predictionDetail.isLoading && <LoaderCircle size={14} className="animate-spin text-warning" />}
                            </div>
                            <div className="space-y-5">
                               {showExplanation ? (
                                  (displayedPrediction?.explanation?.topContributors || []).slice(0, 6).map((exp: any, i: number) => (
                                     <div key={i} className="space-y-2 animate-in fade-in slide-in-from-bottom-1" style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className="flex items-center justify-between text-xs font-bold font-mono">
                                           <span className="text-base-400">{exp.feature.replace(/_/g, ' ')}</span>
                                           <span className={exp.impact > 0 ? 'text-success' : 'text-danger'}>
                                              {exp.impact > 0 ? '+' : ''}{exp.impact.toFixed(4)}
                                           </span>
                                        </div>
                                        <div className="h-1 bg-base-950 rounded-full overflow-hidden flex items-center">
                                           {exp.impact > 0 ? (
                                              <div className="h-full bg-success opacity-40 ml-[50%]" style={{ width: `${Math.min(50, exp.impact * 200)}%` }} />
                                           ) : (
                                              <div className="h-full bg-danger opacity-40 mr-[50%] ml-auto" style={{ width: `${Math.min(50, Math.abs(exp.impact) * 200)}%` }} />
                                           )}
                                        </div>
                                     </div>
                                  ))
                               ) : (
                                  <div className="pt-2">
                                     <Button 
                                       variant="secondary" 
                                       className="w-full h-11 text-[10px] uppercase tracking-widest font-black shadow-inner" 
                                       onClick={() => setShowExplanation(true)} 
                                       disabled={displayedPrediction?.explanation?.isComputing}
                                       leftIcon={displayedPrediction?.explanation?.isComputing ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                     >
                                        {displayedPrediction?.explanation?.isComputing ? "Analyzing reasons..." : "Show Details"}
                                     </Button>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="py-32 text-center space-y-6">
                         <div className="relative inline-block">
                            <div className={`absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-1000 ${singleMutation.isPending ? 'scale-150 animate-pulse' : 'scale-100 opacity-0'}`} />
                            <Activity size={48} className={`relative mx-auto transition-colors duration-500 ${singleMutation.isPending ? 'text-primary' : 'text-base-800'}`} />
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-black text-base-500 uppercase tracking-[0.2em]">
                               {singleMutation.isPending ? "Calculating..." : "Ready"}
                            </p>
                            <p className="text-[10px] text-base-700 font-bold uppercase tracking-widest">
                               Enter details to check loan
                            </p>
                         </div>
                      </div>
                   )}

                   {/* Background element */}
                   <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                </Card>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="batch" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="max-w-2xl mx-auto space-y-8 py-8"
          >
             <Card padded border className="p-12 border-base-800 text-center space-y-10 bg-base-900/40 shadow-3xl">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-inner">
                   <Layers size={40} />
                </div>
                <div className="space-y-3">
                   <h2 className="text-2xl font-black tracking-tight text-base-50">Batch Upload</h2>
                   <p className="text-sm text-base-500 max-w-sm mx-auto">Upload a file (.CSV, .XLSX) to process many loans at once.</p>
                </div>
                <form className="space-y-8" onSubmit={(e) => {
                   e.preventDefault();
                   const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
                   if (file) batchMutation.mutate({ file, datasetId: selectedDatasetId });
                }}>
                   <label className="p-16 border-2 border-dashed border-base-800 rounded-pro-lg hover:border-primary/40 focus-within:border-primary/60 transition-all group cursor-pointer relative block bg-base-950/30">
                      <input type="file" name="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="space-y-3">
                         <div className="h-10 w-10 bg-base-800 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                            <Upload size={20} className="text-base-400 group-hover:text-primary transition-colors" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-sm font-bold text-base-300">Choose a file to start</p>
                            <p className="text-[10px] text-base-600 font-bold uppercase tracking-widest">Supports CSV and Excel files • Max 500MB</p>
                         </div>
                      </div>
                   </label>
                   <Button 
                     className="w-full h-12 shadow-elite-primary" 
                     type="submit" 
                     loading={batchMutation.isPending} 
                     disabled={!selectedDatasetId}
                     rightIcon={<ArrowRight size={18} />}
                   >
                     Start Checking
                   </Button>
                </form>
             </Card>

             {currentBatchJob && (
                <Card border padded className="space-y-8 border-primary/20 bg-primary/5 shadow-2xl animate-in zoom-in-95">
                   <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <Activity size={18} />
                         </div>
                         <h4 className="text-xs font-black uppercase tracking-[0.1em] text-base-100">Live Progress</h4>
                      </div>
                      <Badge tone={currentBatchJob.status === 'completed' ? 'success' : 'warning'} size="sm" className="shadow-sm">
                         {currentBatchJob.status}
                      </Badge>
                   </div>
                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-5 bg-base-950 border border-base-800 rounded-pro text-center shadow-inner">
                         <p className="text-2xl font-black tabular-nums text-base-50 tracking-tighter">{currentBatchJob.rowCount}</p>
                         <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest mt-1">Total Records</p>
                      </div>
                      <div className="p-5 bg-base-950 border border-base-800 rounded-pro text-center shadow-inner">
                         <p className="text-2xl font-black tabular-nums text-primary tracking-tighter">{currentBatchJob.reservedCredits}</p>
                         <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest mt-1">Reserved Credits</p>
                      </div>
                      <div className="p-5 bg-base-950 border border-base-800 rounded-pro text-center shadow-inner overflow-hidden relative">
                         <p className="text-2xl font-black tabular-nums text-base-50 tracking-tighter relative z-10">
                            {currentBatchJob.outputReady ? "100%" : "20%"}
                         </p>
                         <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest mt-1 relative z-10">Progress</p>
                         {!currentBatchJob.outputReady && (
                            <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                               <div className="h-full bg-primary w-1/5 animate-pulse" />
                            </div>
                         )}
                      </div>
                   </div>
                   {currentBatchJob.outputReady && batchDownloadUrl && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="p-6 bg-success/10 border border-success/20 rounded-pro flex items-center justify-between shadow-lg"
                      >
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                               <CheckCircle2 size={24} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-base-50">Results Ready</p>
                               <p className="text-xs text-base-500 font-medium mt-1">Your results file is ready to download.</p>
                            </div>
                         </div>
                         <a href={batchDownloadUrl} download>
                            <Button size="sm" variant="primary" leftIcon={<Download size={14} />} className="shadow-elite-success bg-success border-success">
                               Download Result
                            </Button>
                         </a>
                      </motion.div>
                   )}
                </Card>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function needsEnrichment(p: any) { return !!p?.predictionId && (!!p?.explanation?.isComputing || !!p?.fraud?.unavailable); }
function merge(i: any, d: any) { if(!i) return; return { ...i, ...d, explanation: d?.explanation ?? i.explanation, fraud: d?.fraud ?? i.fraud }; }
