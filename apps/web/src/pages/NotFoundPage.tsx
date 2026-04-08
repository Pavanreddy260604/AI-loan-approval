import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { EliteButton as Button } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="space-y-6 max-w-md">
        <p className="text-8xl font-black text-base-800 tabular-nums tracking-tighter">404</p>
        <h1 className="text-2xl font-bold text-base-50 tracking-tight">Page Not Found</h1>
        <p className="text-sm text-base-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/app/dashboard">
            <Button variant="primary" leftIcon={<Home size={16} />}>
              Go to Dashboard
            </Button>
          </Link>
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
