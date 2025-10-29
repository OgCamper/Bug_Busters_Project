import { expect, test } from 'vitest'
import { takeQuiz } from '../components/takeQuiz.js'

test('should return score after taking quiz', () => {
  expect(takeQuiz(["A", "B", "C"], ["A", "C", "C"])).toEqual({ score: 2 });
})