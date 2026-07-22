"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { AdminPagination } from "@/components/shared/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PasswordInput } from "@/components/shared/password-input";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  adminTier: string | null;
  status: string;
  joinedAt: string;
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q != null) {
      setSearch(q);
      setPage(0);
    }
  }, [searchParams]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<"STUDENT" | "TUTOR" | "ADMIN">("STUDENT");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        role: roleFilter === "subadmin" ? "admin" : roleFilter,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (roleFilter === "subadmin") {
        params.set("adminTier", "subadmin");
      }
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setUsers(json.users ?? []);
      setTotalPages(Math.max(1, json.totalPages ?? 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: newRole,
          ...(newRole === "ADMIN" ? { adminTier: "SUBADMIN" } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create user");
      toast.success(
        newRole === "ADMIN" ? "Sub-admin created" : "User created"
      );
      setCreateOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setNewRole("STUDENT");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (user.role === "superadmin") {
      toast.error("Super admin accounts cannot be deleted");
      return;
    }
    if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not delete");
      toast.success("User deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const roleBadge = (role: string) => {
    if (role === "superadmin") return "Super Admin";
    if (role === "subadmin") return "Sub Admin";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      <AdminPageHeader
        title="User manager"
        description="Create sub-admins, students, and tutors — and manage platform accounts."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="admin-gradient-btn rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Create user
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
              </DialogHeader>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>First name</Label>
                    <Input
                      className="admin-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      className="admin-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    className="admin-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <PasswordInput
                    className="admin-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(v) =>
                      setNewRole(v as "STUDENT" | "TUTOR" | "ADMIN")
                    }
                  >
                    <SelectTrigger className="admin-input mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TUTOR">Tutor</SelectItem>
                      <SelectItem value="ADMIN">Sub-admin (tutor review only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="admin-gradient-btn w-full rounded-xl" disabled={creating}>
                  {creating ? "Creating…" : "Create user"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="admin-filter-bar">
        <Input
          placeholder="Search users..."
          className="admin-search max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="admin-filter-select">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="tutor">Tutors</SelectItem>
            <SelectItem value="subadmin">Sub-admins</SelectItem>
            <SelectItem value="admin">All admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="admin-empty">No users found.</div>
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-slate-50">
                  <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <span className="admin-tag admin-tag-violet">{roleBadge(u.role)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "active"
                          ? "success"
                          : u.status === "pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.joinedAt)}</TableCell>
                  <TableCell>
                    {u.role !== "superadmin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg"
                        disabled={deletingId === u.id}
                        onClick={() => deleteUser(u)}
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && users.length > 0 && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
