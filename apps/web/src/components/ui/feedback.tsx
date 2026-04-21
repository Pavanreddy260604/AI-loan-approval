import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RotateCcw, 
  AlertTriangle
} from "lucide-react";
import { Portal } from "./atoms/Portal";

interface NoticeProps {
  message: string;
  tone?: "info" | "success" | "warning" | "danger";
  className?: string;
}

export function InlineNotice({ message, tone = "info", className = "" }: NoticeProps) {
  const tones = {
    info: "border-primary/20 bg-primary/5 text-primary-light",
    success: "border-success/20 bg-success/5 text-success",
    warning: "border-warning/20 bg-warning/5 text-warning",
    danger: "border-danger/20 bg-danger/5 text-danger",
  };

  const Icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
  };

  const Icon = Icons[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-3 rounded-pro border text-xs font-medium ${tones[tone]} ${className}`}
    >
      <Icon size={14} className="shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  );
}

export function InlineError({ message }: { message: string }) {
  return <InlineNotice message={message} tone="danger" />;
}

/* ─── Undo Toast System (Elite v10) ─── */

export function UndoToast({
  message,
  onUndo,
  duration = 10000,
  stackIndex = 0,
}: {
  message: string,
  onUndo: () => void,
  duration?: number,
  stackIndex?: number,
}) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  // Stack toasts vertically: each stacked toast rises 72px above the previous
  const bottomOffset = 32 + stackIndex * 72;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ bottom: bottomOffset }}
      className="fixed left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm"
    >
      <div className="bg-base-950 border border-base-800 shadow-elite-elevated rounded-pro-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
              <span className="text-[10px] font-bold text-primary">{Math.ceil(timeLeft / 1000)}s</span>
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                 <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary/10"
                 />
                 <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * timeLeft / duration)}
                    className="text-primary transition-all duration-100"
                 />
              </svg>
           </div>
           <span className="text-sm font-semibold text-base-50">{message}</span>
        </div>
        <button 
           onClick={onUndo}
           className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-pro text-xs font-bold transition-all uppercase tracking-wider"
        >
           <RotateCcw size={12} /> Undo
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Confirmation Friction Modal (Elite v10) ─── */

export function FrictionModal({ 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  isOpen 
}: { 
  title: string, 
  description: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  isOpen: boolean
}) {
  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
           key="friction-overlay"
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
        >
           <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onCancel}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
           />
           <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-base-950 border border-base-800 rounded-pro-lg p-8 shadow-elite-elevated"
           >
              <div className="flex items-center gap-3 text-warning mb-4">
                 <AlertTriangle size={24} />
                 <h3 className="text-xl font-bold tracking-tight text-base-50">{title}</h3>
              </div>
              <p className="text-sm text-base-400 leading-relaxed mb-8">{description}</p>
              <div className="flex items-center justify-end gap-3">
                 <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-base-500 hover:text-base-300">Cancel</button>
                 <button 
                    onClick={onConfirm} 
                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-pro hover:bg-primary/90 shadow-elite-primary"
                 >
                    Confirm Action
                 </button>
              </div>
           </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
