import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deckService, type Card, type DeckSummary } from '../services/DeckService';
import { useAuth } from '../contexts/AuthContext';

type FeedbackState = 'correct' | 'incorrect' | null;

type SpacedCard = Card & {
    interval: number; // how many questions between appearances
    dueIn: number; // countdown until it's eligible again
    seenCount: number;
    correctCount: number;
    incorrectCount: number;
};

const MAX_INTERVAL = 16; // max spacing in "questions"
const MIN_QUESTIONS = 10; // minimum questions before we allow ending
const MULTIPLIER = 2; // how fast interval grows when correct

export default function SpacedQuizPage() {
    const { deckId } = useParams();
    const numericDeckId = useMemo(() => Number(deckId), [deckId]);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<DeckSummary | null>(null);
    const [cards, setCards] = useState<SpacedCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
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

            const initialCards: SpacedCard[] = (detail.cards ?? []).map((card) => ({
                ...card,
                interval: 1,
                dueIn: 0, // ready immediately
                seenCount: 0,
                correctCount: 0,
                incorrectCount: 0,
            }));

            setDeck(detail.deck);
            setCards(initialCards);
            setCurrentIndex(initialCards.length > 0 ? 0 : null);
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

    const currentCard =
        currentIndex !== null && currentIndex >= 0 && currentIndex < cards.length
            ? cards[currentIndex]
            : null;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentCard || feedback) return;

        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedBack = currentCard.back_text.trim().toLowerCase();
        const isCorrect = normalizedAnswer === normalizedBack;

        if (isCorrect) {
            setCorrectCount((prev) => prev + 1);
        }

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        // Update the card's interval and dueIn based on correctness
        setCards((prevCards) =>
            prevCards.map((card, idx) => {
                if (idx !== currentIndex) return card;

                if (isCorrect) {
                    const newInterval = Math.min(MAX_INTERVAL, card.interval * MULTIPLIER);
                    return {
                        ...card,
                        interval: newInterval,
                        dueIn: newInterval,
                        seenCount: card.seenCount + 1,
                        correctCount: card.correctCount + 1,
                    };
                } else {
                    // Got it wrong → show much more frequently
                    return {
                        ...card,
                        interval: 1,
                        dueIn: 1,
                        seenCount: card.seenCount + 1,
                        incorrectCount: card.incorrectCount + 1,
                    };
                }
            })
        );
    };

    const pickNextCardIndex = (
        cardsState: SpacedCard[],
        currentIdx: number | null
    ): number | null => {
        if (cardsState.length === 0) return null;

        // Decrement dueIn for all other cards (one question has just been asked)
        let updated = cardsState.map((card, idx) =>
            idx === currentIdx
                ? card
                : {
                      ...card,
                      dueIn: Math.max(0, card.dueIn - 1),
                  }
        );

        // Find cards that are due (dueIn <= 0)
        let eligibleIndices = updated
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => card.dueIn <= 0)
            .map(({ idx }) => idx);

        // If somehow none are due, relax: just allow all
        if (eligibleIndices.length === 0) {
            eligibleIndices = updated.map((_, idx) => idx);
            updated = updated.map((card) => ({ ...card, dueIn: 0 }));
        }

        // Prefer cards with smaller interval (weaker) by weighting
        const weights = eligibleIndices.map((idx) => {
            const interval = updated[idx].interval;
            return 1 / (interval || 1); // smaller interval → higher weight
        });
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let r = Math.random() * totalWeight;

        let chosenIdx = eligibleIndices[0];
        for (let i = 0; i < eligibleIndices.length; i++) {
            r -= weights[i];
            if (r <= 0) {
                chosenIdx = eligibleIndices[i];
                break;
            }
        }

        // Persist the decremented dueIn changes
        setCards(updated);

        return chosenIdx;
    };

    const handleNext = () => {
        if (!feedback) return;

        const newQuestionCount = questionCount + 1;
        setQuestionCount(newQuestionCount);
        setAnswer('');
        setFeedback(null);

        const nextIndex = pickNextCardIndex(cards, currentIndex);

        if (nextIndex === null) {
            setCompleted(true);
            return;
        }

        setCurrentIndex(nextIndex);
    };

    const handleFinishNow = () => {
        // Let the user manually end after some minimal exposure
        if (questionCount < MIN_QUESTIONS && cards.length > 0) {
            if (!confirm(`You've only answered ${questionCount} questions. End session anyway?`)) {
                return;
            }
        }
        setCompleted(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <span className="text-gray-600">Loading spaced quiz...</span>
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

    if (cards.length === 0 || currentCard == null) {
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

    if (completed) {
        const stats = cards
            .map((card) => {
                const total = card.correctCount + card.incorrectCount;
                const missRate = total > 0 ? card.incorrectCount / total : 0;
                return {
                    card,
                    total,
                    missRate,
                    incorrect: card.incorrectCount,
                };
            })
            .sort((a, b) => b.missRate - a.missRate);

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
                    <section className="bg-white rounded-lg shadow p-6 text-center space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Spaced quiz complete!</h2>
                        <p className="text-gray-700">
                            You answered {correctCount} out of {questionCount} questions correctly.
                        </p>
                        <p className="text-sm text-gray-500">
                            This session used spaced repetition based on how many questions you've seen,
                            so cards you struggled with appeared more often.
                        </p>
                    </section>

                    <section className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 text-left">
                            Question results (most missed at the top)
                        </h3>
                        {stats.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No questions were answered in this session.
                            </p>
                        ) : (
                            <ul className="space-y-3 text-left">
                                {stats.map(({ card, total, missRate, incorrect }) => {
                                    const percentMiss = total > 0 ? Math.round(missRate * 100) : 0;
                                    const isStrong = missRate === 0;
                                    const isWeak = missRate >= 0.5;

                                    const baseClasses =
                                        'flex flex-col gap-1 rounded-md border px-3 py-2 text-sm';
                                    const colorClasses = isWeak
                                        ? 'border-red-200 bg-red-50 text-red-800'
                                        : isStrong
                                        ? 'border-green-200 bg-green-50 text-green-800'
                                        : 'border-yellow-200 bg-yellow-50 text-yellow-800';

                                    return (
                                        <li key={card.id} className={`${baseClasses} ${colorClasses}`}>
                                            <div className="font-medium">
                                                {card.front_text}
                                            </div>
                                            <div className="text-xs">
                                                <span className="font-semibold">Back:</span>{' '}
                                                {card.back_text}
                                            </div>
                                            <div className="text-xs mt-1">
                                                <span className="font-semibold">Missed:</span>{' '}
                                                {incorrect} / {total}{' '}
                                                ({percentMiss}
                                                %)
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    <section className="bg-white rounded-lg shadow p-6 text-center space-y-4">
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={goHome}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
                            >
                                Back to Home
                            </button>
                            <button
                                onClick={() => {
                                    // restart session
                                    setCompleted(false);
                                    setQuestionCount(0);
                                    setCorrectCount(0);
                                    setAnswer('');
                                    setFeedback(null);
                                    // reset SR state
                                    setCards((prev) =>
                                        prev.map((card) => ({
                                            ...card,
                                            interval: 1,
                                            dueIn: 0,
                                            seenCount: 0,
                                        }))
                                    );
                                    setCurrentIndex(0);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
                            >
                                Start another spaced quiz
                            </button>
                        </div>
                    </section>
                </main>
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
                    <p className="text-sm text-gray-500">Spaced repetition quiz</p>
                    <h1 className="text-2xl font-bold text-gray-900">{deck.title}</h1>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span>Question {questionCount + 1}</span>
                        <span>Correct: {correctCount}</span>
                    </div>
                </header>

                <section className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Front</p>
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
                                        Correct answer:{' '}
                                        <span className="font-medium">{currentCard.back_text}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={handleFinishNow}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Finish session
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50"
                            disabled={!feedback}
                        >
                            Next card
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}


