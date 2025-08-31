// Small streak display with countdown timer
import { THEME } from "@/styles/theme";
import { Flame, Clock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getStreakStats,
  getStreakStatsFromDB,
  getTimeUntilMidnight,
} from "@/lib/learning";

function convertMilliseconds(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function StreakCard() {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const loadStreakData = async () => {
    try {
      // Try to load from database first
      const stats = await getStreakStatsFromDB();
      const timeData = getTimeUntilMidnight();

      setStreakData(stats);
      setTimeLeft(timeData.ms);
    } catch (error) {
      console.warn(
        "Failed to load streak from database, using localStorage:",
        error
      );

      // Fallback to localStorage
      const stats = getStreakStats();
      const timeData = getTimeUntilMidnight();

      setStreakData(stats);
      setTimeLeft(timeData.ms);
    }
  };

  useEffect(() => {
    loadStreakData();

    // Update every second
    const timer = setInterval(() => {
      const timeData = getTimeUntilMidnight();
      setTimeLeft(timeData.ms);
    }, 1000);

    // Refresh streak data every minute
    const streakTimer = setInterval(loadStreakData, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(streakTimer);
    };
  }, []);

  return (
    <div
      className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Flame
          className={`h-5 w-5 ${
            streakData.currentStreak > 0 ? "text-orange-500" : "text-gray-300"
          }`}
        />
        <h2 className={`text-lg font-semibold ${THEME.text}`}>Study Streak</h2>
      </div>

      {/* Current Streak */}
      <div className="text-center mb-4">
        <p className={`text-3xl font-bold ${THEME.text}`} aria-live="polite">
          {streakData.currentStreak}
        </p>
        <p className={`text-sm ${THEME.subtext}`}>
          {streakData.currentStreak === 1 ? "day" : "days"} in a row
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className={`text-sm font-mono ${THEME.text}`}>
            {convertMilliseconds(timeLeft)}
          </span>
        </div>
        <p className={`text-xs ${THEME.subtext} text-center mt-1`}>
          to maintain streak
        </p>
      </div>

      {/* Longest Streak */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className={`text-sm ${THEME.text}`}>Best</span>
        </div>
        <span className={`text-sm font-semibold ${THEME.text}`}>
          {streakData.longestStreak}{" "}
          {streakData.longestStreak === 1 ? "day" : "days"}
        </span>
      </div>
    </div>
  );
}
