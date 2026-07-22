"use client";

import {
  Bell,
  ChevronDown,
  Loader2,
  LogOut,
  Search,
  User,
  UserCheck,
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
  getReadNotificationIds,
  markNotificationRead,
  markNotificationsRead,
  pruneStaleReadIds,
} from "@/lib/admin-notifications-storage";
import { routes } from "@/lib/routes";
import { cn, formatDate } from "@/lib/utils";

interface AdminTopbarProps {
  title: string;
}

interface SearchResult {
  id: string;
  type: "user" | "tutor_application";
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

export function AdminTopbar({ title }: AdminTopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "Admin";
  const displayImage = session?.user?.image ?? undefined;

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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
    pruneStaleReadIds(items.map((item) => item.id));
    const freshRead = getReadNotificationIds();
    setUnreadCount(items.filter((item) => !freshRead.has(item.id)).length);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
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
          `/api/admin/search?q=${encodeURIComponent(query.trim())}`
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

  const openNotifications = () => {
    setNotificationsOpen((open) => !open);
    setUserMenuOpen(false);
    setSearchOpen(false);
    if (!notificationsOpen) {
      loadNotifications();
    }
  };

  const markAllRead = () => {
    markNotificationsRead(notifications.map((n) => n.id));
    setUnreadCount(0);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    setUnreadCount((count) => Math.max(0, count - 1));
    setNotificationsOpen(false);
    router.push(item.href);
  };

  const handleSearchSelect = (result: SearchResult) => {
    setQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    router.push(result.href);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
      return;
    }
    if (query.trim().length >= 2 && session?.user?.adminTier === "SUPERADMIN") {
      router.push(`/admin/users?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-8">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h1>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <div ref={searchRef} className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
          <form onSubmit={handleSearchSubmit}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
            <Input
              placeholder="Search users or tutors..."
              className="admin-search w-full"
              aria-label="Search admin panel"
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

          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {searchLoading && searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">No results found</p>
              ) : (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        onClick={() => handleSearchSelect(result)}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-blue-600">
                          {result.type === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            {result.title}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {result.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="admin-outline-btn relative h-10 w-10 rounded-xl"
            aria-label="Notifications"
            onClick={openNotifications}
          >
            <Bell className="h-4 w-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600 hover:underline"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notificationsLoading && notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading…
                </p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  No notifications right now
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((item) => {
                    const isUnread = !getReadNotificationIds().has(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                            isUnread && "bg-sky-50/40"
                          )}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <span className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </span>
                          <span className="text-xs leading-relaxed text-slate-600">
                            {item.message}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="border-t border-slate-100 px-4 py-2">
                <Link
                  href={`${routes.admin.verification}?status=pending`}
                  className="block py-2 text-center text-xs font-medium text-blue-600 hover:underline"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all verification
                </Link>
              </div>
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-50"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setNotificationsOpen(false);
              setSearchOpen(false);
            }}
          >
            <Avatar className="h-8 w-8">
              {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
              <AvatarFallback className="bg-sky-100 text-xs font-semibold text-blue-700">
                {displayName[0]?.toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 sm:inline">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => void signOutToAppPath(routes.adminLogin)}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
