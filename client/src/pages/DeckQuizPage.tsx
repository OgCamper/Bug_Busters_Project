import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deckService, type Card, type DeckSummary } from '../services/DeckService';
import { useAuth } from '../contexts/AuthContext';

type FeedbackState = 'correct' | 'incorrect' | null;

export default function DeckQuizPage() {
    const { deckId } = useParams();
    const numericDeckId = useMemo(() => Number(deckId), [deckId]);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<DeckSummary | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const loadQuiz = useCallback(async () => {
        if (!Number.isInteger(numericDeckId)) {
            setError('Invalid deck id');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const detail = await deckService.getDeckDetail(numericDeckId);
            setDeck(detail.deck);
            setCards(detail.cards);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    }, [numericDeckId]);

    useEffect(() => {
        void loadQuiz();
    }, [loadQuiz]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const goHome = () => {
        navigate('/home');
    };

    const currentCard = cards[currentIndex];

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentCard || feedback) return;

        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedBack = currentCard.back_text.trim().toLowerCase();
        const isCorrect = normalizedAnswer === normalizedBack;

        if (isCorrect) {
            setScore((prev) => prev + 1);
        }
        setFeedback(isCorrect ? 'correct' : 'incorrect');
    };

    const handleNext = () => {
        if (!feedback) return;

        if (currentIndex + 1 >= cards.length) {
            setCompleted(true);
        } else {
            setCurrentIndex((prev) => prev + 1);
        }

        setAnswer('');
        setFeedback(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <span className="text-gray-600">Loading quiz...</span>
            </div>
        );
    }

    if (error || !deck) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
                <p className="text-red-600 mb-4">{error ?? 'Deck not found'}</p>
                <button
                    onClick={goHome}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center space-y-4">
                <p className="text-gray-700">This deck has no cards to quiz yet.</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/decks/${deck.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                        Add cards
                    </button>
                    <button
                        onClick={goHome}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={goHome}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            ← Back to Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <header className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-500">Deck quiz</p>
                    <h1 className="text-2xl font-bold text-gray-900">{deck.title}</h1>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span>
                            Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}
                        </span>
                        <span>Score: {score}</span>
                    </div>
                </header>

                {completed ? (
                    <section className="bg-white rounded-lg shadow p-6 text-center space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Quiz complete!</h2>
                        <p className="text-gray-700">
                            You answered {score} out of {cards.length} cards correctly.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={goHome}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                            >
                                Back to Home
                            </button>
                            <button
                                onClick={() => {
                                    setCurrentIndex(0);
                                    setScore(0);
                                    setCompleted(false);
                                    setAnswer('');
                                    setFeedback(null);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
                            >
                                Retake quiz
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
                                Front
                            </p>
                            <p className="text-lg text-gray-900">{currentCard.front_text}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your answer
                                </label>
                                <input
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                                    placeholder="Type the back text"
                                    disabled={!!feedback}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-60"
                                disabled={!!feedback}
                            >
                                Check answer
                            </button>
                        </form>

                        {feedback && (
                            <div
                                className={`rounded-md border p-4 flex items-center gap-3 ${
                                    feedback === 'correct'
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-red-200 bg-red-50 text-red-700'
                                }`}
                            >
                                {feedback === 'correct' ? (
                                    <span aria-hidden="true">✅</span>
                                ) : (
                                    <span aria-hidden="true">❌</span>
                                )}
                                <div>
                                    <p className="font-semibold">
                                        {feedback === 'correct' ? 'Correct!' : 'Incorrect.'}
                                    </p>
                                    {feedback === 'incorrect' && (
                                        <p className="text-sm">
                                            Correct answer: <span className="font-medium">{currentCard.back_text}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50"
                                disabled={!feedback}
                            >
                                {currentIndex + 1 >= cards.length ? 'Finish quiz' : 'Next card'}
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

