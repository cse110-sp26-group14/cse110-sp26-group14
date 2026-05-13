import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/app-store";
import { useState } from "react";
import { toast } from "sonner";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
type State = "Available" | "Unavailable" | "Tentative" | "Needs Coverage" | "Preferred";
const states: State[] = ["Available", "Tentative", "Unavailable"];
const stateColor: Record<string, string> = {
  Available: "var(--success)", Tentative: "var(--info)", Unavailable: "var(--muted-foreground)",
  "Needs Coverage": "var(--warning)", Preferred: "var(--purple)",
};

export function AvailabilityCheckModal({ open }: { open: boolean }) {
  const { closeModal, addAvailability } = useApp();
  const [available, setAvailable] = useState(true);
  const [format, setFormat] = useState<"in person" | "online" | "hybrid" | "no preference">("online");
  const [canCover, setCanCover] = useState(false);
  const [needsCoverage, setNeedsCoverage] = useState(false);
  const [notes, setNotes] = useState("");
  const [grid, setGrid] = useState<Record<number, State>>(() =>
    Object.fromEntries(HOURS.map((h) => [h, "Available"])) as Record<number, State>);

  const cycle = (h: number) => {
    const i = states.indexOf(grid[h] as State);
    setGrid({ ...grid, [h]: states[(i + 1) % states.length] });
  };

  const submit = () => {
    addAvailability({
      available, preferredFormat: format, canCover, needsCoverage, notes,
      blocks: HOURS.map((h) => ({ hour: h, state: grid[h] })),
    });
    toast.success("Availability saved");
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Availability check</DialogTitle>
          <DialogDescription>Tell the team when you can meet today.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Row><Label>Available today?</Label><Switch checked={available} onCheckedChange={setAvailable} /></Row>

          <div>
            <Label className="mb-2 block">Time blocks (click to toggle)</Label>
            <div className="grid grid-cols-9 gap-1.5">
              {HOURS.map((h) => (
                <button key={h} onClick={() => cycle(h)}
                  className="rounded-md border border-border p-1.5 text-[10px] text-center hover:border-primary"
                  style={{ background: `color-mix(in oklab, ${stateColor[grid[h]]} 18%, white)` }}>
                  <div className="font-mono">{h}:00</div>
                  <div className="mt-0.5 truncate" style={{ color: stateColor[grid[h]] }}>{grid[h]}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Cycles through Available → Tentative → Unavailable</div>
          </div>

          <div>
            <Label className="mb-1.5 block">Preferred meeting format</Label>
            <div className="flex flex-wrap gap-1.5">
              {(["in person", "online", "hybrid", "no preference"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${format === f ? "border-primary bg-primary/10 font-medium" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}>{f}</button>
              ))}
            </div>
          </div>

          <Row><Label>Can you cover for someone?</Label><Switch checked={canCover} onCheckedChange={setCanCover} /></Row>
          <Row><Label>Do you need coverage?</Label><Switch checked={needsCoverage} onCheckedChange={setNeedsCoverage} /></Row>
          <div><Label className="mb-1.5 block">Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button onClick={submit} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Submit Availability</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-3 py-2">{children}</div>;
}
