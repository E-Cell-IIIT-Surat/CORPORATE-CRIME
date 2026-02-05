export const MAX_QUESTIONS = 5;
export const POINTS_PER_QUESTION = 10;

// Codeforces-style scoring: score = max(0.3 * points, points - points/250 * time_in_minutes)
// Where time_in_minutes is measured from event start
export const CODEFORCES_MIN_RATIO = 0.3; // 30% of max points as minimum
export const CODEFORCES_TIME_DIVISOR = 250; // Time divisor for scoring calculation
