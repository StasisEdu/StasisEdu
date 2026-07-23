import { useState, useEffect, useCallback } from "react";

interface LeaderboardEntry {
  id: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  subject?: string;
  updatedAt: string;
}

interface LeaderboardProps {
  /** Current user's ID (Clerk userId or guestId) */
  currentUserId?: string;
  /** Poll interval in ms — default 15 seconds */
  pollInterval?: number;
  /** Optional subject filter */
  subject?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-pink-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow`}
    >
      {initials}
    </div>
  );
}

export function Leaderboard({
  currentUserId,
  pollInterval = 15000,
  subject,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const params = subject ? `?subject=${encodeURIComponent(subject)}` : "";
      const res = await fetch(`/api/leaderboard${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch {
      setError("Could not load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [subject]);

  // Initial fetch + polling
  useEffect(() => {
    fetchLeaderboard();
    if (!isLive) return;
    const interval = setInterval(fetchLeaderboard, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, pollInterval, isLive]);

  const currentUserRank =
    entries.findIndex((e) => e.userId === currentUserId) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading leaderboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="text-lg">⚠️ {error}</p>
        <button
          onClick={fetchLeaderboard}
          className="mt-3 text-sm text-purple-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">🏆 Leaderboard</h2>
          {subject && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {subject}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isLive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            />
            {isLive ? "Live" : "Paused"}
          </button>
          <button
            onClick={fetchLeaderboard}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh now"
          >
            ↻
          </button>
        </div>
      </div>

      {/* User's own rank callout */}
      {currentUserId && currentUserRank > 0 && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 font-medium">
          Your rank: #{currentUserRank} out of {entries.length} players
        </div>
      )}

      {/* Table */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>No scores yet — be the first!</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-12">
                  #
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                  Player
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">
                  Score
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const isCurrentUser = entry.userId === currentUserId;
                const accuracy =
                  entry.questionsAnswered > 0
                    ? Math.round(
                        (entry.correctAnswers / entry.questionsAnswered) * 100,
                      )
                    : 0;

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-gray-100 last:border-0 transition-colors ${
                      isCurrentUser
                        ? "bg-purple-50 hover:bg-purple-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-gray-600">
                      {index < 3 ? (
                        <span className="text-lg">{MEDAL[index]}</span>
                      ) : (
                        <span className="text-gray-400">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={entry.displayName}
                          url={entry.avatarUrl}
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isCurrentUser
                                ? "text-purple-700"
                                : "text-gray-800"
                            }`}
                          >
                            {entry.displayName}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs font-normal text-purple-500">
                                (you)
                              </span>
                            )}
                          </p>
                          {entry.subject && (
                            <p className="text-xs text-gray-400">
                              {entry.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-medium text-gray-700">
                          {accuracy}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {entry.correctAnswers}/{entry.questionsAnswered}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {lastUpdated && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Updated {lastUpdated.toLocaleTimeString()}
          {isLive && ` · refreshes every ${pollInterval / 1000}s`}
        </p>
      )}
    </div>
  );
}

export default Leaderboard;
