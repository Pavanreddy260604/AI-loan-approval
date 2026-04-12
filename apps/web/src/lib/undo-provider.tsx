import React, { createContext, useContext, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { UndoToast } from "../components/ui/feedback";

interface PendingAction {
  id: string;
  message: string;
  execute: () => Promise<void>;
  onUndo: () => void;
  timestamp: number;
}

interface UndoContextType {
  addAction: (message: string, execute: () => Promise<void>, onUndo: () => void) => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addAction = (message: string, execute: () => Promise<void>, onUndo: () => void) => {
    const id = Math.random().toString(36).substring(7);
    const action: PendingAction = { id, message, execute, onUndo, timestamp: Date.now() };

    setPendingActions((current) => [...current, action]);

    // Schedule execution after 10 seconds
    timeouts.current[id] = setTimeout(async () => {
      try {
        await execute();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Action failed. Please try again.";
        setErrorMessage(msg);
        // Auto-dismiss error after 5s
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setPendingActions((current) => current.filter((a) => a.id !== id));
        delete timeouts.current[id];
      }
    }, 10000);
  };

  const undoAction = (id: string) => {
    const action = pendingActions.find((a) => a.id === id);
    if (action) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
      action.onUndo();
      setPendingActions((current) => current.filter((a) => a.id !== id));
    }
  };

  return (
    <UndoContext.Provider value={{ addAction }}>
      {children}
      <AnimatePresence>
        {pendingActions.map((action) => (
          <UndoToast
            key={action.id}
            message={action.message}
            onUndo={() => undoAction(action.id)}
            duration={10000}
          />
        ))}
      </AnimatePresence>
      {errorMessage && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[300] bg-danger/90 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-2xl border border-danger/50"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) throw new Error("useUndo must be used within UndoProvider");
  return context;
}
