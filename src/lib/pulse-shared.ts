// Types and constants for India App Pulse that are safe to use in the browser.
export const PULSE_CATEGORIES = ["Quick commerce", "Payments", "Shopping", "Food & travel", "Investing"] as const;
export type PulseCategory = (typeof PULSE_CATEGORIES)[number];


export interface PulseRow {
  id: string;
  name: string;
  icon: string;
  category: PulseCategory;
  storeRating: number;
  recentRating: number;
  negativeShare: number;
  reviews: number;
  topComplaint: string | null;
  topComplaintShare: number;
  ai: boolean;
}
