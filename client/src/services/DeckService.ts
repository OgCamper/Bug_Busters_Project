import { authService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface DeckSummary {
    id: number;
    title: string;
    description: string | null;
    created_at?: string;
    card_count?: number;
}

export interface Card {
    id: number;
    deck_id: number;
    front_text: string;
    back_text: string;
    created_at?: string;
}

export interface DeckDetail {
    deck: DeckSummary;
    cards: Card[];
}

interface DeckPayload {
    title?: string;
    description?: string | null;
}

interface CardPayload {
    front_text?: string;
    back_text?: string;
}

async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = authService.getToken();
    const headers = new Headers(init?.headers ?? undefined);
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, { ...init, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message ?? 'Request failed');
    }

    return data;
}

function mapDeck(raw: any, cardCount?: number): DeckSummary {
    return {
        id: raw.id ?? raw.deck_id,
        title: raw.title,
        description: raw.description ?? null,
        created_at: typeof raw.created_at === 'string' ? raw.created_at : raw.created_at?.toString(),
        card_count: cardCount ?? raw.card_count,
    };
}

function mapCard(raw: any): Card {
    return {
        id: raw.id ?? raw.card_id,
        deck_id: raw.deck_id,
        front_text: raw.front_text,
        back_text: raw.back_text,
        created_at: typeof raw.created_at === 'string' ? raw.created_at : raw.created_at?.toString(),
    };
}

export const deckService = {
    async listDecks(): Promise<DeckSummary[]> {
        const data = await authorizedFetch(`${API_URL}/decks`, { method: 'GET' });
        return Array.isArray(data.decks) ? data.decks.map((deck: any) => mapDeck(deck, deck.card_count)) : [];
    },

    async createDeck(payload: { title: string; description?: string | null }): Promise<DeckSummary> {
        const data = await authorizedFetch(`${API_URL}/decks/createDeck`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return mapDeck(data.deck);
    },

    async updateDeck(deckId: number, payload: DeckPayload): Promise<DeckSummary> {
        const data = await authorizedFetch(`${API_URL}/decks/${deckId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return mapDeck(data.deck);
    },

    async deleteDeck(deckId: number): Promise<void> {
        await authorizedFetch(`${API_URL}/decks/${deckId}`, { method: 'DELETE' });
    },

    async getDeckDetail(deckId: number): Promise<DeckDetail> {
        const data = await authorizedFetch(`${API_URL}/decks/${deckId}`, { method: 'GET' });
        return {
            deck: mapDeck(data.deck),
            cards: Array.isArray(data.cards) ? data.cards.map((card: any) => mapCard(card)) : [],
        };
    },

    async createCard(deckId: number, payload: Required<CardPayload>): Promise<Card> {
        const data = await authorizedFetch(`${API_URL}/cards/createCard`, {
            method: 'POST',
            body: JSON.stringify({ deckId, ...payload }),
        });
        return mapCard(data.card);
    },

    async updateCard(cardId: number, payload: CardPayload): Promise<Card> {
        const data = await authorizedFetch(`${API_URL}/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return mapCard(data.card);
    },

    async deleteCard(cardId: number): Promise<void> {
        await authorizedFetch(`${API_URL}/cards/${cardId}`, { method: 'DELETE' });
    },
};

