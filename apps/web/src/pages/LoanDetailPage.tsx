import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  FrictionGate,
  EliteInlineError as InlineError,
  EliteSkeletonLoader as SkeletonLoader
} from "../components/ui";
import { useUndo } from "../lib/undo-provider";
import { apiFetch } from "../lib/api";
import { motion } from "framer-motion";
import { type AuthContextValue } from "../App";

export function LoanDetailPage({ auth }: { auth: AuthContextValue }) {
  const { id } = useParams();
  const { addAction } = useUndo();
  const navigate = useNavigate();

  const { data: loan, isLoading, error } = useQuery<any>({
    queryKey: ["loan-detail", id, auth.session?.token],
    queryFn: () => apiFetch(`/predictions/${id}`, { token: auth.session?.token }),
    enabled: !!id && !!auth.session?.token,
  });

  const handleDecision = (type: "approve" | "reject") => {
    addAction(
      `${type === "approve" ? "Approved" : "Rejected"} loan #${id}`,
      async () => {
        await apiFetch(`/predictions/${id}/decision`, {
          method: "POST",
          token: auth.session?.token,
          body: { decision: type },
        });
      },
      () => {
        // Undo is a no-op for decisions once navigated away
      }
    );
    navigate("/app/dashboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-10 py-8">
        <SkeletonLoader variant="rectangle" height="80px" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SkeletonLoader variant="rectangle" height="220px" />
              <SkeletonLoader variant="rectangle" height="220px" />
            </div>
            <SkeletonLoader variant="rectangle" height="280px" />
            <SkeletonLoader variant="rectangle" height="180px" />
          </div>
          <div className="lg:col-span-4">
            <SkeletonLoader variant="rectangle" height="420px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-8">
        <Link to="/app/dashboard" className="inline-flex items-center gap-2 text-base-500 hover:text-primary transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <InlineError message={(error as Error).message} />
      </div>
    );
  }

  // Normalise API response — map prediction fields to display fields
  const features = loan?.features || loan?.applicant || {};
  const nameKeys = ["loan_type", "purpose", "loan_purpose", "product", "applicant_name", "name"];
  const loanName = nameKeys.reduce((found: string | null, k) => found || (features[k] ? String(features[k]) : null), null)
    || loan?.modelVersion?.family || loan?.modelFamily || `Loan #${id}`;
  const probability = loan?.probability ?? null;
  const riskScore = probability != null ? Math.round((1 - probability) * 100) : (loan?.riskScore ?? null);
  const confidence = probability != null ? Math.round(probability * 100) : null;
  const applicant = features;
  const explanation = loan?.explanation || {};
  const riskFactors = explanation?.topContributors || explanation?.top_contributors
    || (Array.isArray(explanation?.features) ? explanation.features : []);
  const auditTrail = loan?.audit || [];
  const reviewStatus = loan?.reviewStatus || loan?.review_status;
  const status = loan?.status
    || (reviewStatus === "approved" ? "APPROVED" : reviewStatus === "rejected" ? "REJECTED" : null)
    || (loan?.decision === true ? "APPROVED" : loan?.decision === false ? "REJECTED" : "UNDER_REVIEW");

  return (
    <div className="space-y-10 animate-in text-base-200 pb-20">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-base-800 pb-8">
        <div className="flex items-center gap-5">
          <Link
            to="/app/dashboard"
            className="h-11 w-11 rounded-2xl bg-base-900 border border-base-800 flex items-center justify-center text-base-500 hover:text-primary hover:border-primary/50 transition-all shadow-inner"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Dashboard</span>
              <ChevronRight size={10} className="text-base-800" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Loan Application</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-base-50 uppercase italic leading-none">{loanName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            tone={status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning"}
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-inner"
          >
            {status.replace("_", " ")}
          </Badge>
          <span className="font-mono text-[11px] text-base-700 font-black tracking-widest bg-base-900 px-3 py-1.5 rounded-lg border border-base-800">
            #{id?.toString().slice(-10).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-10">

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
              {Object.keys(applicant).length > 0 ? (
                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                  {Object.entries(applicant).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm font-black text-base-50 uppercase italic tracking-tight truncate">{String(val)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-base-500 italic">No applicant data available.</p>
              )}
            </Card>

            {/* Risk Score */}
            <Card border padded className="bg-base-900 border-base-800 shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-danger/5 rounded-full blur-2xl group-hover:bg-danger/10 transition-colors" />
              <div className="flex items-center justify-between border-b border-base-800 pb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger/10 rounded-xl border border-danger/20 text-danger group-hover:scale-110 transition-transform">
                    <ShieldCheck size={16} />
                  </div>
                  <h3 className="font-black text-xs text-base-50 uppercase tracking-[0.2em]">Risk Analysis</h3>
                </div>
                {riskScore !== null && riskScore > 70 && (
                  <Badge tone="danger" className="text-[9px] px-2 py-0.5">High Impact</Badge>
                )}
              </div>
              <div className="flex items-center justify-between py-6 relative z-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em]">Risk Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-base-50 tabular-nums italic tracking-tighter shadow-sm">
                      {riskScore ?? "—"}
                    </span>
                    <span className="text-xs font-black text-danger opacity-50">/ 100</span>
                  </div>
                </div>
                {riskScore !== null && (
                  <div className="h-20 w-20 rounded-2xl border-2 border-base-800 bg-base-950 flex items-center justify-center relative shadow-inner group-hover:border-danger/30 transition-colors">
                    <svg className="absolute inset-0 -rotate-90 p-2">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-base-800/10" />
                      <motion.circle
                        initial={{ strokeDashoffset: 176 }}
                        animate={{ strokeDashoffset: 176 - (176 * riskScore / 100) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="32" cy="32" r="28"
                        stroke="currentColor" strokeWidth="4" fill="none"
                        className="text-danger"
                        strokeDasharray="176"
                      />
                    </svg>
                    <BarChart3 className="text-danger opacity-10 group-hover:opacity-30 transition-opacity" size={28} />
                  </div>
                )}
              </div>
              {confidence !== null && (
                <div className="pt-5 border-t border-base-800 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-base-600 uppercase tracking-[0.2em]">Confidence</span>
                    <span className={`text-xs font-black tabular-nums italic ${confidence < 70 ? "text-warning" : "text-success"}`}>
                      {confidence}%
                    </span>
                  </div>
                  {confidence < 70 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                      <span className="text-[9px] font-black text-warning uppercase tracking-widest italic">Low Confidence</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Risk Factors / Explanation */}
          {riskFactors.length > 0 && (
            <Card border className="p-0 border-base-800 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-base-800 bg-base-950/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-base-900 border border-base-800 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-base-50 uppercase tracking-[0.2em] leading-none">Risk Factors</h3>
                    <p className="text-[10px] text-base-700 font-bold uppercase mt-1.5 tracking-widest italic">Feature contribution analysis</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-base-800 bg-base-900/10">
                {riskFactors.slice(0, 6).map((factor: any, i: number) => (
                  <div key={i} className="p-8 hover:bg-base-900/40 transition-all group relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <span className="text-[11px] font-black text-base-500 group-hover:text-base-200 transition-colors uppercase tracking-[0.2em]">
                        {String(factor.feature || factor.factor || "").replace(/_/g, " ")}
                      </span>
                      <span className={`text-sm font-black tabular-nums italic ${(factor.impact ?? 0) > 0 ? "text-success" : "text-danger"}`}>
                        {(factor.impact ?? 0) > 0 ? "+" : ""}{typeof factor.impact === "number" ? factor.impact.toFixed(4) : factor.impact}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-base-950 border border-base-800 rounded-full overflow-hidden p-px relative z-10">
                      <div
                        className={`h-full rounded-full ${(factor.impact ?? 0) > 0 ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.3)]" : "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.3)]"}`}
                        style={{ width: `${Math.min(100, Math.abs(factor.impact ?? 0) * 200)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {confidence !== null && confidence < 70 && (
                <div className="p-6 bg-warning/5 border-t border-warning/10 flex items-start gap-4">
                  <div className="p-2 bg-warning/10 rounded-lg border border-warning/20 text-warning shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-warning uppercase tracking-[0.2em] mb-1 italic">Low Confidence Alert</h4>
                    <p className="text-[11px] text-warning/80 font-bold leading-relaxed uppercase tracking-wider italic">
                      Model confidence is below standard levels. Manual review is recommended.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Audit Trail */}
          {auditTrail.length > 0 && (
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
                {auditTrail.map((item: any, i: number) => (
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
          )}
        </div>

        {/* Right Column: Decision Console */}
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
                  <FrictionGate confidence={confidence ?? 50} onConfirm={() => handleDecision("reject")}>
                    <Button variant="danger" className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] italic shadow-lg shadow-danger/5" leftIcon={<XCircle size={18} />}>
                      Reject Application
                    </Button>
                  </FrictionGate>
                  <FrictionGate confidence={confidence ?? 50} onConfirm={() => handleDecision("approve")}>
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
                  <label htmlFor="loan-notes" className="text-[10px] font-black text-base-700 uppercase tracking-[0.3em]">Notes</label>
                </div>
                <textarea
                  id="loan-notes"
                  placeholder="Add notes about this application..."
                  className="w-full h-40 bg-base-950 border border-base-800 rounded-2xl p-5 text-[11px] font-black text-base-100 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-base-700 transition-all resize-none uppercase tracking-widest shadow-inner leading-relaxed"
                />
              </div>
            </div>
            <div className="p-6 bg-base-950 border-t border-base-800 rounded-b-pro-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-base-800" />
                  <span className="text-[10px] font-black text-base-800 uppercase tracking-[0.2em]">
                    {loan?.createdAt ? new Date(loan.createdAt).toLocaleString() : "—"}
                  </span>
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
                <h4 className="text-[10px] font-black text-base-700 uppercase tracking-[0.2em] mb-1">Model</h4>
                <p className="text-[11px] font-black text-base-300 uppercase italic tracking-tighter">
                  {loan?.modelFamily || "Standard Decision Model"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
