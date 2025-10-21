import { expect, test } from 'vitest';
import { getUserStats } from '../components/showStats.js';

test('should return user stats for the given range', () => {
  expect(getUserStats("weekly")).toEqual({ accuracy: 90, streak: 5 });
})