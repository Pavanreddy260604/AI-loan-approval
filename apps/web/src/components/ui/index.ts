/**
 * Design System Component Library
 * Barrel export file for all UI components organized by atomic design principles.
 * 
 * This is the primary API for the Elite v2 design system.
 */

// --- Atomic Design Tiers (Elite v2) ---
// Export all atoms, molecules, and organisms from their respective barrel files
export * from "./atoms";
export * from "./molecules";
export * from "./organisms";

// --- Backward Compatibility Aliases ---
// Provide "Elite" prefixed exports for pages that still use them
export { Button as EliteButton } from "./atoms/Button";
export { Input as EliteInput } from "./atoms/Input";
export { Select as EliteSelect } from "./atoms/Select";
export { Textarea as EliteTextarea } from "./atoms/Textarea";
export { Badge as EliteBadge } from "./atoms/Badge";
export { Avatar as EliteAvatar } from "./atoms/Avatar";
export { Spinner as EliteSpinner } from "./atoms/Spinner";
export { Checkbox as EliteCheckbox } from "./atoms/Checkbox";
export { Radio as EliteRadio } from "./atoms/Radio";
export { Switch as EliteSwitch } from "./atoms/Switch";
export { SkeletonLoader as EliteSkeletonLoader } from "./atoms/SkeletonLoader";
export { ProgressBar as EliteProgressBar } from "./atoms/ProgressBar";
export { InlineError as EliteInlineError } from "./atoms/InlineError";
export { Card as EliteCard } from "./molecules/Card";

// --- Legacy Specialized Components (Preserved for specific use cases) ---
// These components have unique implementations not covered by the atomic design system

export { MetricCard, ShinyMetricCard } from "./metrics";
export { InlineNotice, UndoToast, FrictionModal } from "./feedback";
export * from "./status-pulse";
export * from "./gradient-dots";
export * from "./friction-gate";
export * from "./radial-orbital-timeline";
export * from "./skeleton-grid";
export * from "./section-title";

// Re-export specific utilities
export { useToast } from "./molecules/Toast";
export { useBreakpoint } from "../../hooks/useBreakpoint";
