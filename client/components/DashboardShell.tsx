// Dashboard page shell with header and responsive 2-column grid layout
import { THEME } from "@/styles/theme";
import type { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardShell({
  children,
  title = "Assistant Dashboard",
  subtitle = "Your study progress at a glance",
}: DashboardShellProps) {
  return (
    <div className={`min-h-screen ${THEME.mutedBg}`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className={`text-3xl font-bold ${THEME.text}`}>{title}</h1>
          <p className={`mt-2 ${THEME.subtext}`}>{subtitle}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div
          className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 ${THEME.gap}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
