import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Info,
  Database,
  Brain,
  Activity,
  ShieldAlert
} from "lucide-react";
import {
  EliteCard as Card,
  EliteBadge as Badge,
  EliteButton as Button,
  RiskTag,
  FrictionGate,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader,
  EliteInlineError as InlineError
} from "../components/ui";
import { apiFetch, type DashboardResponse, type PendingPrediction } from "../lib/api";
import { useKeyboardActions } from "../hooks/useKeyboardActions";
import { useUndo } from "../lib/undo-provider";
import { type AuthContextValue } from "../App";

// Helpers
function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deriveLoanName(features: Record<string, any>): string {
  // Try common field names for a human-readable label
  const nameKeys = ["loan_type", "purpose", "loan_purpose", "product", "description", "name", "applicant_name"];
  for (const key of nameKeys) {
    if (features[key] && typeof features[key] === "string") {
      return features[key];
    }
  }
  // Fallback: show first string feature
  for (const val of Object.values(features)) {
    if (typeof val === "string" && val.length > 2 && val.length < 60) return val;
  }
  return "Loan Application";
}

function deriveLoanAmount(features: Record<string, any>): number {
  const amountKeys = ["loan_amount", "amount", "loan_amnt", "funded_amnt", "total_amount", "principal", "credit_amount"];
  for (const key of amountKeys) {
    const val = features[key];
    if (val !== undefined && val !== null) {
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return 0;
}

function deriveRiskScore(prediction: PendingPrediction): number {
  // fraud score if available (0-100), otherwise invert probability for rejected loans
  if (prediction.fraudScore !== null && prediction.fraudScore !== undefined) {
    return Math.round(prediction.fraudScore * 100);
  }
  // If the model says "reject" (decision=false), risk = high
  if (prediction.decision === false) {
    return Math.round((1 - prediction.probability) * 100);
  }
  // If approved, risk = inverse of probability
  return Math.round((1 - prediction.probability) * 100);
}

// Queue item for the table
interface QueueItem {
  id: string;
  name: string;
  amount: string;
  risk: number;
  confidence: number;
  time: string;
  raw: PendingPrediction;
}

function predictionToQueueItem(p: PendingPrediction): QueueItem {
  return {
    id: p.id,
    name: deriveLoanName(p.features),
    amount: formatCurrency(deriveLoanAmount(p.features)),
    risk: deriveRiskScore(p),
    confidence: Math.round(p.probability * 100),
    time: timeAgo(p.createdAt),
    raw: p,
  };
}

export function DashboardPage(_props: { auth: AuthContextValue }) {
  const { addAction } = useUndo();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/dashboard"),
    refetchInterval: 30000,
  });

  // Local queue state for optimistic updates (remove on approve/reject, restore on undo)
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");

  // Sync API data into local queue when data changes
  useEffect(() => {
    if (data?.pendingPredictions) {
      const items = data.pendingPredictions
        .filter((p) => !dismissedIds.has(p.id))
        .map(predictionToQueueItem);
      setQueue(items);
    }
  }, [data?.pendingPredictions, dismissedIds]);

  const handleDecision = (loan: QueueItem, type: "approve" | "reject") => {
    const message = type === "approve" ? `Approved ${loan.name}` : `Rejected ${loan.name}`;

    addAction(
      message,
      async () => {
        await apiFetch(`/predictions/${loan.id}/decision`, {
          method: "POST",
          body: { decision: type },
        });
        // Refresh dashboard after decision
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      },
      () => {
        // Undo: restore item, remove from dismissed
        setDismissedIds((curr) => {
          const next = new Set(curr);
          next.delete(loan.id);
          return next;
        });
      }
    );

    // Optimistic: remove from queue, add to dismissed
    setQueue((curr) => curr.filter((l) => l.id !== loan.id));
    setDismissedIds((curr) => new Set(curr).add(loan.id));
  };

  // Filtered queue for search + risk filter
  const filteredQueue = useMemo(() => {
    let items = queue;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(l => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.amount.toLowerCase().includes(q));
    }
    if (riskFilter === "high") items = items.filter(l => l.risk > 70);
    else if (riskFilter === "medium") items = items.filter(l => l.risk >= 40 && l.risk <= 70);
    else if (riskFilter === "low") items = items.filter(l => l.risk < 40);
    return items;
  }, [queue, searchQuery, riskFilter]);

  const { setSelectedIndex } = useKeyboardActions(
    filteredQueue,
    (item, type) => handleDecision(item, type)
  );

  // Derived metrics from real data
  const metrics = data?.analytics?.metrics;
  const models = data?.models ?? [];
  const recentDecisions = data?.recentDecisions ?? [];
  const highRiskCount = queue.filter(l => l.risk > 70).length;

  // Best model: prefer pinned (production) model, then highest ROC AUC
  const activeModel = useMemo(() => {
    if (!models.length) return null;
    const pinned = models.find(m => m.pinnedVersionId);
    if (pinned) return pinned;
    return models.reduce((best, m) =>
      (m.championMetrics?.rocAuc ?? 0) > (best.championMetrics?.rocAuc ?? 0) ? m : best
    , models[0]);
  }, [models]);

  const avgWaitTime = useMemo(() => {
    if (!data?.pendingPredictions?.length) return "—";
    const now = Date.now();
    const totalMs = data.pendingPredictions.reduce((sum, p) => {
      return sum + (p.createdAt ? now - new Date(p.createdAt).getTime() : 0);
    }, 0);
    const avgMins = Math.round(totalMs / data.pendingPredictions.length / 60000);
    if (avgMins < 1) return "<1m";
    if (avgMins < 60) return `${avgMins}m`;
    return `${Math.round(avgMins / 60)}h`;
  }, [data?.pendingPredictions]);

  // Table columns
  const columns: TableColumn<QueueItem>[] = [
    {
      header: 'Application',
      accessor: 'name',
      render: (row: QueueItem) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-base-50">{row.name}</span>
          <span className="text-[10px] text-base-600 font-mono tracking-tighter uppercase">{row.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      header: 'Value',
      accessor: 'amount',
      className: 'text-sm font-bold text-base-200 tabular-nums',
    },
    {
      header: 'Risk Index',
      accessor: 'risk',
      render: (row: QueueItem) => <RiskTag score={row.risk} />,
    },
    {
      header: 'Confidence',
      accessor: 'confidence',
      render: (row: QueueItem) => (
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-bold tabular-nums ${row.confidence < 70 ? 'text-warning' : 'text-base-300'}`}>
            {row.confidence}%
          </span>
          {row.confidence < 70 && <Info size={12} className="text-warning animate-pulse" />}
        </div>
      ),
    },
    {
      header: 'Wait Time',
      accessor: 'time',
      className: 'text-xs text-base-500 font-medium',
    },
    {
      header: 'Actions',
      accessor: (row: QueueItem) => row.id,
      className: 'text-right',
      render: (row: QueueItem) => (
        <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
          <FrictionGate confidence={row.confidence} onConfirm={() => handleDecision(row, "reject")}>
            <button className="h-8 w-8 rounded-pro bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:bg-danger/20 transition-all" title="Reject">
              <XCircle size={16} />
            </button>
          </FrictionGate>
          <FrictionGate confidence={row.confidence} onConfirm={() => handleDecision(row, "approve")}>
            <button className="h-8 w-8 rounded-pro bg-success/10 text-success border border-success/20 flex items-center justify-center hover:bg-success/20 transition-all" title="Approve">
              <CheckCircle2 size={16} />
            </button>
          </FrictionGate>
          <Link to={`/app/loan/${row.id}`}>
            <Button variant="ghost" size="xs">View Details</Button>
          </Link>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="Decision-Engine-Grid py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonLoader variant="rectangle" height="100px" />
          <SkeletonLoader variant="rectangle" height="100px" />
          <SkeletonLoader variant="rectangle" height="100px" />
        </div>
        <SkeletonLoader variant="rectangle" height="400px" />
      </div>
    );
  }

  if (error) {
    return <InlineError message={(error as Error).message} />;
  }

  return (
    <div className="space-y-8 Decision-Engine-Animate">
      {/* KPI Cards — Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-base-800 rounded-lg overflow-hidden shadow-2xl">
        <Card className="rounded-none border-0 bg-danger/5" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0">
                <AlertCircle size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-danger uppercase tracking-widest leading-none">High Priority</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">
                  {highRiskCount > 0 ? `${highRiskCount} High-Risk` : "No High-Risk"} {highRiskCount === 1 ? "Loan" : "Loans"}
                </p>
             </div>
          </div>
        </Card>
        <Card className="rounded-none border-y-0 border-x border-base-800 bg-primary/5" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <TrendingUp size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Total Predictions</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">{metrics?.totalPredictions ?? 0} Scored</p>
             </div>
          </div>
        </Card>
        <Card className="rounded-none border-0 bg-base-900/50" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-base-950 border border-base-800 flex items-center justify-center text-base-500 shrink-0">
                <Clock size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest leading-none">Avg Wait Time</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">{avgWaitTime} Avg Wait</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card border={true} padded={true} className="text-center">
          <Database size={16} className="mx-auto text-primary mb-2" />
          <p className="text-lg font-bold text-base-50 tabular-nums">{metrics?.totalDatasets ?? 0}</p>
          <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Datasets</p>
        </Card>
        <Card border={true} padded={true} className="text-center">
          <Brain size={16} className="mx-auto text-primary mb-2" />
          <p className="text-lg font-bold text-base-50 tabular-nums">{metrics?.totalModels ?? 0}</p>
          <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Models</p>
        </Card>
        <Card border={true} padded={true} className="text-center">
          <Activity size={16} className="mx-auto text-primary mb-2" />
          <p className="text-lg font-bold text-base-50 tabular-nums">{queue.length}</p>
          <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Pending Review</p>
        </Card>
        <Card border={true} padded={true} className="text-center">
          <ShieldAlert size={16} className="mx-auto text-warning mb-2" />
          <p className="text-lg font-bold text-base-50 tabular-nums">{metrics?.fraudAlerts ?? 0}</p>
          <p className="text-[9px] font-bold text-base-600 uppercase tracking-widest">Fraud Alerts</p>
        </Card>
      </div>

      {/* Pending Loans Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
           <h2 className="text-xl font-bold tracking-tight">Pending Loans</h2>
           <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search loans..."
                  className="h-8 w-44 pl-8 pr-3 bg-base-950 border border-base-800 rounded-lg text-xs text-base-200 placeholder:text-base-700 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "all" | "high" | "medium" | "low")}
                className="h-8 px-3 bg-base-950 border border-base-800 rounded-lg text-xs text-base-200 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                <option value="all">All Risk</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
           </div>
        </div>

        {queue.length === 0 ? (
          <div className="py-16 text-center border border-base-800 rounded-lg bg-base-900/20">
            <p className="text-sm text-base-400">No pending loan applications.</p>
            <p className="text-xs text-base-600 mt-2 max-w-md mx-auto">
              Run single or batch predictions from the <Link to="/app/predict" className="text-primary hover:underline">Predict</Link> page.
              Each prediction will appear here for human review.
            </p>
            <Link to="/app/predict">
              <Button variant="outline" size="sm" className="mt-4">Go to Predict</Button>
            </Link>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-12 text-center border border-base-800 rounded-lg bg-base-900/20">
            <p className="text-sm text-base-400">No loans match your search.</p>
            <button onClick={() => { setSearchQuery(""); setRiskFilter("all"); }} className="text-xs text-primary hover:underline mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <Table
            data={filteredQueue}
            columns={columns}
            loading={isLoading}
            pagination={{
              currentPage: 1,
              totalPages: Math.ceil(filteredQueue.length / 10),
              pageSize: 10,
              totalItems: filteredQueue.length,
              onPageChange: () => {},
            }}
            onRowClick={(_row, idx) => setSelectedIndex(idx)}
          />
        )}
      </div>

      {/* Model Performance + Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card border={true} padded={false} className="lg:col-span-2">
           <div className="p-6 border-b border-base-800 flex items-center justify-between">
              <h3 className="font-bold tracking-tight">Active Model Performance</h3>
              {activeModel ? (
                <Badge tone="success">{activeModel.championFamily || "Default"}</Badge>
              ) : (
                <Badge tone="neutral">No Models</Badge>
              )}
           </div>
           {activeModel ? (
             <>
               <div className="p-8 h-48 flex items-center justify-center border-b border-base-800 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.05),transparent_70%)]">
                  <div className="text-center space-y-2">
                     <p className="text-4xl font-bold tracking-tighter text-base-50 tabular-nums">
                       {((activeModel.championMetrics?.rocAuc ?? 0) * 100).toFixed(1)}%
                     </p>
                     <p className="text-[10px] font-bold text-base-600 uppercase tracking-widest">ROC AUC Score</p>
                  </div>
               </div>
               <div className="grid grid-cols-3 divide-x divide-base-800">
                  <div className="p-4 text-center">
                     <p className="text-xs font-bold text-base-300">{((activeModel.championMetrics?.accuracy ?? 0) * 100).toFixed(1)}%</p>
                     <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">Accuracy</p>
                  </div>
                  <div className="p-4 text-center">
                     <p className="text-xs font-bold text-base-300">{(activeModel.championMetrics?.f1Score ?? 0).toFixed(2)}</p>
                     <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">F1 Score</p>
                  </div>
                  <div className="p-4 text-center">
                     <p className="text-xs font-bold text-base-300">{(activeModel.championMetrics?.precision ?? 0).toFixed(2)}</p>
                     <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">Precision</p>
                  </div>
               </div>
             </>
           ) : (
             <div className="p-12 text-center">
                <p className="text-sm text-base-400">No trained models yet.</p>
                <p className="text-xs text-base-600 mt-1">Upload a dataset and train a model to see performance metrics.</p>
                <Link to="/app/datasets">
                  <Button variant="outline" size="sm" className="mt-4">Upload Dataset</Button>
                </Link>
             </div>
           )}
        </Card>

        <Card border={true} padded={false}>
           <div className="p-6 border-b border-base-800">
              <h3 className="font-bold tracking-tight">Recent Decisions</h3>
           </div>
           <div className="p-6 space-y-4">
              {recentDecisions.length === 0 ? (
                <p className="text-xs text-base-500 text-center py-4">No decisions yet.</p>
              ) : (
                recentDecisions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                     <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${item.reviewStatus === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {item.reviewStatus === 'approved' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-50 truncate">
                          {item.reviewStatus === 'approved' ? 'Approved' : 'Rejected'}: {deriveLoanName(item.features)}
                        </p>
                        <p className="text-[10px] text-base-600">
                          {Math.round(item.probability * 100)}% confidence &bull; {timeAgo(item.reviewedAt)}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>
           <div className="p-4 bg-base-950/50 border-t border-base-800">
              <Link to="/app/predict">
                <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase tracking-widest font-bold">
                  Run New Prediction
                </Button>
              </Link>
           </div>
        </Card>
      </div>

      {/* Speed Hints */}
      <div className="flex items-center justify-center gap-6 py-4 opacity-30 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">J</span>
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">K</span>
            <span className="text-base-400 ml-1">Navigate</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">A</span>
            <span className="text-base-400 ml-1">Approve</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">R</span>
            <span className="text-base-400 ml-1">Reject</span>
         </div>
      </div>
    </div>
  );
}
