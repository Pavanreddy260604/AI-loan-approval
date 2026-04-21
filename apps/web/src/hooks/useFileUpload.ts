import { useState, useCallback, useRef } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseFileUploadOptions {
  url: string;
  token?: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * useFileUpload - Upload files with progress tracking
 * Uses XMLHttpRequest for upload progress events
 */
export function useFileUpload() {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const upload = useCallback(async (
    file: File,
    options: UseFileUploadOptions
  ): Promise<any> => {
    const { url, token, onProgress, onSuccess, onError } = options;
    
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressData = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          setProgress(progressData);
          onProgress?.(progressData);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        setIsUploading(false);
        setProgress(null);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            onSuccess?.(data);
            resolve(data);
          } catch {
            onSuccess?.(xhr.responseText);
            resolve(xhr.responseText);
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = xhr.statusText || errorMessage;
          }
          const error = new Error(errorMessage);
          onError?.(error);
          reject(error);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setIsUploading(false);
        setProgress(null);
        const error = new Error('Network error during upload');
        onError?.(error);
        reject(error);
      });

      xhr.addEventListener('abort', () => {
        setIsUploading(false);
        setProgress(null);
        const error = new Error('Upload cancelled');
        onError?.(error);
        reject(error);
      });

      // Store abort function
      abortRef.current = () => xhr.abort();

      // Send request
      xhr.open('POST', url);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      xhr.send(formData);
    });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.();
  }, []);

  return {
    upload,
    cancel,
    progress,
    isUploading,
    percentage: progress?.percentage ?? 0
  };
}
