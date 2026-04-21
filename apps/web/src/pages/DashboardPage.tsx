import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Database,
  Brain,
  Activity,
  ShieldAlert,
  Loader2
} from "lucide-react";
import {
  EliteCard as Card,
  EliteButton as Button,
  RiskTag,
  FrictionGate,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader,
  EliteInlineError as InlineError
} from "../components/ui";
import { apiFetch, type DashboardResponse, type PendingPrediction } from "../lib/api";
import { deriveLoanName } from "../lib/loan-names";
import { useKeyboardActions } from "../hooks/useKeyboardActions";
import { useLoadingState } from "../hooks/useLoadingState";
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

function deriveLoanAmount(features: Record<string, any>): number {
  // Strategy 1: Direct loan amount fields (most accurate)
  const loanAmountKeys = [
    "loan_amount", "amount", "loan_amnt", "funded_amnt", "total_amount", "principal",
    "LoanAmount", "loanAmount", "Loan_Amount", "RequestedAmount", "loanamount"
  ];
  for (const key of loanAmountKeys) {
    const val = features[key];
    if (val !== undefined && val !== null) {
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // Strategy 2: Calculate Aggregate Asset Value (industry standard)
  // Based on asset depletion lending: sum all asset categories with appropriate weightings
  let totalAssetValue = 0;
  const assetValues: Record<string, number> = {};

  // Cash & Bank Assets (100% value)
  const cashKeys = ["bank_asset_value", "BankAssetValue", "savings", "checking", "cash", "Bank_Asset"];
  for (const key of cashKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        assetValues.cash = (assetValues.cash || 0) + val;
      }
    }
  }

  // Residential Assets (100% equity value)
  const residentialKeys = ["residential_assets", "ResidentialAssets", "home_equity", "property_value"];
  for (const key of residentialKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        assetValues.residential = (assetValues.residential || 0) + val;
      }
    }
  }

  // Commercial Assets (100% value)
  const commercialKeys = ["commercial_assets", "CommercialAssets", "business_assets"];
  for (const key of commercialKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        assetValues.commercial = (assetValues.commercial || 0) + val;
      }
    }
  }

  // Luxury Assets (70% value - less liquid)
  const luxuryKeys = ["luxury_assets", "LuxuryAssets", "luxury_goods", "collectibles"];
  for (const key of luxuryKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        assetValues.luxury = (assetValues.luxury || 0) + val * 0.7; // 70% weighting
      }
    }
  }

  // Investments (80% value - market volatility discount)
  const investmentKeys = ["investments", "stocks", "bonds", "mutual_funds", "portfolio"];
  for (const key of investmentKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        assetValues.investments = (assetValues.investments || 0) + val * 0.8; // 80% weighting
      }
    }
  }

  // Sum all weighted assets
  totalAssetValue = Object.values(assetValues).reduce((sum, val) => sum + val, 0);

  // Strategy 3: Income-based calculation (annual income × multiplier)
  // Industry uses 3x-5x annual income for loan amount estimation
  const incomeKeys = ["applicant_income", "ApplicantIncome", "income", "annual_income", "salary", "gross_income"];
  let annualIncome = 0;
  for (const key of incomeKeys) {
    if (features[key] !== undefined) {
      const val = typeof features[key] === "string" ? parseFloat(features[key]) : features[key];
      if (!isNaN(val) && val > 0) {
        // If value seems monthly (too small for annual), multiply by 12
        annualIncome = val > 100000 ? val : val * 12;
        break;
      }
    }
  }
  const incomeBasedValue = annualIncome * 4; // 4x annual income multiplier

  // Return the best available value (priority: direct loan amount > aggregate assets > income-based)
  if (totalAssetValue > 0) {
    // If we have both asset value and income, use weighted combination
    if (incomeBasedValue > 0) {
      // 60% asset-based, 40% income-based weighting
      return Math.round(totalAssetValue * 0.6 + incomeBasedValue * 0.4);
    }
    return Math.round(totalAssetValue);
  }

  if (incomeBasedValue > 0) {
    return Math.round(incomeBasedValue);
  }

  // Fallback: Try to find any numeric field that looks like a value
  for (const [key, val] of Object.entries(features)) {
    const lowerKey = key.toLowerCase();
    if ((lowerKey.includes('asset') || lowerKey.includes('value') || lowerKey.includes('worth'))
        && (typeof val === 'number' || typeof val === 'string')) {
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (!isNaN(num) && num > 0 && num < 100000000) { // Sanity check
        return Math.round(num);
      }
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
    name: deriveLoanName(p.features, p.id),
    amount: formatCurrency(deriveLoanAmount(p.features)),
    risk: deriveRiskScore(p),
    confidence: Math.round(p.probability * 100),
    time: timeAgo(p.createdAt),
    raw: p,
  };
}

