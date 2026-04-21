/**
 * Helpers for deriving / synthesising human-readable applicant labels.
 *
 * Training datasets frequently ship without a real applicant name column —
 * they're anonymised or purely numeric. For the reviewer UX we still want
 * a stable, readable label instead of "Loan Application" or a raw UUID.
 *
 * - `deriveLoanName` picks the best existing label from the features payload,
 *   preferring an applicant name, then purpose/loan-type, then any reasonable
 *   short string, finally falling back to a synthetic name seeded by
 *   prediction id so the same record always shows the same placeholder.
 * - `generateSyntheticName` returns a realistic first + last name. Seeded
 *   by the prediction id it's deterministic per-record.
 */

const FIRST_NAMES = [
  "Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Neha", "Arjun", "Sara",
  "James", "Olivia", "Ethan", "Emma", "Noah", "Ava", "Liam", "Sophia",
  "Mason", "Isabella", "Lucas", "Mia", "Logan", "Amelia", "Kai", "Zara",
  "Ibrahim", "Layla", "Marcus", "Elena", "Diego", "Nora", "Hiro", "Yuki",
  "Chen", "Mei", "Oliver", "Charlotte", "Benjamin", "Harper", "Daniel", "Ella"
];

const LAST_NAMES = [
  "Patel", "Sharma", "Kumar", "Reddy", "Singh", "Gupta", "Iyer", "Nair",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
  "Harris", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "King",
  "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell"
];

/**
 * Deterministic 32-bit hash (FNV-1a). Used to seed synthetic names so the
 * same prediction id always yields the same placeholder.
 */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function generateSyntheticName(seed?: string | null): string {
  const h = fnv1a(seed && seed.length > 0 ? seed : String(Date.now() + Math.random()));
  const first = FIRST_NAMES[h % FIRST_NAMES.length];
  const last = LAST_NAMES[(h >>> 8) % LAST_NAMES.length];
  return `${first} ${last}`;
}

const APPLICANT_NAME_KEYS = [
  "applicant_name", "applicantName", "name", "full_name", "fullName",
  "customer_name", "borrower_name"
];

const LOAN_LABEL_KEYS = [
  "loan_type", "loan_purpose", "purpose", "product", "description"
];

/**
 * Returns the best human-readable label for a loan record.
 * Falls back to a deterministic synthetic name seeded by `predictionId`
 * so the UI never shows "Loan Application".
 */
export function deriveLoanName(
  features: Record<string, any> | null | undefined,
  predictionId?: string | null
): string {
  if (features && typeof features === "object") {
    // 1. Explicit applicant name wins
    for (const key of APPLICANT_NAME_KEYS) {
      const val = features[key];
      if (typeof val === "string" && val.trim().length > 1 && val.trim().length < 80) {
        return val.trim();
      }
    }
    // 2. Otherwise a loan label (e.g. "Home Loan")
    for (const key of LOAN_LABEL_KEYS) {
      const val = features[key];
      if (typeof val === "string" && val.trim().length > 1 && val.trim().length < 60) {
        return val.trim();
      }
    }
    // 3. Any reasonable short string field
    for (const val of Object.values(features)) {
      if (typeof val === "string" && val.trim().length > 2 && val.trim().length < 40) {
        return val.trim();
      }
    }
  }

  // 4. Synthetic fallback, deterministic per prediction id
  return generateSyntheticName(predictionId ?? null);
}

/**
 * Ensures a submitted prediction payload carries an applicant name.
 * If the user left it blank (or it was stripped), we slot in a synthetic one
 * so the dashboard, recent decisions list, and loan detail page all show
 * something readable.
 */
export function ensureApplicantName(
  features: Record<string, any>,
  providedName?: string
): Record<string, any> {
  const clean = providedName?.trim();
  if (clean && clean.length > 0) {
    return { ...features, applicant_name: clean };
  }
  if (typeof features.applicant_name === "string" && features.applicant_name.trim().length > 0) {
    return features;
  }
  return { ...features, applicant_name: generateSyntheticName() };
}
