import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { deckService, type DeckSummary, type Card, type DeckDetail } from '../services/DeckService';
import { authService } from '../services/AuthService';

describe('deckService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // simple in-memory localStorage mock (needed because authService.getToken uses localStorage)
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listDecks calls API and maps response', async () => {
    const apiResponse = {
      decks: [
        { id: 1, title: 'Deck 1', description: 'desc', card_count: 3 },
        { deck_id: 2, title: 'Deck 2', description: null, card_count: 0 },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deckService.listDecks();

    expect(fetchMock).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject<Partial<DeckSummary>>({
      id: 1,
      title: 'Deck 1',
      description: 'desc',
      card_count: 3,
    });
    expect(result[1]).toMatchObject<Partial<DeckSummary>>({
      id: 2,
      title: 'Deck 2',
      description: null,
      card_count: 0,
    });
  });

  it('createDeck posts payload and returns mapped deck', async () => {
    const apiResponse = {
      deck: { id: 10, title: 'New Deck', description: 'hello' },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deckService.createDeck({ title: 'New Deck', description: 'hello' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/decks/createDeck'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toMatchObject<Partial<DeckSummary>>({
      id: 10,
      title: 'New Deck',
      description: 'hello',
    });
  });

  it('getDeckDetail returns mapped deck and cards', async () => {
    const apiResponse: DeckDetail = {
      deck: { id: 5, title: 'Detail Deck', description: null },
      cards: [
        { id: 1, deck_id: 5, front_text: 'front', back_text: 'back' },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deckService.getDeckDetail(5);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/decks/5'),
      expect.any(Object),
    );
    expect(result.deck).toMatchObject<Partial<DeckSummary>>({
      id: 5,
      title: 'Detail Deck',
    });
    expect(result.cards[0]).toMatchObject<Partial<Card>>({
      id: 1,
      deck_id: 5,
      front_text: 'front',
      back_text: 'back',
    });
  });

  it('createCard posts payload and returns mapped card', async () => {
    const apiResponse = {
      card: {
        id: 100,
        deck_id: 9,
        front_text: 'Q',
        back_text: 'A',
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deckService.createCard(9, { front_text: 'Q', back_text: 'A' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/cards/createCard'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toMatchObject<Partial<Card>>({
      id: 100,
      deck_id: 9,
      front_text: 'Q',
      back_text: 'A',
    });
  });

  it('shareDeck posts share request and returns response', async () => {
    const apiResponse = { success: true };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deckService.shareDeck(1, 'friend@example.com', 'editor');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/decks/1/share'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toEqual(apiResponse);
  });

  it('uses Authorization header when token is available', async () => {
    const getTokenSpy = vi.spyOn(authService, 'getToken').mockReturnValue('mock-token');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ decks: [] }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    await deckService.listDecks();

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const headers = new Headers(init.headers as HeadersInit);
    expect(getTokenSpy).toHaveBeenCalled();
    expect(headers.get('Authorization')).toBe('Bearer mock-token');
  });
});


