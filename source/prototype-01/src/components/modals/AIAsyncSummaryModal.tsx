import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useApp } from "@/lib/app-store";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/StatusBadge";

export function AIAsyncSummaryModal({ open }: { open: boolean }) {
  const { closeModal, checkIns, users, isAdmin, openModal } = useApp();
  const today = "2026-05-13";
  const todays = checkIns.filter((c) => c.date === today);
  const submittedIds = new Set(todays.map((c) => c.userId));
  const humans = users.filter((u) => !u.isAgent);
  const missing = humans.filter((u) => !submittedIds.has(u.id));
  const blockers = todays.filter((c) => c.blocked);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI async summary</DialogTitle>
          <DialogDescription>Generated from today's team check-ins.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border p-4" style={{ background: "var(--purple-soft)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--purple)" }}>
              The team is mostly on track for Sprint 2 with {todays.length} of {humans.length} check-ins submitted. {blockers.length} blocker(s) need attention, primarily around the staging environment outage. Morale is mixed; 1 teammate is stressed and may need support.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Submitted" value={todays.length} tone="var(--success)" />
            <Stat label="Missing" value={missing.length} tone="var(--warning)" />
            <Stat label="Blockers" value={blockers.length} tone="var(--danger)" />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="size-4" style={{ color: "var(--warning)" }} /> Key risks</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Staging is down — blocks QA regression suite.</li>
              <li>Billing schema migration window unconfirmed.</li>
              <li>Priya feeling stressed; consider reassigning.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Original updates</h3>
            <Accordion type="single" collapsible>
              {todays.map((c) => {
                const u = users.find((x) => x.id === c.userId)!;
                return (
                  <AccordionItem key={c.id} value={c.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{u.name}</span>
                        <Badge tag={c.mood} />
                        {c.blocked && <Badge tag="Blocked" />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1.5 text-sm">
                        <div><span className="text-muted-foreground">Worked on:</span> {c.worked}</div>
                        <div><span className="text-muted-foreground">Next:</span> {c.next}</div>
                        {c.blocker && <div><span className="text-muted-foreground">Blocker:</span> {c.blocker}</div>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Suggested follow-ups</h3>
            <ul className="text-sm space-y-1.5">
              <li>· Spin up backup staging instance</li>
              <li>· Schedule 1:1 with Priya</li>
              <li>· Confirm DBA migration window</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={closeModal}>Close</Button>
          <Button variant="outline" onClick={() => { closeModal(); openModal("createIssue", { type: "Task", title: "Follow-up from AI summary" }); }}>Create Follow-up Issue</Button>
          {isAdmin && <Button onClick={() => { toast.success("Reminder sent to missing teammates"); closeModal(); }} className="text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>Send Reminder</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color: tone }}>{value}</div>
    </div>
  );
}
