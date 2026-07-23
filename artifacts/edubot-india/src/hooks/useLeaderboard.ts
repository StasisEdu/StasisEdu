import { useState, useCallback } from "react";

interface SubmitScoreParams {
  displayName: string;
  score: number;
  questionsAnswered?: number;
  correctAnswers?: number;
  subject?: string;
  avatarUrl?: string;
  /** Clerk userId — if undefined, a persistent guest ID is used */
  clerkUserId?: string;
}

interface SubmitResult {
  success: boolean;
  rank?: number;
  error?: string;
}

/** Returns a stable guest ID stored in localStorage */
function getGuestId(): string {
  const key = "stasis_guest_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

export function useLeaderboard() {
  const [submitting, setSubmitting] = useState(false);
  const [lastRank, setLastRank] = useState<number | null>(null);

  const submitScore = useCallback(
    async ({
      displayName,
      score,
      questionsAnswered,
      correctAnswers,
      subject,
      avatarUrl,
      clerkUserId,
    }: SubmitScoreParams): Promise<SubmitResult> => {
      setSubmitting(true);
      try {
        const guestId = clerkUserId ? undefined : getGuestId();
        const res = await fetch("/api/leaderboard/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // sends Clerk session cookie
          body: JSON.stringify({
            displayName,
            score,
            questionsAnswered,
            correctAnswers,
            subject,
            avatarUrl,
            guestId,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setLastRank(data.rank);
          return { success: true, rank: data.rank };
        }
        return { success: false, error: data.error };
      } catch (err) {
        return { success: false, error: "Network error" };
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  /** The stable guest ID for the current browser — use as currentUserId for <Leaderboard /> */
  const guestId = typeof window !== "undefined" ? getGuestId() : undefined;

  return { submitScore, submitting, lastRank, guestId };
}
