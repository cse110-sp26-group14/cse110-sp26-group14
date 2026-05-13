export type Role = "Admin" | "Member";
export type Status =
  | "Checked In" | "Missing Check-In" | "Blocked" | "Needs Help"
  | "Available" | "Unavailable" | "Needs Coverage" | "AI Review Needed"
  | "Resolved" | "High Priority" | "Critical" | "Due Soon";
export type Mood = "Great" | "Good" | "Okay" | "Stressed" | "Burned Out" | "Blocked";
export type TaskStatus = "Backlog" | "Ready" | "In Sprint" | "In Progress" | "Blocked" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type IssueType = "Bug" | "Blocker" | "Task" | "Report" | "Process Issue";

export interface User {
  id: string; name: string; role: string; isAgent?: boolean; initials: string;
}
export interface CheckIn {
  id: string; userId: string; date: string;
  worked: string; next: string; blocked: boolean; blocker?: string;
  needsHelp: boolean; mood: Mood; available: boolean; needsCoverage: boolean; relatedId?: string;
}
export interface AvailabilityResponse {
  id: string; userId: string; date: string; available: boolean;
  blocks: { hour: number; state: "Available" | "Unavailable" | "Tentative" | "Needs Coverage" | "Preferred" }[];
  preferredFormat: "in person" | "online" | "hybrid" | "no preference";
  canCover: boolean; needsCoverage: boolean; notes?: string;
}
export interface Task {
  id: string; title: string; description: string; priority: Priority;
  status: TaskStatus; ownerId?: string; sprint: string; dueDate?: string;
  relatedIssueId?: string; aiSuggested: boolean; notes: string[];
}
export interface Issue {
  id: string; title: string; description: string; type: IssueType; priority: Priority;
  status: "Open" | "In Progress" | "Blocked" | "Resolved";
  reporterId: string; assigneeId?: string; sprint: string;
  relatedTaskId?: string; createdAt: string; dueDate?: string; notes: string[];
  blocking?: boolean;
}
export interface Note {
  id: string; title: string; body: string; createdAt: string;
  attachTo: { type: "Task" | "Issue" | "Blocker" | "Meeting" | "Sprint" | "AI Log"; id: string };
  visibility: "Private" | "Team-visible";
}
export interface Meeting {
  id: string; title: string; date: string; time: string;
  format: "in person" | "online" | "hybrid"; location: string;
  goal: string; attendees: string[]; sprint: string; relatedTaskIds: string[];
}
export interface AILog {
  id: string; type: "AI Summary Generated" | "AI Reminder Sent" | "AI Sprint Tasks Suggested" | "AI Meeting Time Suggested" | "AI Issue Follow-up Suggested";
  timestamp: string; inputSource: string; outputSummary: string;
  reviewer?: string; approval: "Pending Review" | "Approved" | "Rejected" | "Applied";
  linkedTaskIds: string[]; linkedEventIds: string[];
}
