import React from "react";
import { type LucideIcon } from "lucide-react";
import { Card } from "./molecules/Card";

interface MetricCardProps {
  title: string;
  value: string | number;
  hint?: string;
  trend?: string;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  hint, 
  trend,
  icon: Icon, 
  className = "" 
}: MetricCardProps) {
  return (
    <Card className={`group ${className}`} hoverable border>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest group-hover:text-primary transition-colors">
          {title}
        </span>
        {Icon && (
          <div className="h-8 w-8 rounded-pro bg-base-950 flex items-center justify-center border border-base-800 group-hover:border-primary/20 group-hover:bg-primary/10 transition-all">
             <Icon className="h-4 w-4 text-base-500 group-hover:text-primary transition-all" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-base-50 tracking-tight tabular-nums">
          {value}
        </span>
        {trend && (
          <span className={`text-[11px] font-bold ${trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>
            {trend}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-base-600 font-medium uppercase tracking-wider">
          {hint}
        </p>
      )}
    </Card>
  );
}

export function ShinyMetricCard(props: MetricCardProps) {
  return <MetricCard {...props} />;
}

/* ─── Activity Item (Pro Timeline) ─── */
interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  status?: "success" | "warning" | "info" | "danger";
}

export function ActivityItem({ 
  title, 
  subtitle, 
  time, 
  status = "info" 
}: ActivityItemProps) {
  const tones = {
    success: "bg-success border-success/20",
    warning: "bg-warning border-warning/20",
    info: "bg-primary border-primary/20",
    danger: "bg-danger border-danger/20",
  };
  
  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Precision Node Line */}
      <div className="absolute left-[3.5px] top-[14px] bottom-0 w-[1px] bg-base-800 last:hidden" />
      
      {/* Minimalist Node */}
      <div className={`absolute left-0 top-[6px] h-2 w-2 rounded-full border-2 border-base-950 ${tones[status]} z-10`} />

      <div className="group cursor-default">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="text-xs font-semibold text-base-100 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <span className="text-[10px] font-medium text-base-600 tabular-nums">{time}</span>
        </div>
        <p className="text-[11px] text-base-500 leading-normal group-hover:text-base-400 transition-colors">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function BentoGrid({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px-4 ${className}`}>
        {children}
    </div>
  );
}
