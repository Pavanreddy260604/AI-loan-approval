import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  fileName: string;
  percentage: number;
  isUploading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}

/**
 * UploadProgress - Visual feedback for file upload status
 */
export function UploadProgress({
  fileName,
  percentage,
  isUploading,
  isSuccess,
  isError,
  errorMessage,
  onCancel,
  onRetry
}: UploadProgressProps) {
  // Format file size
  const formatFileName = (name: string) => {
    if (name.length <= 30) return name;
    return name.slice(0, 15) + '...' + name.slice(-12);
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
        <CheckCircle2 size={20} className="text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success truncate">{formatFileName(fileName)}</p>
          <p className="text-xs text-success/70">Upload complete</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-lg">
        <XCircle size={20} className="text-danger shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-danger truncate">{formatFileName(fileName)}</p>
          <p className="text-xs text-danger/70">{errorMessage || 'Upload failed'}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-danger hover:text-danger/80 underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-base-900 border border-base-800 rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        {isUploading ? (
          <Loader2 size={20} className="text-primary animate-spin shrink-0" />
        ) : (
          <Upload size={20} className="text-base-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-base-200 truncate">{formatFileName(fileName)}</p>
          <p className="text-xs text-base-500">
            {isUploading ? `Uploading... ${percentage}%` : 'Ready to upload'}
          </p>
        </div>
        {isUploading && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-medium text-base-500 hover:text-danger transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      {isUploading && (
        <div className="relative h-1.5 bg-base-950 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
