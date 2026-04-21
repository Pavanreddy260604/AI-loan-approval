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
    <Card className={className} border>
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="h-5 w-5 text-base-400" />}
        <span className="text-sm text-base-400">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-base-50 tabular-nums">
          {value}
        </span>
        {trend && (
          <span className={`text-xs ${trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>
            {trend}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-xs text-base-500 mt-1">
          {hint}
        </p>
      )}
    </Card>
  );
}

export function ShinyMetricCard(props: MetricCardProps) {
  return <MetricCard {...props} />;
}

/* ─── Activity Item (Simplified Timeline) ─── */
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
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-primary",
    danger: "bg-danger",
  };
  
  return (
    <div className="relative pl-5 pb-5 last:pb-0">
      <div className="absolute left-[5px] top-[8px] bottom-0 w-px bg-base-800 last:hidden" />
      <div className={`absolute left-0 top-[6px] h-2.5 w-2.5 rounded-full ${tones[status]}`} />
      <div>
        <div className="flex justify-between items-baseline">
          <h4 className="text-sm text-base-200">{title}</h4>
          <span className="text-xs text-base-500">{time}</span>
        </div>
        <p className="text-xs text-base-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export function BentoGrid({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {children}
    </div>
  );
}
