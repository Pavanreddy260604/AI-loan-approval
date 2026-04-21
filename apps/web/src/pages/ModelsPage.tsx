import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  BrainCircuit, 
  RotateCcw, 
  TrendingUp, 
  Activity, 
  ShieldCheck
} from "lucide-react";
import {
  EliteCard as Card,
  EliteButton as Button,
  EliteBadge as Badge,
  EliteSelect as Select,
  ShinyMetricCard,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader,
  EliteInlineError as InlineError,
  Tooltip,
  useToast
} from "../components/ui";
import { apiFetch } from "../lib/api";
import { type AuthContextValue } from "../App";

import { 
  type DashboardModel as Model,
  type PublicModelVersion as ModelVersion 
} from "@ai-loan/contracts";

export function ModelsPage({ auth }: { auth: AuthContextValue }) {
  const [params] = useSearchParams();
  const datasetId = params.get("datasetId");
  const queryClient = useQueryClient();
  const toast = useToast();
  // Notifications hook removed - was unused
  const [pinSelections, setPinSelections] = useState<Record<string, string>>({});

  const models = useQuery<Model[]>({
    queryKey: ["models", auth.session?.token],
    queryFn: () => apiFetch("/models", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
    refetchInterval: (query) => {
      const isPending = (query.state.data as Model[] || []).some((m) => 
        m?.lastTrainingStatus === 'queued' || m?.lastTrainingStatus === 'processing'
      );
      return isPending ? 3000 : false;
    },
  });

  const allVersions = useQuery<ModelVersion[]>({
    queryKey: ["model-versions", auth.session?.token],
    queryFn: () => apiFetch("/models/compare", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  const trainMutation = useMutation({
    mutationFn: async (dsId: string) =>
      apiFetch("/models/train", { method: "POST", token: auth.session?.token, body: { datasetId: dsId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      
      // Psychological UX: Tell user they can leave and will get email
      // This reduces anxiety and builds trust
      toast.success(
        "Training started! You can close this tab — we'll email you when it's ready.",
        8000 // Longer duration so they can read it
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Unable to start training.");
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ modelId, versionId }: { modelId: string, versionId: string }) =>
      apiFetch(`/models/${modelId}/pin`, { method: "POST", token: auth.session?.token, body: { versionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Version promoted to production.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Unable to promote version.");
    },
  });

  const filteredModels = useMemo(() => {
    return models.data ?? [];
  }, [models.data]);

  const stats = useMemo(() => {
    const data = models.data || [];
    const ready = data.filter(m => m.championMetrics && (m.championMetrics.accuracy || m.championMetrics.rocAuc));
    return {
      total: data.length,
      active: data.filter(m => m.lastTrainingStatus === 'completed').length,
      avgAccuracy: ready.length
        ? ready.reduce((acc, m) => acc + (m.championMetrics?.accuracy || m.championMetrics?.rocAuc || 0), 0) / ready.length
        : 0,
      readyCount: ready.length,
    };
  }, [models.data]);

  // Table Column Definitions: Scorecard Registry
  const modelColumns: TableColumn<Model>[] = [
    {
      header: 'Model Family',
      accessor: 'championFamily',
      render: (row) => {
        const isTraining = row.lastTrainingStatus === 'queued' || row.lastTrainingStatus === 'processing';
        return (
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 rounded-xl bg-base-950 border border-base-800 flex items-center justify-center text-primary shadow-inner">
                <BrainCircuit size={18} className={isTraining ? "animate-pulse" : ""} />
             </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold text-base-50 leading-none">{row.championFamily || "Preparing Model..."}</span>
                 <span className="text-[10px] text-base-600 font-mono mt-1">ID: {row.id.slice(0, 8)}</span>
              </div>
          </div>
        );
      },
    },
    {
      header: 'Context',
      accessor: 'datasetId',
      className: 'hidden md:table-cell',
      render: (row) => (
        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-wider">
           LB-{row.datasetId?.slice(-8)}
        </span>
      ),
    },
    {
      header: 'Performance',
      accessor: (row) => row.championMetrics?.rocAuc || 0,
      render: (row) => {
        const auc = row.championMetrics?.rocAuc;
        if (!auc) return <span className="text-[10px] text-base-600 italic">Calculating...</span>;
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
             <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-base-100 tabular-nums">{(auc * 100).toFixed(1)}% AUC</span>
             </div>
             <div className="h-1.5 w-full bg-base-950 rounded-full overflow-hidden border border-base-800">
                <div 
                  className={`h-full transition-all duration-700 ${auc > 0.8 ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-primary'}`} 
                  style={{ width: `${auc * 100}%` }} 
                />
             </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'lastTrainingStatus',
      render: (row) => {
        const status = row.lastTrainingStatus || 'idle';
        const isTraining = status === 'queued' || status === 'processing';
        const isFailed = status === 'failed';
        const isComplete = status === 'completed';
        const tone: 'danger' | 'warning' | 'success' | 'ghost' = isFailed ? 'danger' : isTraining ? 'warning' : isComplete ? 'success' : 'ghost';
        const label = status === 'queued' ? 'Queued'
          : status === 'processing' ? 'Training'
          : status === 'completed' ? 'Ready'
          : status === 'failed' ? 'Failed'
          : 'Idle';
        return (
          <Badge tone={tone}>
             {label}
          </Badge>
        );
      },
    },
    {
      header: 'Production',
      accessor: 'id',
      align: 'right',
      width: '344px',
      className: 'text-right md:min-w-[320px]',
      render: (row) => {
        const matchingVersions = (allVersions.data || []).filter(v => v.modelId === row.id);
        const selectedVersionId = pinSelections[row.id] || row.pinnedVersionId || "";
        const liveVersion = matchingVersions.find((version) => version.id === row.pinnedVersionId) || null;

        const promoteDisabledReason = !selectedVersionId
          ? "Select a version before promoting."
          : selectedVersionId === row.pinnedVersionId
            ? "This version is already promoted to production."
            : matchingVersions.length === 0
              ? "No trained versions available yet."
              : null;

        const promoteButton = (
          <Button
            variant="primary"
            className="w-full sm:w-auto shrink-0"
            size="sm"
            disabled={!!promoteDisabledReason}
            onClick={() => pinMutation.mutate({ modelId: row.id, versionId: selectedVersionId })}
            loading={pinMutation.isPending}
          >
            Promote
          </Button>
        );

        return (
          <div
            className="flex min-w-[280px] flex-col gap-2.5 text-left"
            onClick={(event) => event.stopPropagation()}
          >
             <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-base-600">
                  Live Version
                </span>
                {liveVersion ? <Badge tone="success">In Production</Badge> : <Badge tone="ghost">Not Live</Badge>}
             </div>
             <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
             <Select
                className="w-full text-[11px] sm:flex-1 sm:min-w-[190px]"
                value={selectedVersionId}
                placeholder={matchingVersions.length === 0 ? "No versions yet" : "Select version..."}
                disabled={matchingVersions.length === 0}
                options={matchingVersions.map((v) => {
                   const rocAuc = v.metrics?.rocAuc;
                   const accuracyLabel = typeof rocAuc === 'number' && isFinite(rocAuc)
                     ? `${(rocAuc * 100).toFixed(1)}%`
                     : '—';
                   return {
                     label: `${v.family} (${accuracyLabel})`,
                     value: v.id
                   };
                })}
                onChange={(val) => setPinSelections(prev => ({ ...prev, [row.id]: val }))}
             />
             {promoteDisabledReason ? (
               <Tooltip content={promoteDisabledReason} placement="top-end" className="w-full sm:w-auto">
                 <span className="block w-full sm:w-auto" aria-label={promoteDisabledReason}>{promoteButton}</span>
               </Tooltip>
             ) : (
               <div className="w-full sm:w-auto">{promoteButton}</div>
             )}
             </div>
             <p className="text-[10px] leading-relaxed text-base-600">
               {liveVersion
                 ? `${liveVersion.family} is serving production traffic.`
                 : matchingVersions.length === 0
                   ? "Train a version before promoting a model."
                   : "Select a trained version, then promote it to production."}
             </p>
          </div>
        );
      },
    },
  ];

  if (models.error) {
    return <InlineError message={(models.error as Error).message} />;
  }

  if (models.isLoading) {
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
           <h1 className="text-xl sm:text-2xl font-semibold text-base-50">Models</h1>
           <p className="text-sm text-base-500 mt-1">Train and manage models for loan decisions.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
           {datasetId && (
            <Button
               onClick={() => trainMutation.mutate(datasetId)}
               loading={trainMutation.isPending}
               variant="primary"
               leftIcon={<Plus size={16} />}
               className="w-full sm:w-auto"
            >
               Train New Model
            </Button>
          )}
           {stats.total > 0 && (
             <Button
               variant="secondary"
               onClick={() => queryClient.invalidateQueries({ queryKey: ["models"] })}
               leftIcon={<RotateCcw size={16} className={models.isRefetching ? "animate-spin" : ""} />}
               className="w-full sm:w-auto"
            >
               Refresh Models
            </Button>
           )}
        </div>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <ShinyMetricCard title="Total Models" value={stats.total} icon={BrainCircuit} />
          <ShinyMetricCard title="Avg Accuracy" value={stats.readyCount === 0 ? "No data yet" : `${(stats.avgAccuracy * 100).toFixed(1)}%`} icon={TrendingUp} />
          <ShinyMetricCard title="Production Ready" value={stats.active} icon={ShieldCheck} />
       </div>

      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
             <h2 className="text-lg sm:text-xl font-bold tracking-tight">Available Models</h2>
          </div>

         <div className="-mx-4 sm:mx-0 overflow-x-auto">
           <Table
              data={filteredModels}
              columns={modelColumns}
              loading={models.isLoading}
              className="shadow-2xl min-w-[980px] sm:min-w-0"
           />
         </div>
         {filteredModels.length === 0 && !models.isLoading && (
           <div className="py-16 text-center border border-base-800 rounded-lg bg-base-900/20">
             <p className="text-sm text-base-400">No models found.</p>
             <p className="text-xs text-base-600 mt-1">
               Train a model from the Datasets page to get started.
             </p>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card border className="p-4">
             <TrendingUp size={20} className="text-primary mb-3" />
             <h4 className="text-sm font-medium text-base-200 mb-1">Smart Tuning</h4>
             <p className="text-xs text-base-500">Evaluates multiple algorithms for best accuracy.</p>
          </Card>
         <Card border className="p-4">
            <ShieldCheck size={20} className="text-success mb-3" />
            <h4 className="text-sm font-medium text-base-200 mb-1">Version Persistence</h4>
            <p className="text-xs text-base-500">Promote competitive versions to production.</p>
         </Card>
          <Card border className="p-4">
             <Activity size={20} className="text-warning mb-3" />
             <h4 className="text-sm font-medium text-base-200 mb-1">Data Balancing</h4>
             <p className="text-xs text-base-500">Fair performance across all data groups.</p>
          </Card>
      </div>
    </div>
  );
}
