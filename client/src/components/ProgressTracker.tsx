import { useEffect, useState } from "react";

interface StudyStats {
  range: string;
  accuracy: number;
  streak: number;
  progress: { date: string; correct: number; incorrect: number }[];
}

export default function ProgressTracker() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "all">("7d");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/stats?range=${range}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Unable to fetch progress data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-600">
        Loading progress...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-100 text-gray-700 p-4 rounded-md text-center">
        No stats available yet.
      </div>
    );
  }

  // compute total cards reviewed
  const totalReviewed = stats.progress.reduce(
    (sum, d) => sum + (Number(d.correct) + Number(d.incorrect)),
    0
  );

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Study Progress Tracker
      </h2>

      {/* Range Selector */}
      <div className="flex justify-center mb-6">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "7d" | "30d" | "all")}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Accuracy */}
      <div className="mb-6">
        <p className="text-gray-700 mb-1 font-medium">
          Accuracy: <span className="font-semibold">{stats.accuracy}%</span>
        </p>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${stats.accuracy}%` }}
          ></div>
        </div>
      </div>

      {/* Streak */}
      <div className="text-center mb-4">
        <p className="text-lg text-gray-700">
          Current Streak:{" "}
          <span className="font-semibold text-indigo-600">{stats.streak}</span>{" "}
          {stats.streak === 1 ? "day" : "days"}
        </p>
      </div>
      {/* Total reviewed summary */}
      <p className="text-sm text-gray-600 text-center">
        Total reviewed this period:{" "}
        <span className="font-semibold text-gray-800">{totalReviewed}</span>{" "}
        cards
      </p>

      {/* ✅❌ per-day breakdown */}
      <div className="mt-4 border-t pt-3 space-y-1 text-xs text-gray-600">
        {stats.progress.length > 0 ? (
          stats.progress.map((p) => {
            const correct = Number(p.correct);
            const incorrect = Number(p.incorrect);
            return (
              <div key={p.date} className="flex justify-between">
                <span>{new Date(p.date).toLocaleDateString()}</span>
                <span>
                  ✅ {correct} &nbsp;/&nbsp; ❌ {incorrect}{" "}
                  <span className="text-gray-400">
                    ({correct + incorrect} total)
                  </span>
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No review data yet.</p>
        )}
      </div>
    </div>
  );
}