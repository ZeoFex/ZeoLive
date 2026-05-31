import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface RecommenderLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function RecommenderLayout({
  children,
  title,
  subtitle,
}: RecommenderLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            ZoeLive
          </Link>
          <span className="text-xs text-muted-foreground">Faculty recommendation</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}
