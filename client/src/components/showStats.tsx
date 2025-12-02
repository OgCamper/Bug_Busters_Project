// src/components/showStats.tsx

// Define a type for the data your stats return
export interface UserStats {
  accuracy: number;
  streak: number;
}

// The function returns stats for a given range (e.g., '7d', '30d')
export function getUserStats(range: string): UserStats {
  // Placeholder logic — replace later with backend API call
  if (range === '7d') {
    return { accuracy: 90, streak: 5 };
  } else if (range === '30d') {
    return { accuracy: 85, streak: 12 };
  } else {
    return { accuracy: 70, streak: 2 };
  }
}