export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/json",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file size against the maximum allowed limit (100MB)
 * Requirement: 8.4
 */
export function validateFileSize(sizeBytes: number): ValidationResult {
  if (sizeBytes <= 0) {
    return { valid: false, error: "File cannot be empty." };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File size (\${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of 100MB.` 
    };
  }
  return { valid: true };
}

/**
 * Validates the file's content type against the allowed list of formats
 * Requirement: 8.5
 */
export function validateFileType(contentType: string): ValidationResult {
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return { 
      valid: false, 
      error: `File type '\${contentType}' is not supported. Allowed types: JPEG, PNG, GIF, PDF, TXT, JSON.` 
    };
  }
  return { valid: true };
}
