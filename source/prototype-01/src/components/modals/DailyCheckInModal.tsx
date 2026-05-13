import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-store";
import { useState, useEffect } from "react";
import type { Mood } from "@/lib/types";
import { toast } from "sonner";

const moods: Mood[] = ["Great", "Good", "Okay", "Stressed", "Burned Out", "Blocked"];

export function DailyCheckInModal({ open }: { open: boolean }) {
  const { closeModal, addCheckIn, todaysCheckIn, addIssue } = useApp();
  const [worked, setWorked] = useState("");
  const [next, setNext] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [blocker, setBlocker] = useState("");
  const [needsHelp, setNeedsHelp] = useState(false);
  const [mood, setMood] = useState<Mood>("Good");
  const [available, setAvailable] = useState(true);
  const [needsCoverage, setNeedsCoverage] = useState(false);
  const [related, setRelated] = useState("");

  useEffect(() => {
    if (open && todaysCheckIn) {
      setWorked(todaysCheckIn.worked); setNext(todaysCheckIn.next);
      setBlocked(todaysCheckIn.blocked); setBlocker(todaysCheckIn.blocker || "");
      setNeedsHelp(todaysCheckIn.needsHelp); setMood(todaysCheckIn.mood);
      setAvailable(todaysCheckIn.available); setNeedsCoverage(todaysCheckIn.needsCoverage);
      setRelated(todaysCheckIn.relatedId || "");
    }
  }, [open, todaysCheckIn]);

  const submit = () => {
    addCheckIn({ worked, next, blocked, blocker, needsHelp, mood, available, needsCoverage, relatedId: related });
    if (blocked && blocker) {
      addIssue({ title: blocker, description: `Auto-created from check-in. ${worked}`, type: "Blocker", priority: "High", blocking: true });
    }
    toast.success("Check-in submitted");
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily check-in</DialogTitle>
          <DialogDescription>Share progress, blockers, and how you're feeling.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label className="mb-1.5 block">What did you work on?</Label><Textarea rows={3} value={worked} onChange={(e) => setWorked(e.target.value)} /></div>
          <div><Label className="mb-1.5 block">What are you working on next?</Label><Textarea rows={2} value={next} onChange={(e) => setNext(e.target.value)} /></div>
          <Row><Label>Are you blocked?</Label><Switch checked={blocked} onCheckedChange={setBlocked} /></Row>
          {blocked && <div><Label className="mb-1.5 block">Describe blocker</Label><Input value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="e.g. Staging environment is down" /></div>}
          <Row><Label>Do you need help?</Label><Switch checked={needsHelp} onCheckedChange={setNeedsHelp} /></Row>
          <div>
            <Label className="mb-2 block">How are you feeling?</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {moods.map((m) => (
                <button key={m} type="button" onClick={() => setMood(m)}
                  className={`rounded-md border px-2 py-1.5 text-xs ${mood === m ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}>{m}</button>
              ))}
            </div>
          </div>
          <Row><Label>Available today?</Label><Switch checked={available} onCheckedChange={setAvailable} /></Row>
          <Row><Label>Need coverage?</Label><Switch checked={needsCoverage} onCheckedChange={setNeedsCoverage} /></Row>
          <div><Label className="mb-1.5 block">Related task or issue</Label><Input value={related} onChange={(e) => setRelated(e.target.value)} placeholder="e.g. t1, i2" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button onClick={submit} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Submit Check-In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-3 py-2">{children}</div>;
}
