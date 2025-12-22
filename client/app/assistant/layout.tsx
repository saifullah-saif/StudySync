"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/header";

const assistantNavigation = [
  { name: "Dashboard", href: "/assistant" },
  { name: "Create Flashcards", href: "/assistant/create-flashcards" },
  { name: "My Files", href: "/assistant/files" },
  { name: "Podcasts", href: "/assistant/podcasts" },
];

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full lg:w-[800px]">
            {assistantNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                  pathname === item.href ||
                  (item.href === "/assistant" &&
                    pathname === "/assistant" &&
                    !item.href.includes("?"))
                    ? "bg-[#8100db] text-foreground shadow"
                    : "hover:bg-muted/50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <main>{children}</main>
    </>
  );
}
