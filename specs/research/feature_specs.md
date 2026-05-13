# System Behavior Specifications

## 1. Login System

When a user signs up:
- The system creates a new user profile.
- The profile stores the user’s name, role, availability, assigned tasks, reports, and sprint activity.

When a user logs in:
- The system verifies the user’s information.
- If login succeeds, the user is sent to the main dashboard.
- If login fails, the system shows an error message.

After login:
- The system displays sprint information specific to that user.

---

## 2. Sprint Calendar

When the user opens the dashboard:
- The system displays the current month calendar.
- The current active sprint week is highlighted.
- Sprint deadlines and meeting dates are shown on the calendar.

When the user clicks a meeting:
- The system displays meeting details, including:
  - date and time
  - meeting format
  - location or Zoom link
  - meeting goal

When the user clicks a sprint deadline:
- The system displays sprint-specific information for that user.
- This includes assigned tasks, related blockers, sprint notes, and progress status.

---

## 3. Project Information Dashboard

When the dashboard loads:
- The system shows the overall project completion status.
- The system displays current priority tasks.
- The system highlights active blockers and urgent issues.
- The system shows recent team activity.

When a user selects a different sprint:
- The dashboard updates to show information for that sprint.
- Task progress, issues, and reports change based on the selected sprint.

---

## 4. Async Check-In & Reporting System

At the scheduled check-in time:
- The system reminds users to submit a daily progress report.

When a user submits a report:
- The user selects a status:
  - Completed
  - In Progress
  - Blocked
  - Not Started
- The user writes current progress.
- The user can add blockers, issues, or comments.
- The system timestamps the report.
- The system attaches the report to the active sprint.

After a report is submitted:
- The dashboard updates the user’s check-in status.
- If the report includes a blocker, the blocker is added to the Issues / Blocker list.

---

## 5. AI Team Summary System

After daily reports are submitted:
- The system collects all reports from the active sprint.
- The AI generates a short team summary.

The summary includes:
- completed work
- work in progress
- blockers
- missing check-ins
- possible sprint risks

After the summary is generated:
- The summary is displayed on the dashboard.
- Original reports remain available for users to review.
- The summary is saved in the Activity Log.

---

## 6. AI Sprint Task Suggestion

When an admin opens the AI Sprint Task Suggestion tool:
- The admin enters project goals, deadlines, or requirements.
- The system sends this information to the AI.

The AI generates:
- suggested sprint tasks
- possible priorities
- tasks based on reported blockers or unfinished work

After tasks are generated:
- The admin reviews the suggestions.
- The admin can accept, edit, or reject suggested tasks.
- Accepted tasks are added to the sprint calendar or priority task list.

---

## 7. Issue / Blocker Tracking

When a user creates an issue:
- The system asks for:
  - issue title
  - issue description
  - priority level
  - related task or sprint

After the issue is submitted:
- The system adds it to the Issues / Blocker list.
- The issue appears on the dashboard if it is urgent.
- The issue can affect sprint priority.

When an issue is resolved:
- The system marks it as resolved.
- The resolved issue is saved in the Activity Log.

---

## 8. Activity Log / Backlog

When reports, AI summaries, issues, or sprint updates are created:
- The system saves them in the Activity Log.

Users can filter the log by:
- sprint
- user
- task
- priority
- issue status

When a user opens the Activity Log:
- The system displays previous updates in chronological order.
- Users can review past decisions without searching through Slack or chat messages.

---

## 9. Availability Tracking

When users submit availability:
- The system saves their available times.
- The system compares availability across team members.

When planning meetings:
- The system suggests possible meeting times based on team availability.
- Suggested meeting times can appear on the sprint calendar.

When availability changes:
- The calendar and meeting suggestions update accordingly.