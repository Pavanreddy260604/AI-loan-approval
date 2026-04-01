
import { Badge } from './Badge';

/**
 * RiskTag Component
 * 
 * A specialized badge component for displaying risk scores.
 * Automatically determines the appropriate color tone based on the risk score.
 */

export interface RiskTagProps {
  /** Risk score (0-100) or null for pending state */
  score: number | null;
}

export function RiskTag({ score }: RiskTagProps) {
  if (score === null) {
    return <Badge tone="ghost">Pending</Badge>;
  }
  
  if (score < 30) {
    return <Badge tone="success">Low Risk</Badge>;
  }
  
  if (score < 70) {
    return <Badge tone="warning">Med Risk</Badge>;
  }
  
  return <Badge tone="danger">High Risk</Badge>;
}
