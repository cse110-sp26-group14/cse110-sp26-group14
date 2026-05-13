import { useApp } from "@/lib/app-store";
import { DailyCheckInModal } from "./DailyCheckInModal";
import { AvailabilityCheckModal } from "./AvailabilityCheckModal";
import { CreateIssueModal } from "./CreateIssueModal";
import { AddNoteModal } from "./AddNoteModal";
import { AIAsyncSummaryModal } from "./AIAsyncSummaryModal";
import { AISprintSuggestionModal } from "./AISprintSuggestionModal";

export function ModalsHost() {
  const { modal } = useApp();
  return (
    <>
      <DailyCheckInModal open={modal.kind === "checkin"} />
      <AvailabilityCheckModal open={modal.kind === "availability"} />
      <CreateIssueModal open={modal.kind === "createIssue"} payload={modal.payload} />
      <AddNoteModal open={modal.kind === "addNote"} payload={modal.payload} />
      <AIAsyncSummaryModal open={modal.kind === "aiSummary"} />
      <AISprintSuggestionModal open={modal.kind === "aiSuggest"} />
    </>
  );
}
