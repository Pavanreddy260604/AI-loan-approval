import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
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
import type { DashboardResponse, RecentDecision } from "../lib/api";
import { deriveLoanName } from "../lib/loan-names";
import { type AuthContextValue } from "../App";

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

export function LoanDetailPage({ auth }: { auth: AuthContextValue }) {
  const { id } = useParams();
  const { addAction } = useUndo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Analyst notes — persisted locally per loan so reviewers don't lose context on navigation
  const notesStorageKey = id ? `loan-notes:${id}` : null;
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (!notesStorageKey) return;
    try {
      const stored = window.localStorage.getItem(notesStorageKey);
      if (stored) setNotes(stored);
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — silently degrade
    }
  }, [notesStorageKey]);

  useEffect(() => {
    if (!notesStorageKey) return;
    const handle = window.setTimeout(() => {
      try {
        if (notes.trim()) {
          window.localStorage.setItem(notesStorageKey, notes);
        } else {
          window.localStorage.removeItem(notesStorageKey);
        }
        setNotesSaved(true);
        window.setTimeout(() => setNotesSaved(false), 1500);
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [notes, notesStorageKey]);

  const { data: loan, isLoading, error } = useQuery<any>({
    queryKey: ["loan-detail", id, auth.session?.token],
    queryFn: () => apiFetch(`/predictions/${id}`, { token: auth.session?.token }),
    enabled: !!id && !!auth.session?.token,
  });

  // Reuse dashboard data for decision history — avoids a new endpoint
  const { data: dashboard } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/dashboard", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
    staleTime: 30_000,
  });

  const recentDecisions: RecentDecision[] = useMemo(
    () => (dashboard?.recentDecisions ?? []).filter((d) => d.id !== id).slice(0, 6),
    [dashboard?.recentDecisions, id]
  );

  const handleDecision = (type: "approve" | "reject") => {
    addAction(
      `${type === "approve" ? "Approved" : "Rejected"} loan #${id}`,
      async () => {
        await apiFetch(`/predictions/${id}/decision`, {
          method: "POST",
          token: auth.session?.token,
          body: { decision: type, notes: notes.trim() || undefined },
        });
        if (notesStorageKey) {
          try { window.localStorage.removeItem(notesStorageKey); } catch { /* ignore */ }
        }
        // Invalidate dashboard cache so changes reflect immediately
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      },
      () => {
        // Undo is a no-op for decisions once navigated away
      }
    );
    navigate("/app/dashboard");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 py-6 sm:py-8">
        <SkeletonLoader variant="rectangle" height="80px" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  const loanName = deriveLoanName(features, id);
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

  const statusLabel = status === "UNDER_REVIEW" ? "Under Review" : status === "APPROVED" ? "Approved" : "Rejected";
  const isDecided = status !== "UNDER_REVIEW";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in text-base-200 pb-16 sm:pb-20">
      {/* Breadcrumb / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-base-800 pb-6">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <Link
            to="/app/dashboard"
            className="h-10 w-10 rounded-xl bg-base-900 border border-base-800 flex items-center justify-center text-base-500 hover:text-primary hover:border-primary/50 transition-all shrink-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-base-600">
              <span>Dashboard</span>
              <ChevronRight size={12} className="text-base-800" />
              <span className="text-primary font-medium">Loan Application</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-base-50 leading-tight truncate">
              {loanName}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Badge
            tone={status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning"}
            className="px-3 py-1.5 text-[11px] font-semibold"
          >
            {statusLabel}
          </Badge>
          <span className="font-mono text-[11px] text-base-500 bg-base-900 px-2.5 py-1.5 rounded-lg border border-base-800">
            #{id?.toString().slice(-10).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applicant Profile */}
            <Card border className="bg-base-900 border-base-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <User size={16} />
                </div>
                <h3 className="font-semibold text-sm text-base-50">Applicant Profile</h3>
              </div>
              {Object.keys(applicant).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(applicant).slice(0, 4).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-xs text-base-500 mb-0.5">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-base-200 truncate" title={String(val)}>
                        {String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-500">No applicant data available.</p>
              )}
            </Card>

            {/* Risk Score */}
            <Card border className="bg-base-900 border-base-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-danger/10 rounded-lg text-danger shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="font-semibold text-sm text-base-50">Risk Analysis</h3>
                {riskScore !== null && (
                  <Badge tone={riskScore >= 70 ? "danger" : riskScore >= 30 ? "warning" : "success"} size="sm" className="ml-auto">
                    {riskScore >= 70 ? "High" : riskScore >= 30 ? "Medium" : "Low"}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-base-500 mb-1">Risk Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-base-50 tabular-nums">
                      {riskScore ?? "—"}
                    </span>
                    <span className="text-sm text-base-500">/ 100</span>
                  </div>
                </div>
                {riskScore !== null && (
                  <div className="h-14 w-14 rounded-full border-2 border-base-800 bg-base-950 flex items-center justify-center relative">
                    <svg className="absolute inset-0 -rotate-90 p-1" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="3" fill="none" className="text-base-800" />
                      <circle
                        cx="28" cy="28" r="22"
                        stroke="currentColor" strokeWidth="3" fill="none"
                        className={riskScore >= 70 ? "text-danger" : riskScore >= 30 ? "text-warning" : "text-success"}
                        strokeDasharray="138"
                        strokeDashoffset={138 - (138 * riskScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-base-400">{riskScore}%</span>
                  </div>
                )}
              </div>
              
              {confidence !== null && (
                <div className="pt-3 border-t border-base-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-500">Confidence</span>
                    <span className={`text-sm font-semibold ${confidence < 70 ? "text-warning" : "text-success"}`}>
                      {confidence}%
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Risk Factors / Explanation */}
          {riskFactors.length > 0 && (
            <Card border className="p-0 border-base-800 overflow-hidden">
              <div className="p-6 border-b border-base-800 bg-base-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 bg-base-900 border border-base-800 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <TrendingDown size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-50 leading-tight">Risk Factors</h3>
                    <p className="text-[11px] text-base-600 mt-0.5">Feature contribution analysis</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x divide-base-800">
                {riskFactors.slice(0, 6).map((factor: any, i: number) => {
                  const impact = typeof factor.impact === "number" ? factor.impact : 0;
                  const isPositive = impact > 0;
                  return (
                    <div key={i} className="p-5 hover:bg-base-900/40 transition-colors">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-medium text-base-300 truncate capitalize" title={String(factor.feature || factor.factor || "")}>
                          {String(factor.feature || factor.factor || "").replace(/_/g, " ")}
                        </span>
                        <span className={`text-xs font-semibold tabular-nums shrink-0 ${isPositive ? "text-success" : "text-danger"}`}>
                          {isPositive ? "+" : ""}{impact.toFixed(4)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-base-950 border border-base-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? "bg-success" : "bg-danger"}`}
                          style={{ width: `${Math.min(100, Math.abs(impact) * 200)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {confidence !== null && confidence < 70 && (
                <div className="p-5 bg-warning/5 border-t border-warning/10 flex items-start gap-3">
                  <div className="p-1.5 bg-warning/10 rounded-lg border border-warning/20 text-warning shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-warning mb-0.5">Low Confidence Alert</h4>
                    <p className="text-[11px] text-warning/80 leading-relaxed">
                      Model confidence is below standard levels. Manual review is recommended.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Recent Decisions History */}
          <Card border className="border-base-800 overflow-hidden">
            <div className="p-4 border-b border-base-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-base-900 rounded-lg text-primary shrink-0">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-base-50">Recent Decisions</h3>
                  <p className="text-xs text-base-500">Latest approved &amp; rejected</p>
                </div>
              </div>
              <Link to="/app/dashboard" className="text-xs text-base-500 hover:text-primary transition-colors hidden sm:inline-flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            {recentDecisions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-base-500">No prior decisions yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-base-800">
                {recentDecisions.map((item) => {
                  const approved = item.reviewStatus === "approved";
                  return (
                    <li key={item.id}>
                      <Link
                        to={`/app/loans/${item.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-base-900/60 transition-colors group"
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${approved ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                          {approved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${approved ? "text-success" : "text-danger"}`}>
                              {approved ? "Approved" : "Rejected"}
                            </span>
                            <span className="text-xs text-base-600">• {timeAgo(item.reviewedAt)}</span>
                          </div>
                          <p className="text-sm text-base-200 truncate">
                            {deriveLoanName(item.features, item.id)}
                          </p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end shrink-0">
                          <span className="text-sm font-medium text-base-200">
                            {Math.round(item.probability * 100)}%
                          </span>
                          <span className="text-xs text-base-500">confidence</span>
                        </div>
                        <ChevronRight size={14} className="text-base-600 group-hover:text-primary transition-colors shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Audit Trail (shown when backend provides one) */}
          {auditTrail.length > 0 && (
            <Card border padded className="bg-base-900/40 border-base-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-base-900 border border-base-800 rounded-lg flex items-center justify-center text-primary">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-base-50">Audit Trail</h3>
                </div>
                <Badge tone="success" className="text-[10px] px-2 py-0.5">Signed</Badge>
              </div>
              <div className="space-y-5 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-base-800">
                {auditTrail.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 relative group">
                    <div className="h-4 w-4 rounded-full bg-base-950 border-2 border-base-800 mt-1 shrink-0 relative z-10 group-hover:border-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-0.5">
                        <span className="text-sm font-medium text-base-100 truncate">{item.action}</span>
                        <span className="text-[11px] text-base-600 font-mono shrink-0">{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
                        <span className="text-base-600">by</span>
                        <span className="text-primary truncate">{item.actor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Decision Console */}
        <div className="lg:col-span-4 lg:sticky lg:top-[72px] space-y-6">
          <Card border className="bg-base-900 border-base-800 overflow-hidden border-t-2 border-t-primary/30">
            <div className="p-5 sm:p-6 border-b border-base-800 bg-base-950/60">
              <h3 className="text-sm font-semibold text-base-50 flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                  <Zap size={16} />
                </div>
                Decision
              </h3>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              {isDecided ? (
                <div
                  className={`rounded-lg p-4 border flex items-start gap-3 ${
                    status === "APPROVED"
                      ? "bg-success/5 border-success/20"
                      : "bg-danger/5 border-danger/20"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      status === "APPROVED" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {status === "APPROVED" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        status === "APPROVED" ? "text-success" : "text-danger"
                      }`}
                    >
                      Already {status === "APPROVED" ? "approved" : "rejected"}
                    </p>
                    <p className="text-[11px] text-base-500 mt-0.5 leading-relaxed">
                      This application has been decided. You can still add notes for the record.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-base-600 uppercase tracking-wider">Make a decision</p>
                  <div className="grid gap-2.5">
                    <FrictionGate confidence={confidence ?? 50} onConfirm={() => handleDecision("approve")}>
                      <Button
                        variant="primary"
                        className="w-full h-11 text-sm font-semibold"
                        leftIcon={<CheckCircle2 size={16} />}
                      >
                        Approve
                      </Button>
                    </FrictionGate>
                    <FrictionGate confidence={confidence ?? 50} onConfirm={() => handleDecision("reject")}>
                      <Button
                        variant="danger"
                        className="w-full h-11 text-sm font-semibold"
                        leftIcon={<XCircle size={16} />}
                      >
                        Reject
                      </Button>
                    </FrictionGate>
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-base-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="loan-notes" className="text-[10px] font-semibold text-base-600 uppercase tracking-wider">
                    Notes
                  </label>
                  <span
                    className={`text-[10px] font-semibold text-success transition-opacity ${notesSaved ? 'opacity-100' : 'opacity-0'}`}
                    aria-live="polite"
                  >
                    Saved
                  </span>
                </div>
                <textarea
                  id="loan-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  maxLength={2000}
                  className="w-full h-32 bg-base-950 border border-base-800 rounded-lg p-3 text-sm text-base-100 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-base-600 transition-all resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-base-600">
                    Auto-saved · {notes.length}/2000
                  </span>
                  {notes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNotes("")}
                      className="text-[10px] text-base-500 hover:text-danger transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-base-950 border-t border-base-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={14} className="text-base-700 shrink-0" />
                <span className="text-[11px] text-base-600 truncate">
                  {loan?.createdAt ? new Date(loan.createdAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </Card>

          <Card border padded className="bg-base-900 border-base-800 hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-base-950 border border-base-800 rounded-lg flex items-center justify-center text-primary/50 group-hover:text-primary transition-colors shrink-0">
                <Activity size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[10px] font-semibold text-base-600 uppercase tracking-wider mb-0.5">Model</h4>
                <p className="text-sm font-medium text-base-200 truncate">
                  {loan?.modelVersion?.family || loan?.modelFamily || "Decision Model"}
                </p>
                {loan?.modelVersion?.metrics?.rocAuc != null && (
                  <p className="text-[11px] text-base-600 mt-0.5">
                    ROC AUC: {(loan.modelVersion.metrics.rocAuc * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
