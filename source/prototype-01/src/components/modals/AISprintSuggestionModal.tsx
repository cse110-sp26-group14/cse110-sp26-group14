import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import { useState } from "react";
import { Wand2, Sparkles } from "lucide-react";
import { Badge } from "@/components/StatusBadge";
import { toast } from "sonner";

interface Suggestion {
  id: string; title: string; description: string; priority: "Low"|"Medium"|"High"|"Critical";
  ownerId: string; dueDate: string; calendar: string; confidence: number; selected: boolean;
}

export function AISprintSuggestionModal({ open }: { open: boolean }) {
  const { closeModal, users, sprint, addTask, addAILog } = useApp();
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState("1 week");
  const [constraints, setConstraints] = useState("");
  const [capacity, setCapacity] = useState("4 engineers, 32h each");
  const [priority, setPriority] = useState("High");
  const [results, setResults] = useState<Suggestion[]>([]);

  const generate = () => {
    if (!goal.trim()) return toast.error("Project goal required");
    const humans = users.filter((u) => !u.isAgent);
    setResults([
      { id: "s1", title: `Scaffold ${goal} core flow`, description: "Initial structure and routing.", priority: "High", ownerId: humans[1].id, dueDate: "2026-05-16", calendar: "Sprint 2 · Day 4", confidence: 0.92, selected: true },
      { id: "s2", title: `Wire backend endpoints for ${goal}`, description: "REST + auth.", priority: "High", ownerId: humans[2].id, dueDate: "2026-05-17", calendar: "Sprint 2 · Day 5", confidence: 0.88, selected: true },
      { id: "s3", title: `Test plan for ${goal}`, description: "Coverage matrix + E2E.", priority: "Medium", ownerId: humans[3].id, dueDate: "2026-05-18", calendar: "Sprint 2 · Day 6", confidence: 0.81, selected: false },
      { id: "s4", title: `Docs draft for ${goal}`, description: "First-run + reference.", priority: "Low", ownerId: humans[4].id, dueDate: "2026-05-19", calendar: "Sprint 2 · Day 7", confidence: 0.74, selected: false },
    ]);
  };

  const apply = (mode: "backlog" | "calendar") => {
    const chosen = results.filter((r) => r.selected);
    chosen.forEach((s) => addTask({
      title: s.title, description: s.description, priority: s.priority,
      ownerId: s.ownerId, dueDate: s.dueDate, sprint: sprint.name,
      status: mode === "calendar" ? "In Sprint" : "Backlog", aiSuggested: true,
    }));
    addAILog({
      type: "AI Sprint Tasks Suggested", inputSource: `Goal: ${goal}`,
      outputSummary: `${chosen.length} tasks added to ${mode}.`, approval: "Applied",
      reviewer: "You", linkedTaskIds: [],
    });
    toast.success(`${chosen.length} tasks added to ${mode}`);
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="size-4 text-primary" /> AI sprint task suggestion</DialogTitle>
          <DialogDescription>Admin only. Suggestions require approval before applying.</DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-3 py-2">
            <div><Label className="mb-1.5 block">Project goal</Label><Textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Ship onboarding v2" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1.5 block">Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
              <div><Label className="mb-1.5 block">Sprint duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            </div>
            <div><Label className="mb-1.5 block">Known constraints</Label><Textarea rows={2} value={constraints} onChange={(e) => setConstraints(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1.5 block">Team capacity</Label><Input value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
              <div><Label className="mb-1.5 block">Priority level</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low", "Medium", "High", "Critical"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button onClick={generate} className="text-primary-foreground gap-1.5" style={{ background: "var(--gradient-brand)" }}><Sparkles className="size-3.5" /> Generate Suggestions</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
              {results.map((s) => {
                const u = users.find((x) => x.id === s.ownerId);
                return (
                  <label key={s.id} className={`block rounded-lg border p-3 cursor-pointer ${s.selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={s.selected} onChange={(e) => setResults(results.map((r) => r.id === s.id ? { ...r, selected: e.target.checked } : r))} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{s.title}</span>
                          <Badge tag={s.priority} />
                          <span className="text-[11px] font-mono text-muted-foreground">conf {(s.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-3">
                          <span>Owner: <span className="text-foreground">{u?.name}</span></span>
                          <span>Due: <span className="font-mono">{s.dueDate}</span></span>
                          <span>Slot: {s.calendar}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setResults([])}>Edit Suggestions</Button>
              <Button variant="outline" onClick={() => apply("backlog")}>Add Selected to Backlog</Button>
              <Button onClick={() => apply("calendar")} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Add to Sprint Calendar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
