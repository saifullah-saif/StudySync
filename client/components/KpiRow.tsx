// Four consistent KPI cards displaying key study metrics
import { THEME } from "@/styles/theme";
import { Flame, Target, TrendingUp, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getStreakStats,
  getTodayStats,
  getUserStats,
  calcLevelFromXP,
} from "@/lib/learning";

export function KpiRow() {
  const [streakStats, setStreakStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [todayStats, setTodayStats] = useState({
    cardsToday: 0,
    accuracyToday: 0,
  });
  const [userStats, setUserStats] = useState({ level: 1, xp: 0 });

  const loadStats = () => {
    const streak = getStreakStats();
    const today = getTodayStats();
    const user = getUserStats();

    setStreakStats(streak);
    setTodayStats(today);
    setUserStats(user);
  };

  useEffect(() => {
    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate level progress
  const currentLevelXP =
    userStats.level > 1 ? Math.pow(userStats.level - 1, 2) * 100 : 0;
  const nextLevelXP = Math.pow(userStats.level, 2) * 100;
  const progressXP = userStats.xp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPercentage = neededXP > 0 ? (progressXP / neededXP) * 100 : 0;

  return (
    <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Streak */}
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={THEME.subtext}>Current Streak</p>
            <p
              className={`text-2xl font-bold ${THEME.text}`}
              aria-live="polite"
            >
              {streakStats.currentStreak}
            </p>
          </div>
          <Flame
            className={`h-8 w-8 ${
              streakStats.currentStreak > 0
                ? "text-orange-500"
                : "text-gray-300"
            }`}
          />
        </div>
        <div className="mt-2 flex items-center space-x-1">
          <div className="h-1 w-full bg-slate-200 rounded">
            <div
              className="h-1 bg-orange-500 rounded"
              style={{
                width: `${Math.min(
                  100,
                  (streakStats.currentStreak /
                    Math.max(streakStats.longestStreak, 7)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Cards Today */}
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={THEME.subtext}>Cards Today</p>
            <p
              className={`text-2xl font-bold ${THEME.text}`}
              aria-live="polite"
            >
              {todayStats.cardsToday}
            </p>
          </div>
          <Target className="h-8 w-8 text-blue-500" />
        </div>
        <div className="mt-2 flex items-center space-x-1">
          <div className="h-1 w-full bg-slate-200 rounded">
            <div
              className="h-1 bg-blue-500 rounded"
              style={{
                width: `${Math.min(100, (todayStats.cardsToday / 50) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Accuracy */}
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={THEME.subtext}>Accuracy Today</p>
            <p
              className={`text-2xl font-bold ${THEME.text}`}
              aria-live="polite"
            >
              {todayStats.accuracyToday}%
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
        <div className="mt-2 flex items-center space-x-1">
          <div className="h-1 w-full bg-slate-200 rounded">
            <div
              className="h-1 bg-green-500 rounded"
              style={{ width: `${todayStats.accuracyToday}%` }}
            />
          </div>
        </div>
      </div>

      {/* Level */}
      <div
        className={`${THEME.cardBg} ${THEME.cardPadding} ${THEME.cardRadius} shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={THEME.subtext}>Level</p>
            <p
              className={`text-2xl font-bold ${THEME.text}`}
              aria-live="polite"
            >
              {userStats.level}
            </p>
          </div>
          <Trophy className="h-8 w-8 text-purple-500" />
        </div>
        <div className="mt-2 flex items-center space-x-1">
          <div className="h-1 w-full bg-slate-200 rounded">
            <div
              className="h-1 bg-purple-500 rounded"
              style={{
                width: `${Math.max(0, Math.min(100, progressPercentage))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
