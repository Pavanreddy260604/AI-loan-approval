

/**
 * High-fidelity 'Google-grade' status pulse indicator.
 * Provides a radiating ambient animation for real-time status.
 */
export function StatusPulse({ 
  tone = "primary", 
  label 
}: { 
  tone?: "primary" | "success" | "warning" | "danger" | "live"; 
  label?: string 
}) {
  const colors = {
    primary: "bg-primary shadow-primary/40",
    success: "bg-success shadow-success/40",
    warning: "bg-warning shadow-warning/40",
    danger: "bg-danger shadow-danger/40",
    live: "bg-cyan-500 shadow-cyan-500/40",
  };
  
  return (
    <div className="flex items-center gap-2 group cursor-default">
      <div className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[tone]}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[tone]}`}></span>
      </div>
      {label && (
        <span className="text-[11px] font-bold text-base-50/90 uppercase tracking-[0.1em] group-hover:text-base-50 transition-colors">
          {label}
        </span>
      )}
    </div>
  );
}
