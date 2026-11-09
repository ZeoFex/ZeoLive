"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminSubject {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
}

interface AdminProgramme {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
  subjectCount: number;
  tutorCount: number;
  subjects: AdminSubject[];
}

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<AdminProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [programmeName, setProgrammeName] = useState("");
  const [initialSubjects, setInitialSubjects] = useState("");

  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [deletingProgrammeId, setDeletingProgrammeId] = useState<string | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/programmes");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      const next = (json.programmes ?? []) as AdminProgramme[];
      setProgrammes(next);
      setSelectedId((current) => {
        if (current && next.some((programme) => programme.id === current)) {
          return current;
        }
        return next[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load programmes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = programmes.find((programme) => programme.id === selectedId) ?? null;

  const createProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const subjects = initialSubjects
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: programmeName, subjects }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create");
      toast.success("Programme created");
      setCreateOpen(false);
      setProgrammeName("");
      setInitialSubjects("");
      setSelectedId(json.programme?.id ?? null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create programme");
    } finally {
      setCreating(false);
    }
  };

  const toggleProgrammeActive = async (programme: AdminProgramme) => {
    try {
      const res = await fetch(`/api/admin/programmes/${programme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !programme.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not update");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update programme");
    }
  };

  const deleteProgramme = async (programme: AdminProgramme) => {
    if (
      !window.confirm(
        `Delete “${programme.name}”? Subjects tied to it will be removed too.`
      )
    ) {
      return;
    }
    setDeletingProgrammeId(programme.id);
    try {
      const res = await fetch(`/api/admin/programmes/${programme.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not delete");
      toast.success("Programme deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete programme");
    } finally {
      setDeletingProgrammeId(null);
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setAddingSubject(true);
    try {
      const res = await fetch(`/api/admin/programmes/${selected.id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add subject");
      toast.success("Subject added");
      setSubjectName("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add subject");
    } finally {
      setAddingSubject(false);
    }
  };

  const toggleSubjectActive = async (subject: AdminSubject) => {
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !subject.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not update");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update subject");
    }
  };

  const deleteSubject = async (subject: AdminSubject) => {
    if (!window.confirm(`Delete subject “${subject.name}”?`)) return;
    setDeletingSubjectId(subject.id);
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not delete");
      toast.success("Subject deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete subject");
    } finally {
      setDeletingSubjectId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Programmes & subjects"
        description="Manage tertiary programmes and the subjects tutors can teach from each one."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="admin-gradient-btn rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                New programme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create programme</DialogTitle>
              </DialogHeader>
              <form onSubmit={createProgramme} className="space-y-4">
                <div>
                  <Label htmlFor="programme-name">Programme name</Label>
                  <Input
                    id="programme-name"
                    className="mt-1.5"
                    value={programmeName}
                    onChange={(e) => setProgrammeName(e.target.value)}
                    placeholder="e.g. BSc Mathematics"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="initial-subjects">Subjects (optional)</Label>
                  <Input
                    id="initial-subjects"
                    className="mt-1.5"
                    value={initialSubjects}
                    onChange={(e) => setInitialSubjects(e.target.value)}
                    placeholder="Comma-separated, e.g. Mathematics, Calculus"
                  />
                </div>
                <Button
                  type="submit"
                  className="admin-gradient-btn w-full rounded-xl"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create programme"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programme</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Tutors</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-500">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : programmes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-500">
                    No programmes yet.
                  </TableCell>
                </TableRow>
              ) : (
                programmes.map((programme) => (
                  <TableRow
                    key={programme.id}
                    className={
                      selectedId === programme.id
                        ? "bg-sky-50/70"
                        : "cursor-pointer"
                    }
                    onClick={() => setSelectedId(programme.id)}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {programme.name}
                    </TableCell>
                    <TableCell>{programme.subjectCount}</TableCell>
                    <TableCell>{programme.tutorCount}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={programme.active}
                        onCheckedChange={() => toggleProgrammeActive(programme)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingProgrammeId === programme.id}
                        onClick={() => deleteProgramme(programme)}
                        aria-label={`Delete ${programme.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="admin-card p-5">
          {selected ? (
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {selected.name}
                  </h3>
                  <Badge variant={selected.active ? "default" : "secondary"}>
                    {selected.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Subjects tied to this programme appear in tutor signup.
                </p>
              </div>

              <form onSubmit={addSubject} className="flex gap-2">
                <Input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Add a subject"
                  required
                />
                <Button
                  type="submit"
                  className="admin-gradient-btn shrink-0 rounded-xl"
                  disabled={addingSubject}
                >
                  {addingSubject ? "Adding…" : "Add"}
                </Button>
              </form>

              <div className="space-y-2">
                {selected.subjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No subjects yet.</p>
                ) : (
                  selected.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {subject.name}
                        </p>
                        <p className="text-xs text-slate-400">{subject.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subject.active}
                          onCheckedChange={() => toggleSubjectActive(subject)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingSubjectId === subject.id}
                          onClick={() => deleteSubject(subject)}
                          aria-label={`Delete ${subject.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a programme to manage its subjects.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
