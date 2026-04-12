import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-warning/90 text-base-950 text-center py-2 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
      <WifiOff size={14} />
      You are offline. Some features may be unavailable.
    </div>
  );
}
