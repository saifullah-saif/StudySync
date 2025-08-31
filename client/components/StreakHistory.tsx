import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Trophy, Clock } from "lucide-react";
import {
  getStreakData,
  getStreakStats,
  getStreakStatsFromDB,
} from "@/lib/learning";

interface StreakHistoryProps {
  className?: string;
}

export default function StreakHistory({ className = "" }: StreakHistoryProps) {
  const [streakData, setStreakData] = useState({
    streakHistory: [] as string[],
    currentStreak: 0,
    longestStreak: 0,
  });
  const [calendarView, setCalendarView] = useState<Date>(new Date());

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      // Try to load from database first
      const stats = await getStreakStatsFromDB();
      const data = getStreakData(); // Still need localStorage for history array
      setStreakData({
        streakHistory: data.streakHistory,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      });
    } catch (error) {
      console.warn(
        "Failed to load streak from database, using localStorage:",
        error
      );

      // Fallback to localStorage
      const data = getStreakData();
      const stats = getStreakStats();
      setStreakData({
        streakHistory: data.streakHistory,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const isPracticeDay = streakData.streakHistory.includes(dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];

      days.push({
        day,
        dateStr,
        isPracticeDay,
        isToday,
      });
    }

    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCalendarView((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(calendarView);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Streak Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Current</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-gray-500">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Best</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {streakData.longestStreak}
            </div>
            <div className="text-sm text-gray-500">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {streakData.streakHistory.length}
            </div>
            <div className="text-sm text-gray-500">days</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Practice History
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <span className="font-medium min-w-[150px] text-center">
                {formatMonth(calendarView)}
              </span>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={
                  calendarView.getMonth() >= new Date().getMonth() &&
                  calendarView.getFullYear() >= new Date().getFullYear()
                }
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => (
              <div key={index} className="aspect-square p-1">
                {day ? (
                  <div
                    className={`
                    w-full h-full rounded-lg flex items-center justify-center text-sm relative
                    ${
                      day.isPracticeDay
                        ? "bg-green-100 text-green-800 font-medium"
                        : "bg-gray-50 text-gray-600"
                    }
                    ${day.isToday ? "ring-2 ring-blue-500" : ""}
                  `}
                  >
                    {day.day}
                    {day.isPracticeDay && (
                      <div className="absolute -top-1 -right-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded border"></div>
              <span>Practice Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 rounded border"></div>
              <span>No Practice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 rounded border-2 border-blue-500"></div>
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
