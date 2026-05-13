import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import { useEffect, useState } from "react";
import type { IssueType, Priority } from "@/lib/types";
import { toast } from "sonner";

export function CreateIssueModal({ open, payload }: { open: boolean; payload?: Partial<{ type: IssueType; title: string }> }) {
  const { closeModal, addIssue, users, sprint, tasks } = useApp();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IssueType>("Bug");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [assignee, setAssignee] = useState("");
  const [related, setRelated] = useState("");
  const [due, setDue] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(payload?.title || ""); setType(payload?.type || "Bug");
      setDescription(""); setPriority("Medium"); setAssignee(""); setRelated("");
      setDue(""); setBlocking(false); setNote("");
    }
  }, [open, payload]);

  const submit = () => {
    if (!title.trim()) return toast.error("Title is required");
    addIssue({
      title, type, description, priority, sprint: sprint.name,
      assigneeId: assignee || undefined, relatedTaskId: related || undefined,
      dueDate: due || undefined, blocking,
      notes: note ? [note] : [],
    });
    toast.success("Issue created");
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create issue / report</DialogTitle>
          <DialogDescription>Log a bug, blocker, or process issue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="mb-1.5 block">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as IssueType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Bug", "Blocker", "Task", "Report", "Process Issue"] as IssueType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="mb-1.5 block">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Low", "Medium", "High", "Critical"] as Priority[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="mb-1.5 block">Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{users.filter((u) => !u.isAgent).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="mb-1.5 block">Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          </div>
          <div><Label className="mb-1.5 block">Related task</Label>
            <Select value={related} onValueChange={setRelated}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <Label>Is this blocking your work?</Label><Switch checked={blocking} onCheckedChange={setBlocking} />
          </div>
          <div><Label className="mb-1.5 block">Attach note</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button onClick={submit} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Create Issue / Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
