import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = "primary", 
  size = "md",
  loading,
  children, 
  ...props 
}) => {
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-500/50",
    secondary: "bg-surface-raised text-white border border-[--border-strong] hover:bg-white/10 hover:border-white/30",
    ghost: "text-muted hover:text-white hover:bg-white/5",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-rose-500/50",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-500/50",
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, glass, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-[--border] bg-surface p-6 shadow-sm",
        glass && "bg-white/[0.03] backdrop-blur-md border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
}

export const Badge: React.FC<BadgeProps> = ({ className, tone = "neutral", children, ...props }) => {
  const tones: Record<string, string> = {
    neutral: "bg-white/5 text-muted border-white/10",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    primary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[tone] || tones.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface SectionTitleProps {
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, description, badge, className }) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      {badge && <Badge tone="primary" className="mb-2">{badge}</Badge>}
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {description && <p className="text-sm text-muted max-w-2xl leading-relaxed">{description}</p>}
    </div>
  );
};
