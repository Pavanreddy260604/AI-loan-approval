import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  BrainCircuit, 
  RotateCcw, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Search
} from "lucide-react";
import { 
  EliteCard as Card, 
  EliteButton as Button, 
  EliteBadge as Badge,
  EliteSelect as Select,
  ShinyMetricCard,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader
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
  const [pinSelections, setPinSelections] = useState<Record<string, string>>({});
  const [modelSearch, setModelSearch] = useState("");
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["models"] }),
  });

  const pinMutation = useMutation({
    mutationFn: async ({ modelId, versionId }: { modelId: string, versionId: string }) =>
      apiFetch(`/models/${modelId}/pin`, { method: "POST", token: auth.session?.token, body: { versionId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["models"] }),
  });

  const filteredModels = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();
    if (!search) return models.data ?? [];
    return (models.data ?? []).filter((m) => 
      (m.championFamily || "").toLowerCase().includes(search) || m.id.toLowerCase().includes(search)
    );
  }, [modelSearch, models.data]);

  const stats = useMemo(() => {
    const data = models.data || [];
    return {
      total: data.length,
      active: data.filter(m => m.lastTrainingStatus === 'completed').length,
      avgGini: data.length ? data.reduce((acc, m) => acc + (m.championMetrics?.rocAuc || 0), 0) / data.length : 0
    };
  }, [models.data]);

  // Table Column Definitions: Scorecard Registry
  const modelColumns: TableColumn<Model>[] = [
    {
      header: 'Scorecard Family',
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
        const isTraining = row.lastTrainingStatus === 'queued' || row.lastTrainingStatus === 'processing';
        const isFailed = row.lastTrainingStatus === 'failed';
        return (
          <Badge tone={isFailed ? 'danger' : isTraining ? 'warning' : 'success'}>
             {row.lastTrainingStatus}
          </Badge>
        );
      },
    },
    {
      header: 'Update Version',
      accessor: 'id',
      className: 'text-right min-w-[280px]',
      render: (row) => {
        const matchingVersions = (allVersions.data || []).filter(v => v.modelId === row.id);
        const selectedVersionId = pinSelections[row.id] || row.pinnedVersionId || "";
        const canPromote = selectedVersionId && selectedVersionId !== row.pinnedVersionId;
        const isDropdownOpen = openSelectId === row.id;
        const isMutationPending = pinMutation.isPending;
        const hasStagedSelection = !!pinSelections[row.id];
        
        return (
          <div className={`flex items-center justify-end gap-3 transition-opacity ${isDropdownOpen || hasStagedSelection || isMutationPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
             <Select 
                className="w-48 text-[11px]"
                value={selectedVersionId}
                placeholder="Select version..."
                options={matchingVersions.map((v) => ({ 
                   label: `${v.family} (${(v.metrics?.rocAuc * 100).toFixed(1)}%)`, 
                   value: v.id 
                }))}
                onChange={(val) => setPinSelections(prev => ({ ...prev, [row.id]: val }))}
                onOpenChange={(isOpen) => setOpenSelectId(isOpen ? row.id : null)}
             />
             <Button 
                variant="primary" 
                size="sm" 
                disabled={!canPromote}
                onClick={() => pinMutation.mutate({ modelId: row.id, versionId: selectedVersionId })}
                loading={pinMutation.isPending}
             >
                Promote
             </Button>
          </div>
        );
      },
    },
  ];

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
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-base-600 uppercase tracking-widest leading-none">Model Engine</span>
           <h1 className="text-2xl font-bold tracking-tight text-base-50">Models</h1>
           <p className="text-sm text-base-500 mt-1">Train and manage optimized models for loan decisions.</p>
        </div>
        <div className="flex items-center gap-3">
           {datasetId && (
            <Button 
               onClick={() => trainMutation.mutate(datasetId)} 
               loading={trainMutation.isPending} 
               variant="primary"
               leftIcon={<Plus size={16} />}
            >
               Train New Model
            </Button>
          )}
           <Button 
             variant="secondary" 
             onClick={() => queryClient.invalidateQueries({ queryKey: ["models"] })}
             leftIcon={<RotateCcw size={16} className={models.isRefetching ? "animate-spin" : ""} />}
          >
             Refresh Models
          </Button>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ShinyMetricCard title="Total Models" value={stats.total} icon={BrainCircuit} />
          <ShinyMetricCard title="Model Accuracy" value={`${(stats.avgGini * 100).toFixed(1)}%`} icon={TrendingUp} />
          <ShinyMetricCard title="Production Ready" value={stats.active} icon={ShieldCheck} />
       </div>

      <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold tracking-tight">Available Models</h2>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-base-900 border border-base-800 rounded-pro text-[10px] font-bold text-base-500 hover:text-base-300 transition-colors">
                <Search size={14} className="mr-2" /> 
                <input 
                  placeholder="Search models..." 
                  className="bg-transparent border-none text-[11px] p-0 focus:ring-0 w-32 outline-none" 
                  onChange={(e) => setModelSearch(e.target.value)} 
                />
             </div>
          </div>

         <Table 
            data={filteredModels} 
            columns={modelColumns}
            loading={models.isLoading}
            className="shadow-2xl"
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card border padded className="bg-base-900 border-base-800 shadow-lg group hover:border-primary/40 transition-colors">
             <TrendingUp size={24} className="text-primary mb-4 group-hover:scale-110 transition-transform" />
             <h4 className="text-[10px] font-bold text-base-50 uppercase tracking-widest mb-3 leading-none">Smart Tuning</h4>
             <p className="text-[11px] text-base-500 leading-relaxed">System evaluates multiple algorithms and settings for the best possible accuracy.</p>
          </Card>
         <Card border padded className="bg-base-900 border-base-800 shadow-lg group hover:border-success/40 transition-colors">
            <ShieldCheck size={24} className="text-success mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-bold text-base-50 uppercase tracking-widest mb-3 leading-none">Version Persistence</h4>
            <p className="text-[11px] text-base-500 leading-relaxed">Every calibration generates a persistent version. Promote competitive versions to update the production endpoint.</p>
         </Card>
          <Card border padded className="bg-base-900 border-base-800 shadow-lg group hover:border-warning/40 transition-colors">
             <Activity size={24} className="text-warning mb-4 group-hover:scale-110 transition-transform" />
             <h4 className="text-[10px] font-bold text-base-50 uppercase tracking-widest mb-3 leading-none">Data Balancing</h4>
             <p className="text-[11px] text-base-500 leading-relaxed">Advanced techniques are applied to uneven data to ensure stable and fair performance across all groups.</p>
          </Card>
      </div>
    </div>
  );
}
