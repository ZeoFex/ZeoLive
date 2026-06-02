"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  Loader2,
  LogOut,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutToAppPath } from "@/lib/auth-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getReadStudentNotificationIds,
  markStudentNotificationRead,
  markStudentNotificationsRead,
  pruneStaleStudentReadIds,
} from "@/lib/student-notifications-storage";
import { routes } from "@/lib/routes";
import { cn, formatDate } from "@/lib/utils";

interface StudentTopbarProps {
  title: string;
}

interface SearchResult {
  id: string;
  type: "tutor" | "session" | "class";
  title: string;
  subtitle: string;
  href: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

export function StudentTopbar({ title }: StudentTopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "Student";
  const displayImage = session?.user?.image ?? undefined;

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const updateUnreadCount = useCallback((items: NotificationItem[]) => {
    pruneStaleStudentReadIds(items.map((item) => item.id));
    const read = getReadStudentNotificationIds();
    setUnreadCount(items.filter((item) => !read.has(item.id)).length);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch("/api/student/notifications");
      const data = await res.json();
      if (!res.ok) return;
      const items = (data.items ?? []) as NotificationItem[];
      setNotifications(items);
      updateUnreadCount(items);
    } finally {
      setNotificationsLoading(false);
    }
  }, [updateUnreadCount]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/student/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data.results ?? []);
          setSearchOpen(true);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    setQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setSearchExpanded(false);
    router.push(result.href);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
    } else if (query.trim().length >= 2) {
      router.push(`${routes.student.tutors}?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
      setSearchExpanded(false);
    }
  };

  const searchIcon = (type: SearchResult["type"]) => {
    if (type === "tutor") return Users;
    if (type === "session") return Calendar;
    return BookOpen;
  };

  const closePanels = () => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  };

  const searchField = (
    <form onSubmit={handleSearchSubmit}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {searchLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
      )}
      <Input
        placeholder="Search tutors, subjects..."
        className="student-search w-full"
        aria-label="Search student portal"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSearchOpen(true);
        }}
        onFocus={() => {
          if (searchResults.length > 0 || query.trim().length >= 2) {
            setSearchOpen(true);
          }
        }}
      />
    </form>
  );

  const searchResultsList =
    searchOpen && query.trim().length >= 2 ? (
      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        {searchLoading && searchResults.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
        ) : searchResults.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No results found</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto py-1">
            {searchResults.map((result) => {
              const Icon = searchIcon(result.type);
              return (
                <li key={result.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {result.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {result.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <header className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-8 sm:py-4">
      {/* Mobile: compact header row */}
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h1 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "student-outline-btn h-9 w-9 rounded-xl",
              searchExpanded && "border-violet-200 bg-violet-50"
            )}
            aria-label={searchExpanded ? "Close search" : "Open search"}
            aria-expanded={searchExpanded}
            onClick={() => {
              setSearchExpanded((open) => !open);
              closePanels();
            }}
          >
            {searchExpanded ? (
              <X className="h-4 w-4 text-slate-600" />
            ) : (
              <Search className="h-4 w-4 text-slate-600" />
            )}
          </Button>

          <div ref={notifRef} className="relative">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="student-outline-btn relative h-9 w-9 rounded-xl"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setUserMenuOpen(false);
                setSearchExpanded(false);
                if (!notificationsOpen) loadNotifications();
              }}
            >
              <Bell className="h-4 w-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </Button>

            {notificationsOpen && (
              <div className="fixed inset-x-4 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[min(calc(100vw-2rem),360px)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs font-medium text-violet-600 hover:underline"
                      onClick={() => {
                        markStudentNotificationsRead(notifications.map((n) => n.id));
                        setUnreadCount(0);
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notificationsLoading && notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications</p>
                ) : (
                  <ul className="max-h-[min(60vh,320px)] overflow-y-auto">
                    {notifications.map((item) => {
                      const isUnread = !getReadStudentNotificationIds().has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50",
                              isUnread && "bg-violet-50/40"
                            )}
                            onClick={() => {
                              markStudentNotificationRead(item.id);
                              setUnreadCount((c) => Math.max(0, c - 1));
                              setNotificationsOpen(false);
                              router.push(item.href);
                            }}
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </span>
                            <span className="text-xs text-slate-600">{item.message}</span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(item.createdAt)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div ref={userRef} className="relative">
            <button
              type="button"
              className="flex items-center rounded-xl border border-slate-200 bg-white p-1 transition-colors hover:bg-slate-50"
              onClick={() => {
                setUserMenuOpen((o) => !o);
                setNotificationsOpen(false);
                setSearchExpanded(false);
              }}
            >
              <Avatar className="h-8 w-8">
                {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
                <AvatarFallback className="bg-violet-100 text-xs font-semibold text-violet-700">
                  {displayName[0]?.toUpperCase() ?? "S"}
                </AvatarFallback>
              </Avatar>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
                </div>
                <Link
                  href={routes.student.settings}
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void signOutToAppPath(routes.login)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchExpanded && (
        <div
          ref={searchRef}
          className="student-topbar-search-panel relative mt-3 lg:hidden"
        >
          {searchField}
          {searchResultsList}
        </div>
      )}

      {/* Desktop: single row with inline search */}
      <div className="hidden items-center justify-between gap-4 lg:flex">
        <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div ref={searchRef} className="relative w-full max-w-md">
            {searchField}
            {searchResultsList}
          </div>

          <div ref={notifRef} className="relative">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="student-outline-btn relative h-10 w-10 rounded-xl"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((o) => !o);
                setUserMenuOpen(false);
                if (!notificationsOpen) loadNotifications();
              }}
            >
              <Bell className="h-4 w-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </Button>

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs font-medium text-violet-600 hover:underline"
                      onClick={() => {
                        markStudentNotificationsRead(notifications.map((n) => n.id));
                        setUnreadCount(0);
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notificationsLoading && notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.map((item) => {
                      const isUnread = !getReadStudentNotificationIds().has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50",
                              isUnread && "bg-violet-50/40"
                            )}
                            onClick={() => {
                              markStudentNotificationRead(item.id);
                              setUnreadCount((c) => Math.max(0, c - 1));
                              setNotificationsOpen(false);
                              router.push(item.href);
                            }}
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </span>
                            <span className="text-xs text-slate-600">{item.message}</span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(item.createdAt)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div ref={userRef} className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-50"
              onClick={() => {
                setUserMenuOpen((o) => !o);
                setNotificationsOpen(false);
              }}
            >
              <Avatar className="h-8 w-8">
                {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
                <AvatarFallback className="bg-violet-100 text-xs font-semibold text-violet-700">
                  {displayName[0]?.toUpperCase() ?? "S"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 xl:inline">
                {displayName}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
                </div>
                <Link
                  href={routes.student.settings}
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void signOutToAppPath(routes.login)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
