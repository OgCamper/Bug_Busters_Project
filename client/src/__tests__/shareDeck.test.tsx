import { expect, test } from 'vitest'
import { shareDeck } from '../components/ShareDeck.js'

test('should share a deck with a friend successfully', () => {
  expect(shareDeck("Biology", "friend@email.com", "edit")).toEqual({ success: true });
})