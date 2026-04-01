import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  Info
} from "lucide-react";
import { 
  EliteCard as Card, 
  EliteBadge as Badge, 
  EliteButton as Button, 
  RiskTag, 
  FrictionGate,
  Table,
  type TableColumn,
  EliteSkeletonLoader as SkeletonLoader
} from "../components/ui";
import { apiFetch, type DashboardResponse } from "../lib/api";
import { useKeyboardActions } from "../hooks/useKeyboardActions";
import { useUndo } from "../lib/undo-provider";
import { type AuthContextValue } from "../App";

export function DashboardPage(_props: { auth: AuthContextValue }) {
  const { addAction } = useUndo();
  
  const { isLoading } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/dashboard"),
    refetchInterval: 30000,
  });

  // Action Queue Mock Data (Representing Pending Decisions)
  const [queue, setQueue] = useState([
    { id: "1", name: "Corporate Real Estate Loan", amount: "$240,000", risk: 82, confidence: 91, time: "4m ago" },
    { id: "2", name: "SME Working Capital", amount: "$45,000", risk: 42, confidence: 68, time: "12m ago" },
    { id: "3", name: "Heavy Equipment Lease", amount: "$112,500", risk: 18, confidence: 94, time: "18m ago" },
    { id: "4", name: "Direct Consumer Credit", amount: "$8,000", risk: 65, confidence: 92, time: "24m ago" },
    { id: "5", name: "Agricultural Asset Finance", amount: "$320,000", risk: 55, confidence: 42, time: "31m ago" },
  ]);

  const handleDecision = (loan: any, type: "approve" | "reject") => {
    const message = type === "approve" ? `Approved ${loan.name}` : `Rejected ${loan.name}`;
    
    addAction(
      message,
      async () => {
        // Real API call here: await apiFetch(`/loans/${loan.id}/decision`, { method: "POST", body: { type } });
        console.log(`Executing ${type} on ${loan.id}`);
      },
      () => {
        setQueue((curr) => [loan, ...curr]);
      }
    );

    setQueue((curr) => curr.filter((l) => l.id !== loan.id));
  };

  const { setSelectedIndex } = useKeyboardActions(
    queue,
    (item, type) => handleDecision(item, type)
  );

  const highRiskCount = queue.filter(l => l.risk > 70).length;

  // Table Row Type
  interface QueueItem {
    id: string;
    name: string;
    amount: string;
    risk: number;
    confidence: number;
    time: string;
  }

  // Table Column Definitions
  const columns: TableColumn<QueueItem>[] = [
    {
      header: 'Application',
      accessor: 'name',
      render: (row: QueueItem) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-base-50">{row.name}</span>
          <span className="text-[10px] text-base-600 font-mono tracking-tighter uppercase">PN-{row.id}0482-X</span>
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

  return (
    <div className="space-y-8 Decision-Engine-Animate">
      {/* ⚠️ Attention Required: Strategic Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-base-800 rounded-lg overflow-hidden shadow-2xl">
        <Card className="rounded-none border-0 bg-danger/5" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0">
                <AlertCircle size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-danger uppercase tracking-widest leading-none">High Priority</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">{highRiskCount} High-Risk Loans</p>
             </div>
          </div>
        </Card>
        <Card className="rounded-none border-y-0 border-x border-base-800 bg-warning/5" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-warning/10 border border-warning/20 flex items-center justify-center text-warning shrink-0">
                <TrendingDown size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-warning uppercase tracking-widest leading-none">Accuracy Trend</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">-12% Accuracy Change</p>
             </div>
          </div>
        </Card>
        <Card className="rounded-none border-0 bg-base-900/50" padded={true}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded bg-base-950 border border-base-800 flex items-center justify-center text-base-500 shrink-0">
                <Clock size={20} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest leading-none">Response Speed</span>
                <p className="text-xl font-bold text-base-50 tracking-tight">4m Avg Wait</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Action Queue: The Decision Engine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold tracking-tight">Pending Loans</h2>
           <div className="flex items-center gap-2">
              <Button variant="outline" size="xs" leftIcon={<Search size={12} />}>
                Search Loans
              </Button>
              <Button variant="outline" size="xs" leftIcon={<Filter size={12} />}>
                Filter
              </Button>
           </div>
        </div>

        <Table 
          data={queue} 
          columns={columns}
          loading={isLoading}
          pagination={{
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
            totalItems: queue.length,
            onPageChange: () => {},
          }}
          onRowClick={(_row, idx) => setSelectedIndex(idx)}
        />
      </div>

      {/* Grid Layer: Secondary Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card border={true} padded={false} className="lg:col-span-2">
           <div className="p-6 border-b border-base-800 flex items-center justify-between">
              <h3 className="font-bold tracking-tight">Active Model (Performance)</h3>
              <Badge tone="success">Operational</Badge>
           </div>
           <div className="p-8 h-48 flex items-center justify-center border-b border-base-800 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.05),transparent_70%)]">
              <div className="text-center space-y-2">
                 <p className="text-4xl font-bold tracking-tighter text-base-50 tabular-nums">94.2%</p>
                 <p className="text-[10px] font-bold text-base-600 uppercase tracking-widest">Model Accuracy</p>
              </div>
           </div>
           <div className="grid grid-cols-3 divide-x divide-base-800">
              <div className="p-4 text-center">
                 <p className="text-xs font-bold text-base-300">0.82</p>
                 <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">F1 Score</p>
              </div>
              <div className="p-4 text-center">
                 <p className="text-xs font-bold text-base-300">0.89</p>
                 <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">ROC AUC</p>
              </div>
              <div className="p-4 text-center">
                 <p className="text-xs font-bold text-base-300">12ms</p>
                 <p className="text-[8px] font-bold text-base-600 uppercase tracking-widest">Speed</p>
              </div>
           </div>
        </Card>

        <Card border={true} padded={false}>
           <div className="p-6 border-b border-base-800">
              <h3 className="font-bold tracking-tight">Recent Decisions</h3>
           </div>
           <div className="p-6 space-y-4">
              {[
                { name: "Tesla Finance SA", time: "2m ago", type: "approve" },
                { name: "High Limit Individual 02", time: "14m ago", type: "reject" },
                { name: "Blue Horizon Trading", time: "1h ago", type: "approve" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                   <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${item.type === 'approve' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {item.type === 'approve' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-base-50 truncate">{item.type === 'approve' ? 'Approve' : 'Reject'}: {item.name}</p>
                      <p className="text-[10px] text-base-600">Decision by Officer-12 • {item.time}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-base-950/50 border-t border-base-800">
              <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase tracking-widest font-bold">
                View History
              </Button>
           </div>
        </Card>
      </div>

      {/* Speed Hints (Power-User Orientation) */}
      <div className="flex items-center justify-center gap-6 py-4 opacity-30 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">J</span>
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">K</span>
            <span className="text-base-600 ml-1">Navigate</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">A</span>
            <span className="text-base-600 ml-1">Approve</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-1.5 py-0.5 bg-base-900 border border-base-800 rounded">R</span>
            <span className="text-base-600 ml-1">Reject</span>
         </div>
      </div>
    </div>
  );
}
