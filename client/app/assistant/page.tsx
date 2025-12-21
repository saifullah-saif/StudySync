"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { practiceAPI } from "@/lib/api";

// Dashboard components
import { DashboardShell } from "@/components/DashboardShell";
import { KpiRow } from "@/components/KpiRow";
import { StudyQuickStart } from "@/components/StudyQuickStart";
import { RecentFilesList } from "@/components/RecentFilesList";
import { StreakCard } from "@/components/StreakCard";
import StreakHistory from "@/components/StreakHistory";

export default function AssistantPage() {
  const { user } = useAuth();
  const [recentDecks, setRecentDecks] = useState<any[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);

  // Load recent decks
  const loadRecentDecks = async () => {
    if (!user) return;

    try {
      setDecksLoading(true);
      const result = await practiceAPI.getUserDecks(1, 6);
      if (result.success) {
        setRecentDecks(result.data.decks);
      }
    } catch (error) {
      console.error("Failed to load recent decks:", error);
    } finally {
      setDecksLoading(false);
    }
  };

  // Load recent decks when user is available
  useEffect(() => {
    if (user) {
      loadRecentDecks();
    }
  }, [user]);

  return (
    <div className="bg-slate-50">
      {/* Dashboard Content */}
      <DashboardShell>
        {/* KPI Row - Full Width */}
        <KpiRow />

        {/* Left Main Area */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <StudyQuickStart />
          <RecentFilesList />
        </div>

        {/* Right Rail */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <StreakCard />
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Practice History
            </h3>
            <StreakHistory />
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
