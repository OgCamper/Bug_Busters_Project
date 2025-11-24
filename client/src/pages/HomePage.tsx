import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deckService, type DeckSummary } from '../services/DeckService';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [processingDeckId, setProcessingDeckId] = useState<number | null>(null);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await deckService.listDecks();
      setDecks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDecks();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateDeck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setCreating(true);
      const newDeck = await deckService.createDeck({
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
      });
      setDecks((prev) => [newDeck, ...prev]);
      setCreateForm({ title: '', description: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create deck');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (deck: DeckSummary) => {
    setEditingDeckId(deck.id);
    setEditForm({
      title: deck.title,
      description: deck.description ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingDeckId(null);
    setEditForm({ title: '', description: '' });
  };

  const handleUpdateDeck = async (event: React.FormEvent<HTMLFormElement>, deckId: number) => {
    event.preventDefault();
    try {
      setProcessingDeckId(deckId);
      const updated = await deckService.updateDeck(deckId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
      });
      setDecks((prev) => prev.map((deck) => (deck.id === deckId ? updated : deck)));
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update deck');
    } finally {
      setProcessingDeckId(null);
    }
  };

  const handleDeleteDeck = async (deckId: number) => {
    if (!confirm('Delete this deck and all of its cards?')) {
      return;
    }
    try {
      setProcessingDeckId(deckId);
      await deckService.deleteDeck(deckId);
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete deck');
    } finally {
      setProcessingDeckId(null);
    }
  };

  const goToDeck = (deckId: number) => {
    navigate(`/decks/${deckId}`);
  };

  const handleTestDeck = (deckId: number) => {
    navigate(`/decks/${deckId}/quiz`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Bug Busters Study App</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome back</h2>
          <div className="space-y-1 text-gray-600">
            <p>
              <span className="font-semibold">Name:</span> {user?.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Create New Deck</h2>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
              >
                Create Deck
              </button>
            )}
          </div>
          {showCreateForm && (
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? 'Saving...' : 'Save deck'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({ title: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Decks</h2>
            <button
              onClick={() => void loadDecks()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading decks...</p>
          ) : decks.length === 0 ? (
            <p className="text-gray-500">No decks yet. Create your first one above.</p>
          ) : (
            <ul className="space-y-4">
              {decks.map((deck) => (
                <li key={deck.id} className="rounded-lg border border-gray-200 p-4">
                  {editingDeckId === deck.id ? (
                    <form
                      onSubmit={(event) => handleUpdateDeck(event, deck.id)}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, title: e.target.value }))
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
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-60"
                          disabled={processingDeckId === deck.id}
                        >
                          {processingDeckId === deck.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{deck.title}</h3>
                          {deck.description && (
                            <p className="text-gray-600 text-sm">{deck.description}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {deck.card_count ?? 0} cards
                        </span>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => goToDeck(deck.id)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleTestDeck(deck.id)}
                          className="px-3 py-1 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100"
                        >
                          Test deck
                        </button>
                        <button
                          onClick={() => startEditing(deck)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-60"
                          disabled={processingDeckId === deck.id}
                        >
                          {processingDeckId === deck.id ? 'Deleting...' : 'Delete'}
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

