import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AttachType = "Task" | "Issue" | "Blocker" | "Meeting" | "Sprint" | "AI Log";

export function AddNoteModal({ open, payload }: { open: boolean; payload?: { attachType?: AttachType; attachId?: string } }) {
  const { closeModal, addNote, tasks, issues, meetings, aiLogs, sprint } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachType, setAttachType] = useState<AttachType>("Task");
  const [attachId, setAttachId] = useState("");
  const [visibility, setVisibility] = useState<"Private" | "Team-visible">("Team-visible");

  useEffect(() => {
    if (open) {
      setTitle(""); setBody("");
      setAttachType(payload?.attachType || "Task");
      setAttachId(payload?.attachId || "");
      setVisibility("Team-visible");
    }
  }, [open, payload]);

  const options = (() => {
    switch (attachType) {
      case "Task": return tasks.map((t) => ({ id: t.id, label: t.title }));
      case "Issue":
      case "Blocker": return issues.map((i) => ({ id: i.id, label: i.title }));
      case "Meeting": return meetings.map((m) => ({ id: m.id, label: m.title }));
      case "AI Log": return aiLogs.map((l) => ({ id: l.id, label: l.type }));
      case "Sprint": return [{ id: sprint.name, label: sprint.name }];
    }
  })();

  const submit = () => {
    if (!title.trim() || !attachId) return toast.error("Title and target are required");
    addNote({ title, body, attachTo: { type: attachType, id: attachId }, visibility });
    toast.success("Note added");
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add note</DialogTitle>
          <DialogDescription>Attach context to a task, issue, or meeting.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="mb-1.5 block">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Body</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block">Attach to</Label>
              <Select value={attachType} onValueChange={(v) => { setAttachType(v as AttachType); setAttachId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Task", "Issue", "Blocker", "Meeting", "Sprint", "AI Log"] as AttachType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="mb-1.5 block">Target</Label>
              <Select value={attachId} onValueChange={setAttachId}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="mb-1.5 block">Visibility</Label>
            <div className="flex gap-2">
              {(["Private", "Team-visible"] as const).map((v) => (
                <button key={v} onClick={() => setVisibility(v)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${visibility === v ? "border-primary bg-primary/10 font-medium" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button onClick={submit} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
