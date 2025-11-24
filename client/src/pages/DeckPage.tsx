import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deckService, type Card, type DeckSummary } from '../services/DeckService';
import { useAuth } from '../contexts/AuthContext';

interface CardFormState {
    front_text: string;
    back_text: string;
}

export default function DeckPage() {
    const { deckId } = useParams();
    const numericDeckId = useMemo(() => Number(deckId), [deckId]);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<DeckSummary | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [deckForm, setDeckForm] = useState({ title: '', description: '' });
    const [deckSaving, setDeckSaving] = useState(false);

    const [cardForm, setCardForm] = useState<CardFormState>({ front_text: '', back_text: '' });
    const [cardCreating, setCardCreating] = useState(false);

    const [editingCardId, setEditingCardId] = useState<number | null>(null);
    const [cardEditForm, setCardEditForm] = useState<CardFormState>({ front_text: '', back_text: '' });
    const [cardSavingId, setCardSavingId] = useState<number | null>(null);

    const loadDeck = useCallback(async () => {
        if (!Number.isInteger(numericDeckId)) {
            setError('Invalid deck id');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await deckService.getDeckDetail(numericDeckId);
            setDeck(data.deck);
            setDeckForm({
                title: data.deck.title,
                description: data.deck.description ?? '',
            });
            setCards(data.cards);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load deck');
        } finally {
            setLoading(false);
        }
    }, [numericDeckId]);

    useEffect(() => {
        void loadDeck();
    }, [loadDeck]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleBack = () => {
        navigate('/home');
    };

    const handleDeckUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!deck) return;

        try {
            setDeckSaving(true);
            const updated = await deckService.updateDeck(deck.id, {
                title: deckForm.title.trim(),
                description: deckForm.description.trim() || null,
            });
            setDeck(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update deck');
        } finally {
            setDeckSaving(false);
        }
    };

    const handleCreateCard = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!Number.isInteger(numericDeckId)) {
            return;
        }

        try {
            setCardCreating(true);
            const newCard = await deckService.createCard(numericDeckId, {
                front_text: cardForm.front_text.trim(),
                back_text: cardForm.back_text.trim(),
            });
            setCards((prev) => [newCard, ...prev]);
            setCardForm({ front_text: '', back_text: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create card');
        } finally {
            setCardCreating(false);
        }
    };

    const startEditCard = (card: Card) => {
        setEditingCardId(card.id);
        setCardEditForm({ front_text: card.front_text, back_text: card.back_text });
    };

    const cancelEditCard = () => {
        setEditingCardId(null);
        setCardEditForm({ front_text: '', back_text: '' });
    };

    const handleUpdateCard = async (event: React.FormEvent<HTMLFormElement>, cardId: number) => {
        event.preventDefault();
        try {
            setCardSavingId(cardId);
            const updated = await deckService.updateCard(cardId, {
                front_text: cardEditForm.front_text.trim(),
                back_text: cardEditForm.back_text.trim(),
            });
            setCards((prev) => prev.map((card) => (card.id === cardId ? updated : card)));
            cancelEditCard();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update card');
        } finally {
            setCardSavingId(null);
        }
    };

    const handleDeleteCard = async (cardId: number) => {
        if (!confirm('Delete this flashcard?')) return;
        try {
            setCardSavingId(cardId);
            await deckService.deleteCard(cardId);
            setCards((prev) => prev.filter((card) => card.id !== cardId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delete card');
        } finally {
            setCardSavingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <span className="text-gray-600">Loading deck...</span>
            </div>
        );
    }

    if (error && !deck) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={handleBack}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            ← Back to decks
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {deck && (
                    <section className="bg-white rounded-lg shadow p-6 space-y-6">
                        <header>
                            <p className="text-sm text-gray-500">
                                Created{' '}
                                {deck.created_at
                                    ? new Date(deck.created_at).toLocaleDateString()
                                    : 'recently'}
                            </p>
                            <h1 className="text-2xl font-bold text-gray-800">{deck.title}</h1>
                            {deck.description && (
                                <p className="text-gray-600 mt-2">{deck.description}</p>
                            )}
                        </header>

                        <form onSubmit={handleDeckUpdate} className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800">Edit deck</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    value={deckForm.title}
                                    onChange={(e) =>
                                        setDeckForm((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={deckForm.description}
                                    onChange={(e) =>
                                        setDeckForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                    rows={3}
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-60"
                                disabled={deckSaving}
                            >
                                {deckSaving ? 'Saving...' : 'Save deck changes'}
                            </button>
                        </form>
                    </section>
                )}

                <section className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Add a flashcard</h2>
                    <form onSubmit={handleCreateCard} className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Front text
                            </label>
                            <textarea
                                value={cardForm.front_text}
                                onChange={(e) =>
                                    setCardForm((prev) => ({ ...prev, front_text: e.target.value }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                rows={2}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Back text
                            </label>
                            <textarea
                                value={cardForm.back_text}
                                onChange={(e) =>
                                    setCardForm((prev) => ({ ...prev, back_text: e.target.value }))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                rows={2}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="justify-self-start inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-60"
                            disabled={cardCreating}
                        >
                            {cardCreating ? 'Adding...' : 'Add flashcard'}
                        </button>
                    </form>
                </section>

                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Flashcards ({cards.length})
                    </h2>

                    {cards.length === 0 ? (
                        <p className="text-gray-500">No cards yet. Start by adding one above.</p>
                    ) : (
                        <ul className="space-y-4">
                            {cards.map((card) => (
                                <li key={card.id} className="rounded-lg border border-gray-200 p-4">
                                    {editingCardId === card.id ? (
                                        <form
                                            onSubmit={(event) => handleUpdateCard(event, card.id)}
                                            className="space-y-3"
                                        >
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Front
                                                </label>
                                                <textarea
                                                    value={cardEditForm.front_text}
                                                    onChange={(e) =>
                                                        setCardEditForm((prev) => ({
                                                            ...prev,
                                                            front_text: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                                    rows={2}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Back
                                                </label>
                                                <textarea
                                                    value={cardEditForm.back_text}
                                                    onChange={(e) =>
                                                        setCardEditForm((prev) => ({
                                                            ...prev,
                                                            back_text: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                                    rows={2}
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-60"
                                                    disabled={cardSavingId === card.id}
                                                >
                                                    {cardSavingId === card.id ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditCard}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm uppercase tracking-wide text-gray-500">
                                                    Front
                                                </p>
                                                <p className="text-gray-800">{card.front_text}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm uppercase tracking-wide text-gray-500">
                                                    Back
                                                </p>
                                                <p className="text-gray-800">{card.back_text}</p>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => startEditCard(card)}
                                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-60"
                                                    disabled={cardSavingId === card.id}
                                                >
                                                    {cardSavingId === card.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

