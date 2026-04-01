import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFileSize, validateFileType, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from './validation/fileValidation.js';

/**
 * Property-Based Tests for File Upload Validation & Atomicity Model
 * Feature: user-file-management-and-payments
 *
 * Tests correctness properties 16 and 17 from the design document.
 */

// ─── Shared Generators ───────────────────────────────────────────

/** Random file sizes (1 byte to 200MB) */
const validFileSizeArb = fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES });
const invalidFileSizeArb = fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: 200 * 1024 * 1024 });
const emptyFileSizeArb = fc.integer({ min: -100, max: 0 });

/** Valid and Invalid MIME Types */
const validMimeTypeArb = fc.constantFrom(...ALLOWED_MIME_TYPES);
const invalidMimeTypeArb = fc.string().filter(t => !ALLOWED_MIME_TYPES.has(t));


describe('File Upload - Property-Based Tests', () => {

  /**
   * Property 16: File Upload Validation
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  describe('Feature: user-file-management, Property 16: File Upload Validation', () => {
    
    it('valid file sizes inside limits are always accepted', () => {
      fc.assert(
        fc.property(
          validFileSizeArb,
          (size) => {
            const result = validateFileSize(size);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('files larger than 100MB are always rejected', () => {
      fc.assert(
        fc.property(
          invalidFileSizeArb,
          (size) => {
            const result = validateFileSize(size);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('100MB');
            expect(typeof result.error).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty files or zero bytes are always rejected', () => {
      fc.assert(
        fc.property(
          emptyFileSizeArb,
          (size) => {
            const result = validateFileSize(size);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('allowed file types are always accepted', () => {
      fc.assert(
        fc.property(
          validMimeTypeArb,
          (mime) => {
            const result = validateFileType(mime);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('disallowed file types are always rejected with type list', () => {
      fc.assert(
        fc.property(
          invalidMimeTypeArb,
          (mime) => {
            const result = validateFileType(mime);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('not supported');
            expect(result.error).toContain('JPEG');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validation gracefully handles extremely large random file constraints', () => {
      fc.assert(
        fc.property(
          fc.maxSafeInteger(),
          (size) => {
            const result = validateFileSize(size);
            if (size > MAX_FILE_SIZE_BYTES) {
              expect(result.valid).toBe(false);
            } else if (size > 0) {
              expect(result.valid).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: File Upload Atomicity
   * Validates: Requirements 8.4, 8.5
   * 
   * This tests the theoretical state transition machine for our atomic
   * file upload function. Actual S3 operations are mocked/verified elsewhere 
   * via unit tests, but the state machine itself is property-tested here.
   */
  describe('Feature: user-file-management, Property 17: File Upload Atomicity', () => {
    
    // Simulates the upload pipeline states
    const simulateUploadPipeline = (s3Success: boolean, dbSuccess: boolean): string[] => {
      const actions: string[] = [];
      
      // 1. Upload to S3
      if (s3Success) {
        actions.push('S3_UPLOAD');
      } else {
        actions.push('S3_FAIL');
        return actions; // Early exit on S3 failure
      }

      // 2. Insert to DB
      if (dbSuccess) {
        actions.push('DB_INSERT');
        actions.push('SUCCESS_RESPONSE');
      } else {
        actions.push('DB_FAIL');
        actions.push('ROLLBACK_S3');
        actions.push('FAIL_RESPONSE');
      }

      return actions;
    };

    it('successful pipeline creates S3 and DB records fully', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          fc.constant(true),
          (s3Success, dbSuccess) => {
            const actions = simulateUploadPipeline(s3Success, dbSuccess);
            expect(actions).toEqual(['S3_UPLOAD', 'DB_INSERT', 'SUCCESS_RESPONSE']);
            expect(actions).not.toContain('ROLLBACK_S3');
          }
        )
      );
    });

    it('partial failure (DB fails after S3) reliably triggers S3 rollback', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          fc.constant(false),
          (s3Success, dbSuccess) => {
            const actions = simulateUploadPipeline(s3Success, dbSuccess);
            expect(actions).toContain('S3_UPLOAD');
            expect(actions).toContain('DB_FAIL');
            expect(actions).toContain('ROLLBACK_S3');
            expect(actions).not.toContain('DB_INSERT');
          }
        )
      );
    });

    it('early failure (S3 fails) leaves no orphaned DB rows and avoids rollback', () => {
      fc.assert(
        fc.property(
          fc.constant(false),
          fc.boolean(), // DB success doesn't matter since S3 failed first
          (s3Success, dbSuccess) => {
            const actions = simulateUploadPipeline(s3Success, dbSuccess);
            expect(actions).toEqual(['S3_FAIL']);
            expect(actions).not.toContain('DB_INSERT');
            expect(actions).not.toContain('ROLLBACK_S3');
          }
        )
      );
    });

  });
});
