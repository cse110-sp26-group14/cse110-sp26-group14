import { DashboardView } from './views/DashboardView.js';
import { CalendarView } from './views/CalendarView.js';
import { BacklogView } from './views/BacklogView.js';
import { IssuesView } from './views/IssuesView.js';
import { AvailabilityView } from './views/AvailabilityView.js';
import { AILogView } from './views/AILogView.js';
import { SettingsView } from './views/SettingsView.js';

export const routes = {
    '#dashboard': DashboardView,
    '#calendar': CalendarView,
    '#backlog': BacklogView,
    '#issues': IssuesView,
    '#team-availability': AvailabilityView,
    '#ai-log': AILogView,
    '#settings': SettingsView
};
