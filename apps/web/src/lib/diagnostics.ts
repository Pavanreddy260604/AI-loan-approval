/**
 * Translations for technical machine learning and data processing errors
 * to make them understandable for business users.
 */

const ERROR_PATTERNS = [
  {
    regex: /Target column '.*' has only one class after mapping to positive label '.*'/i,
    translation: "Not enough different results. Your dataset needs both 'Approved' and 'Rejected' examples to train the model correctly. Currently, it seems to have only one type of result."
  },
  {
    regex: /Binary classification requires at least two classes/i,
    translation: "Outcome Variety Required. The AI cannot learn patterns if every row has the same result. Please ensure your data includes a mix of different outcomes."
  },
  {
    regex: /Target column '.*' not found.*Available fields: (.*)/i,
    translation: "Column Selection Error. We couldn't find your target field, but we detected: $1. Please update your mapping to match one of these."
  },
  {
    regex: /Target column '.*' contains only one class.*Detected values in file: \[(.*)\]/i,
    translation: "Outcome Variety Required. This field only contains one type of result ([$1]), so the AI cannot learn patterns. Please choose a column with both positive and negative outcomes."
  },
  {
    regex: /Target column '.*' not found/i,
    translation: "Column Selection Error. The specific label you chose for the decision outcome was not found in the file. Please re-check your mapping."
  },
  {
    regex: /insufficient samples/i,
    translation: "Data Volume Issue. The dataset is too small for accurate learning. We recommend at least 200-500 rows for model training."
  },
  {
    regex: /invalid feature type/i,
    translation: "Data Formatting Error. Some columns contain mixed data (like numbers and text together). Please clean your data and ensure each column has a consistent type."
  },
  {
    regex: /Internal Server Error/i,
    translation: "System Error. We encountered an unexpected problem while training. Our team has been notified; please try again in a few minutes."
  }
];

/**
 * Translates a technical error message into a user-friendly version.
 * If no pattern matches, returns the original message.
 */
export function translateError(error: string | null | undefined): string {
  if (!error) return "Unknown error during processing";
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.regex.test(error)) {
      return pattern.translation;
    }
  }
  
  return error;
}
