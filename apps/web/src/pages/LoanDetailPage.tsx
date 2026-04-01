import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  BarChart3, 
  History, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Zap,
  ChevronRight,
  FileText,
  Activity
} from "lucide-react";
import { 
  EliteCard as Card, 
  EliteBadge as Badge, 
  EliteButton as Button, 
  FrictionGate
} from "../components/ui";
import { useUndo } from "../lib/undo-provider";
import { motion } from "framer-motion";

import { type AuthContextValue } from "../App";

/**
 * LoanDetailPage - Underwriting Intelligence Center
 * References: Req 6.7, 6.10, 18.1, 18.2, 18.5, 18.6, 18.7, 18.8, 7.1
 */
export function LoanDetailPage({}: { auth: AuthContextValue }) {
  const { id } = useParams();
  const { addAction } = useUndo();
  const navigate = useNavigate();

  // Mock Data for the Elite v2 View
  const loan = {
    id,
    name: "Corporate Real Estate Loan",
    amount: "$240,000",
    risk: 82,
    confidence: 68,
    appliedAt: "2026-03-29 08:30 AM",
    status: "UNDER_REVIEW" as const,
    applicant: {
      name: "Tesla Finance SA",
      annualIncome: "$1,200,000",
      creditScore: 712,
      location: "Palo Alto, CA"
    },
    riskFactors: [
      { factor: "Income Volatility", impact: "+32%", status: "high" as const },
      { factor: "Debt-to-Income Ratio", impact: "+18%", status: "medium" as const },
      { factor: "Credit Utilization", impact: "+12%", status: "medium" as const },
      { factor: "Past Defaults (2y)", impact: "+5%", status: "low" as const },
    ],
    audit: [
      { actor: "AI Engine", action: "Flagged High Risk", time: "2m ago" },
      { actor: "System", action: "Assigned to Officer-12", time: "1h ago" },
    ]
  };

  const handleDecision = (type: "approve" | "reject") => {
    addAction(
      `${type === 'approve' ? 'Approved' : 'Rejected'} ${loan.name}`,
      async () => console.log("Finalizing decision"),
      () => console.log("Undone")
    );
    navigate("/app/dashboard");
  };

  return (
    <div className="space-y-10 animate-in text-base-200 pb-20">
      {/* Precision Breadcrumb */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-base-800 pb-8">
        <div className="flex items-center gap-5">
          <Link to="/app/dashboard" className="h-11 w-11 rounded-2xl bg-base-900 border border-base-800 flex items-center justify-center text-base-500 hover:text-primary hover:border-primary/50 transition-all shadow-inner">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Dashboard</span>
                <ChevronRight size={10} className="text-base-800" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Loan Application</span>
             </div>
             <h1 className="text-2xl font-black tracking-tight text-base-50 uppercase italic leading-none">{loan.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Badge tone="warning" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-inner">
             Under Review
           </Badge>
           <span className="font-mono text-[11px] text-base-700 font-black tracking-widest bg-base-900 px-3 py-1.5 rounded-lg border border-base-800">
             #PN-{id?.toString().slice(-6).toUpperCase()}0482-X
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Deep Intelligence (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Main Intelligence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Applicant Profile */}
             <Card border padded className="space-y-8 bg-base-900/40 border-base-800 shadow-xl group">
                <div className="flex items-center justify-between border-b border-base-800 pb-5">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                         <User size={16} />
                      </div>
                      <h3 className="font-black text-xs text-base-50 uppercase tracking-[0.2em]">Applicant Profile</h3>
                   </div>
                   <Activity size={14} className="text-base-800" />
                </div>
                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Entity Name</p>
                      <p className="text-sm font-black text-base-50 uppercase italic tracking-tight truncate">{loan.applicant.name}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Credit Score</p>
                      <p className="text-sm font-black text-base-50 tabular-nums italic text-primary">{loan.applicant.creditScore}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Annual Income</p>
                      <p className="text-sm font-black text-base-50 tabular-nums italic">{loan.applicant.annualIncome}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Jurisdiction</p>
                      <p className="text-sm font-black text-base-200 uppercase tracking-widest text-[11px]">{loan.applicant.location}</p>
                   </div>
                </div>
             </Card>

             {/* AI Risk Score Analysis */}
             <Card border padded className="bg-base-900 border-base-800 shadow-xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-danger/5 rounded-full blur-2xl group-hover:bg-danger/10 transition-colors" />
                
                <div className="flex items-center justify-between border-b border-base-800 pb-5 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-danger/10 rounded-xl border border-danger/20 text-danger group-hover:scale-110 transition-transform">
                         <ShieldCheck size={16} />
                      </div>
                      <h3 className="font-black text-xs text-base-50 uppercase tracking-[0.2em]">Risk Analysis</h3>
                   </div>
                   <Badge tone="danger" className="text-[9px] px-2 py-0.5">High Impact</Badge>
                </div>

                <div className="flex items-center justify-between py-6 relative z-10">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Risk Score</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black text-base-50 tabular-nums italic tracking-tighter shadow-sm">{loan.risk}</span>
                         <span className="text-xs font-black text-danger opacity-50">/ 100</span>
                      </div>
                   </div>
                   <div className="h-20 w-20 rounded-2xl border-2 border-base-800 bg-base-950 flex items-center justify-center relative shadow-inner group-hover:border-danger/30 transition-colors">
                      <svg className="absolute inset-0 -rotate-90 p-2">
                         <circle 
                           cx="32" cy="32" r="28" 
                           stroke="currentColor" strokeWidth="4" fill="none" 
                           className="text-base-800/10" 
                         />
                         <motion.circle 
                           initial={{ strokeDashoffset: 176 }}
                           animate={{ strokeDashoffset: 176 - (176 * loan.risk / 100) }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           cx="32" cy="32" r="28" 
                           stroke="currentColor" strokeWidth="4" fill="none" 
                           className="text-danger" 
                           strokeDasharray="176" 
                         />
                      </svg>
                      <BarChart3 className="text-danger opacity-10 group-hover:opacity-30 transition-opacity" size={28} />
                   </div>
                </div>
                <div className="pt-5 border-t border-base-800 flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-base-600 uppercase tracking-[0.2em]">Accuracy</span>
                      <span className="text-xs font-black text-warning tabular-nums italic">{loan.confidence}%</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                      <span className="text-[9px] font-black text-warning uppercase tracking-widest italic">Low Confidence</span>
                   </div>
                </div>
             </Card>
          </div>

          {/* Risk Factor Matrix: The Strategic Layer */}
          <Card border className="p-0 border-base-800 overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-base-800 bg-base-950/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-base-900 border border-base-800 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <TrendingDown size={20} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-base-50 uppercase tracking-[0.2em] leading-none">Risk Factors</h3>
                      <p className="text-[10px] text-base-700 font-bold uppercase mt-1.5 tracking-widest italic">Detailed factor analysis</p>
                   </div>
                </div>
                <Badge tone="ghost" className="text-[10px] font-black border-base-800 px-4">P1 Severity</Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-base-800 bg-base-900/10">
                {loan.riskFactors.map((factor, i) => (
                   <div key={i} className="p-8 hover:bg-base-900/40 transition-all group relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4 relative z-10">
                         <span className="text-[11px] font-black text-base-500 group-hover:text-base-200 transition-colors uppercase tracking-[0.2em]">{factor.factor}</span>
                         <span className={`text-sm font-black tabular-nums italic ${factor.status === 'high' ? 'text-danger' : factor.status === 'medium' ? 'text-warning' : 'text-success'}`}>
                            {factor.impact}
                         </span>
                      </div>
                      <div className="h-1.5 w-full bg-base-950 border border-base-800 rounded-full overflow-hidden p-px relative z-10">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: factor.impact }}
                            transition={{ duration: 1.2, delay: i * 0.1 }}
                            className={`h-full rounded-full ${factor.status === 'high' ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.3)]' : factor.status === 'medium' ? 'bg-warning' : 'bg-success'}`} 
                         />
                      </div>
                   </div>
                ))}
             </div>
             {loan.confidence < 70 && (
                <div className="p-6 bg-warning/5 border-t border-warning/10 flex items-start gap-4">
                   <div className="p-2 bg-warning/10 rounded-lg border border-warning/20 text-warning shrink-0">
                      <AlertTriangle size={16} />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-warning uppercase tracking-[0.2em] mb-1 italic">Low Accuracy Alert</h4>
                      <p className="text-[11px] text-warning/80 font-bold leading-relaxed uppercase tracking-wider italic">
                         Model accuracy is below standard levels. Manual review is recommended for this loan.
                      </p>
                   </div>
                </div>
             )}
          </Card>

          {/* Audit History: Compliance Layer */}
          <Card border padded className="bg-base-900/40 border-base-800">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-base-900 border border-base-800 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <History size={20} />
                   </div>
                   <h3 className="text-xs font-black text-base-50 uppercase tracking-[0.2em]">Loan History</h3>
                </div>
                <Badge tone="success" className="text-[9px] px-3">Signed PGP</Badge>
             </div>
             <div className="space-y-10 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-base-800">
                {loan.audit.map((item, i) => (
                   <div key={i} className="flex items-start gap-6 relative group">
                      <div className="h-4 w-4 rounded-full bg-base-950 border-2 border-base-800 mt-1 shrink-0 relative z-10 group-hover:border-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-base-50 uppercase italic tracking-tight truncate">{item.action}</span>
                            <span className="text-[10px] text-base-700 font-mono font-black italic">{item.time}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-base-700 uppercase tracking-widest">Actor:</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{item.actor}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Sticky Decision Console (4 cols) */}
        <div className="lg:col-span-4 sticky top-[72px] space-y-10">
           <Card border className="bg-base-900 border-base-800 overflow-hidden shadow-2xl border-t-2 border-t-primary/20">
              <div className="p-8 border-b border-base-800 bg-base-950/60">
                 <h3 className="text-sm font-black text-base-50 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-inner">
                       <Zap size={18} />
                    </div>
                    Decision Tool
                 </h3>
              </div>
              <div className="p-8 space-y-10">
                 <div className="space-y-5">
                    <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.3em] italic">Make a Decision</p>
                    
                    <div className="grid gap-4">
                       <FrictionGate confidence={loan.confidence} onConfirm={() => handleDecision("reject")}>
                          <Button variant="danger" className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] italic shadow-lg shadow-danger/5" leftIcon={<XCircle size={18} />}>
                             Reject Application
                          </Button>
                       </FrictionGate>

                       <FrictionGate confidence={loan.confidence} onConfirm={() => handleDecision("approve")}>
                          <Button variant="primary" className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] italic shadow-elite-primary" leftIcon={<CheckCircle2 size={18} />}>
                             Approve Application
                          </Button>
                       </FrictionGate>

                       <Button variant="secondary" className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] italic bg-base-950 border-base-800 hover:bg-base-800" leftIcon={<ArrowUpRight size={18} />}>
                          Escalate to Manager
                       </Button>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-base-800 space-y-5">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-base-700 uppercase tracking-[0.3em]">Notes</span>
                       <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-success" />
                          <span className="text-[9px] text-success font-black uppercase tracking-widest tabular-nums italic">Auto-Sync Active</span>
                       </div>
                    </div>
                    <textarea 
                       placeholder="ADD SYSTEM NOTES REGARDING THIS CASE HANDSHAKE..."
                       className="w-full h-40 bg-base-950 border border-base-800 rounded-2xl p-5 text-[11px] font-black text-base-100 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-base-800 transition-all resize-none uppercase tracking-widest shadow-inner leading-relaxed"
                    />
                 </div>
              </div>
              <div className="p-6 bg-base-950 border-t border-base-800 rounded-b-pro-lg">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Clock size={16} className="text-base-800" />
                       <span className="text-[10px] font-black text-base-800 uppercase tracking-[0.2em]">Applied: {loan.appliedAt}</span>
                    </div>
                    <FileText size={16} className="text-base-800 opacity-20" />
                 </div>
              </div>
           </Card>

           <Card border padded className="bg-base-900 border-base-800 shadow-xl group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-base-950 border border-base-800 rounded-xl flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors shadow-inner">
                    <BarChart3 size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em] mb-1">Model Name</h4>
                    <p className="text-[11px] font-black text-base-300 uppercase italic tracking-tighter">Standard Decision Model</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