export function DashboardPage({ auth }: { auth: AuthContextValue }) {
  const { addAction } = useUndo();
  const queryClient = useQueryClient();
  const { isLoading: isDecisionLoading, execute: executeDecision } = useLoadingState();

  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/dashboard"),
    refetchInterval: 30000,
  });

  // Local queue state for optimistic updates (remove on approve/reject, restore on undo)
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [queuePage, setQueuePage] = useState(1);
  const queuePageSize = 10;
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

  const handleDecision = async (loan: QueueItem, type: "approve" | "reject") => {
    const actionId = `${loan.id}-${type}`;
    
    await executeDecision(actionId, async () => {
      const message = type === "approve" ? `Approved ${loan.name}` : `Rejected ${loan.name}`;

      addAction(
        message,
        async () => {
          await apiFetch(`/predictions/${loan.id}/decision`, {
            method: "POST",
            token: auth.session?.token,
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
    });
  };

  // Filtered queue - matches RiskTag thresholds: Low<30, Med 30-69, High≥70
  const filteredQueue = useMemo(() => {
    if (riskFilter === "all") return queue;
    if (riskFilter === "high") return queue.filter(l => l.risk >= 70);
    if (riskFilter === "medium") return queue.filter(l => l.risk >= 30 && l.risk < 70);
    if (riskFilter === "low") return queue.filter(l => l.risk < 30);
    return queue;
  }, [queue, riskFilter]);

  // Reset pagination whenever the visible queue changes
  useEffect(() => {
    setQueuePage(1);
  }, [riskFilter]);

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
      className: 'text-sm font-bold text-base-200 tabular-nums hidden sm:table-cell',
    },
    {
      header: 'Risk',
      accessor: 'risk',
      render: (row: QueueItem) => <RiskTag score={row.risk} />,
    },
    {
      header: 'Confidence',
      accessor: 'confidence',
      className: 'hidden md:table-cell',
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
      header: 'Wait',
      accessor: 'time',
      className: 'text-xs text-base-500 font-medium hidden lg:table-cell',
    },
    {
      header: 'Actions',
      accessor: (row: QueueItem) => row.id,
      align: 'right',
      width: '264px',
      className: 'text-right',
      render: (row: QueueItem) => {
        const rejectLoading = isDecisionLoading(`${row.id}-reject`);
        const approveLoading = isDecisionLoading(`${row.id}-approve`);
        const isProcessing = rejectLoading || approveLoading;
        
        return (
          <div
            className="flex min-w-[240px] flex-wrap items-center justify-end gap-2 md:flex-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <FrictionGate confidence={row.confidence} onConfirm={() => handleDecision(row, "reject")}>
              <button
                type="button"
                disabled={isProcessing}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-pro border border-danger/20 bg-danger/10 px-3 text-danger transition-all touch-target
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-danger/20 hover:border-danger/35'}`}
                title="Reject application"
              >
                {rejectLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Reject</span>
              </button>
            </FrictionGate>
            <FrictionGate confidence={row.confidence} onConfirm={() => handleDecision(row, "approve")}>
              <button
                type="button"
                disabled={isProcessing}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-pro border border-success/20 bg-success/10 px-3 text-success transition-all touch-target
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success/20 hover:border-success/35'}`}
                title="Approve application"
              >
                {approveLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Approve</span>
              </button>
            </FrictionGate>
            <Link
              to={`/app/loan/${row.id}`}
              className="inline-flex h-9 items-center justify-center rounded-pro border border-base-800 bg-base-950 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-base-300 transition-colors hover:border-primary/40 hover:text-base-50"
            >
              Review
            </Link>
          </div>
        );
      },
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

  const isBrandNew = (metrics?.totalDatasets ?? 0) === 0
    && (metrics?.totalModels ?? 0) === 0
    && (metrics?.totalPredictions ?? 0) === 0
    && queue.length === 0
    && highRiskCount === 0
    && (metrics?.fraudAlerts ?? 0) === 0;

  if (isBrandNew) {
    return (
      <div className="space-y-8 Decision-Engine-Animate">
        <div className="rounded-lg border border-base-800 bg-base-900/40 p-8 md:p-12">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Getting Started</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-base-50 tracking-tight">
            Welcome to Originate
          </h1>
          <p className="mt-2 text-sm text-base-400 max-w-lg">
            Three steps to your first automated loan decision. You can finish this in under 5 minutes with a sample CSV.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            <li className="rounded-lg border border-base-800 bg-base-950 p-5">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
              <p className="mt-3 text-sm font-semibold text-base-50">Upload a dataset</p>
              <p className="mt-1 text-xs text-base-500">Bring a CSV or XLSX of historical loans — the target column becomes the decision label.</p>
              <Link to="/app/datasets" className="mt-4 inline-block text-[11px] font-bold text-primary uppercase tracking-widest hover:underline">Upload dataset →</Link>
            </li>
            <li className="rounded-lg border border-base-800 bg-base-950 p-5">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-base-800 text-base-300 text-xs font-bold">2</span>
              <p className="mt-3 text-sm font-semibold text-base-50">Train a model</p>
              <p className="mt-1 text-xs text-base-500">Configure the columns, set the outcome, and kick off training. Takes a few minutes per dataset.</p>
              <Link to="/app/models" className="mt-4 inline-block text-[11px] font-bold text-base-400 uppercase tracking-widest hover:text-primary">Models →</Link>
            </li>
            <li className="rounded-lg border border-base-800 bg-base-950 p-5">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-base-800 text-base-300 text-xs font-bold">3</span>
              <p className="mt-3 text-sm font-semibold text-base-50">Run a prediction</p>
              <p className="mt-1 text-xs text-base-500">Score a single loan or batch-upload a list. Decisions land here for human review.</p>
              <Link to="/app/predict" className="mt-4 inline-block text-[11px] font-bold text-base-400 uppercase tracking-widest hover:text-primary">Predict →</Link>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 Decision-Engine-Animate">
      {/* KPI Cards — Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card border className={highRiskCount > 0 ? "border-l-4 border-l-danger" : ""}>
          <div className="flex items-center gap-3">
             <AlertCircle size={20} className={highRiskCount > 0 ? "text-danger" : "text-base-500"} />
             <div>
                <p className="text-sm text-base-400">High Risk Loans</p>
                <p className="text-xl font-semibold text-base-50">
                  {highRiskCount > 0 ? highRiskCount : "None"}
                </p>
                <p className="text-xs text-base-600 mt-0.5">Loans with score ≥70%</p>
             </div>
          </div>
        </Card>
        <Card border>
          <div className="flex items-center gap-3">
             <TrendingUp size={20} className="text-primary" />
             <div>
                <p className="text-sm text-base-400">Loans Scored</p>
                <p className="text-xl font-semibold text-base-50">{metrics?.totalPredictions ?? 0}</p>
                <p className="text-xs text-base-600 mt-0.5">Total predictions run</p>
             </div>
          </div>
        </Card>
        <Card border>
          <div className="flex items-center gap-3">
             <Clock size={20} className="text-base-500" />
             <div>
                <p className="text-sm text-base-400">Avg Review Time</p>
                <p className="text-xl font-semibold text-base-50">
                  {avgWaitTime === "—" ? "—" : avgWaitTime}
                </p>
                <p className="text-xs text-base-600 mt-0.5">Time to decision</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card border className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Database size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-base-50 leading-tight">{metrics?.totalDatasets ?? 0}</p>
              <p className="text-xs text-base-500 mt-0.5">Datasets</p>
            </div>
          </div>
        </Card>
        <Card border className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Brain size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-base-50 leading-tight">{metrics?.totalModels ?? 0}</p>
              <p className="text-xs text-base-500 mt-0.5">Models</p>
            </div>
          </div>
        </Card>
        <Card border className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Activity size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-base-50 leading-tight">{queue.length}</p>
              <p className="text-xs text-base-500 mt-0.5">Pending</p>
            </div>
          </div>
        </Card>
        <Card border className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <ShieldAlert size={18} className="text-warning" />
            </div>
            <div>
              <p className="text-lg font-semibold text-base-50 leading-tight">{metrics?.fraudAlerts ?? 0}</p>
              <p className="text-xs text-base-500 mt-0.5">Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Loans Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
           <h2 className="text-lg sm:text-xl font-bold tracking-tight">Pending Loans</h2>
           <select
             value={riskFilter}
             onChange={(e) => setRiskFilter(e.target.value as "all" | "high" | "medium" | "low")}
             className="h-9 px-3 bg-base-950 border border-base-800 rounded-lg text-sm text-base-200 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer w-full sm:w-auto"
           >
             <option value="all">All Loans ({queue.length})</option>
             <option value="high">High Risk ≥70% ({queue.filter(l => l.risk >= 70).length})</option>
             <option value="medium">Medium Risk 30-69% ({queue.filter(l => l.risk >= 30 && l.risk < 70).length})</option>
             <option value="low">Low Risk &lt;30% ({queue.filter(l => l.risk < 30).length})</option>
           </select>
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
            <p className="text-sm text-base-400">No loans match your filter.</p>
            <button onClick={() => { setRiskFilter("all"); }} className="text-xs text-primary hover:underline mt-2">
              Clear filter
            </button>
          </div>
        ) : (
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <Table
              data={filteredQueue.slice((queuePage - 1) * queuePageSize, queuePage * queuePageSize)}
              columns={columns}
              loading={isLoading}
              pagination={{
                currentPage: queuePage,
                totalPages: Math.max(1, Math.ceil(filteredQueue.length / queuePageSize)),
                pageSize: queuePageSize,
                totalItems: filteredQueue.length,
                onPageChange: (page) => setQueuePage(page),
              }}
              onRowClick={(_row, idx) => setSelectedIndex(((queuePage - 1) * queuePageSize) + idx)}
              className="min-w-[920px] sm:min-w-0"
            />
          </div>
        )}
      </div>

      {/* Model Performance + Recent Decisions */}
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-3 gap-6 lg:gap-8">
        <Card border className="h-full lg:col-span-2">
           <div className="p-4 border-b border-base-800">
              <h3 className="font-semibold">Model Performance</h3>
              {activeModel && <p className="text-sm text-base-500 mt-0.5">{activeModel.championFamily || "Default"}</p>}
           </div>
           {activeModel ? (
             <>
               <div className="p-6 flex items-center justify-center border-b border-base-800">
                  <div className="text-center">
                     <p className="text-3xl font-semibold text-base-50">
                       {((activeModel.championMetrics?.rocAuc ?? 0) * 100).toFixed(1)}%
                     </p>
                     <p className="text-xs text-base-500 mt-1">ROC AUC</p>
                  </div>
               </div>
               <div className="grid grid-cols-3 divide-x divide-base-800">
                  <div className="p-4 text-center">
                     <p className="text-sm font-medium text-base-200">{((activeModel.championMetrics?.accuracy ?? 0) * 100).toFixed(1)}%</p>
                     <p className="text-xs text-base-500 mt-0.5">Accuracy</p>
                  </div>
                  <div className="p-4 text-center">
                     <p className="text-sm font-medium text-base-200">{(activeModel.championMetrics?.f1Score ?? 0).toFixed(2)}</p>
                     <p className="text-xs text-base-500 mt-0.5">F1</p>
                  </div>
                  <div className="p-4 text-center">
                     <p className="text-sm font-medium text-base-200">{(activeModel.championMetrics?.precision ?? 0).toFixed(2)}</p>
                     <p className="text-xs text-base-500 mt-0.5">Precision</p>
                  </div>
               </div>
             </>
           ) : (
             <div className="p-8 text-center">
                <p className="text-sm text-base-400">No trained models yet.</p>
                <p className="text-xs text-base-500 mt-1">Train a model to see metrics.</p>
                <Link to="/app/datasets">
                  <Button variant="outline" size="sm" className="mt-4">Upload Dataset</Button>
                </Link>
             </div>
           )}
        </Card>

        <Card border className="h-full">
           <div className="p-4 border-b border-base-800">
              <h3 className="font-semibold">Recent Decisions</h3>
           </div>
           <div className="flex-1 p-4 space-y-3">
              {recentDecisions.length === 0 ? (
                <p className="text-sm text-base-500 text-center py-4">No decisions yet.</p>
              ) : (
                recentDecisions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                      {item.reviewStatus === 'approved' ? <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" /> : <XCircle size={14} className="text-danger shrink-0 mt-0.5" />}
                     <div className="flex-1 min-w-0">
                        <p className="text-sm text-base-200 truncate">
                          {deriveLoanName(item.features, item.id)}
                        </p>
                        <p className="text-xs text-base-500">
                          {Math.round(item.probability * 100)}% confidence • {timeAgo(item.reviewedAt)}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>
           <div className="p-4 border-t border-base-800">
              <Link to="/app/predict">
                <Button variant="outline" size="sm" className="w-full">
                  New Prediction
                </Button>
              </Link>
           </div>
        </Card>
      </div>
    </div>
  );
}
