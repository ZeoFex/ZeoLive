"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <DashboardHeader
        title="User Management"
        subtitle="Super admin: create sub-admins, students, tutors — and delete accounts"
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search users..."
            className="max-w-xs"
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
            <SelectTrigger className="w-[160px]">
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

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
              </DialogHeader>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>First name</Label>
                    <Input
                      className="mt-1.5"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      className="mt-1.5"
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
                    className="mt-1.5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <PasswordInput
                    className="mt-1.5"
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
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TUTOR">Tutor</SelectItem>
                      <SelectItem value="ADMIN">Sub-admin (tutor review only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? "Creating…" : "Create user"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleBadge(u.role)}</Badge>
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
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
