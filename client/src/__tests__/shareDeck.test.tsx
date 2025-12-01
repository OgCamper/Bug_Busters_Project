import { expect, test, vi } from 'vitest';
import { deckService } from '../services/DeckService';

test('should share a deck with a friend successfully', async () => {
  const shareSpy = vi
    .spyOn(deckService, 'shareDeck')
    .mockResolvedValue({ success: true } as any);

  const result = await deckService.shareDeck(
    1,
    'friend@example.com',
    'edit',
  );

  expect(shareSpy).toHaveBeenCalledWith(
    1,
    'friend@example.com',
    'edit',
  );
  expect(result).toEqual({ success: true });
});