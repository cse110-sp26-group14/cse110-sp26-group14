const INITIAL_DATA = {
    users: [
        { id: 1, name: 'Maya Patel', role: 'Project Manager', avatar: 'MP', availability: {} },
        { id: 2, name: 'Alex Chen', role: 'Frontend', avatar: 'AC', availability: {} },
        { id: 3, name: 'Jordan Lee', role: 'Backend', avatar: 'JL', availability: {} },
        { id: 4, name: 'Priya Shah', role: 'QA / Testing', avatar: 'PS', availability: {} },
        { id: 5, name: 'Sam Rivera', role: 'Documentation', avatar: 'SR', availability: {} }
    ],
    sprints: [
        { id: 1, name: 'Sprint 1', start: '2026-05-01', end: '2026-05-08', status: 'completed' },
        { id: 2, name: 'Sprint 2', start: '2026-05-12', end: '2026-05-19', status: 'active' },
        { id: 3, name: 'Sprint 3', start: '2026-05-22', end: '2026-05-29', status: 'planned' }
    ],
    tasks: [
        { id: 1, title: 'Migrate billing schema to v3', owner: 'Jordan Lee', sprintId: 2, priority: 'critical', status: 'blocked', due: '2026-05-15' },
        { id: 2, title: 'Implement OAuth redirect handler', owner: 'Alex Chen', sprintId: 2, priority: 'high', status: 'progress', due: '2026-05-16' },
        { id: 3, title: 'Investigate flaky payment test', owner: 'Priya Shah', sprintId: 3, priority: 'high', status: 'open', due: null },
        { id: 4, title: 'Author onboarding docs', owner: 'Sam Rivera', sprintId: 2, priority: 'medium', status: 'progress', due: '2026-05-19' },
        { id: 5, title: 'Add E2E tests for checkout', owner: 'Priya Shah', sprintId: 2, priority: 'medium', status: 'open', due: null },
        { id: 6, title: 'Refactor toast provider', owner: null, sprintId: 3, priority: 'low', status: 'open', due: null },
        { id: 7, title: 'Generate API reference', owner: 'Sam Rivera', sprintId: 1, priority: 'low', status: 'resolved', due: null }
    ],
    issues: [
        { id: 1, title: 'Staging environment is down', severity: 'critical', status: 'open', tags: ['Blocker'], author: 'Priya Shah', assignee: 'Jordan Lee', sprintId: 2, created: '2026-05-13', description: 'All endpoints 502 since 09:00' },
        { id: 2, title: 'Settings flow design review', severity: 'medium', status: 'progress', tags: ['Process Issue'], author: 'Alex Chen', assignee: 'Maya Patel', sprintId: 2, created: '2026-05-12', description: 'Empty states need approval' },
        { id: 3, title: 'Apple Connect cert expired', severity: 'high', status: 'open', tags: ['Bug'], author: 'Sam Rivera', assignee: null, sprintId: 2, created: '2026-05-11', description: 'Cannot push test builds' }
    ],
    reports: [
        { id: 1, userId: 1, date: '2026-05-13', mood: 'Good', progress: 'Lead standup', blockers: 'None', timestamp: '2026-05-13T09:00:00' },
        { id: 2, userId: 2, date: '2026-05-13', mood: 'Neutral', progress: 'OAuth work', blockers: 'Staging down', timestamp: '2026-05-13T09:30:00' }
    ],
    aiLogs: [
        { id: 1, type: 'Summary', title: 'AI Summary Generated', status: 'approved', content: 'Team mostly on track; 1 blocker on staging env.', timestamp: '2026-05-13T09:30:00', details: { input: '3 check-ins', reviewer: 'Maya Patel' } },
        { id: 2, type: 'Suggestion', title: 'AI Sprint Tasks Suggested', status: 'applied', content: '5 tasks generated, 3 added to backlog.', timestamp: '2026-05-12T17:10:00', details: { input: 'Sprint planning notes' } },
        { id: 3, type: 'Meeting', title: 'AI Meeting Time Suggested', status: 'pending', content: 'Best slot: Wed 2 PM (4/5 available).', timestamp: '2026-05-12T11:00:00', details: { input: 'Availability grid' } }
    ],
    availability: {
        '2026-05-13': {
            1: { '9:00': 'preferred', '10:00': 'unavailable', '11:00': 'available', '12:00': 'available', '13:00': 'available', '14:00': 'available', '15:00': 'available', '16:00': 'tentative', '17:00': 'tentative' },
            2: { '9:00': 'tentative', '10:00': 'needs_coverage', '11:00': 'preferred', '12:00': 'unavailable', '13:00': 'available', '14:00': 'available', '15:00': 'available', '16:00': 'available', '17:00': 'available' },
            3: { '9:00': 'tentative', '10:00': 'tentative', '11:00': 'needs_coverage', '12:00': 'preferred', '13:00': 'unavailable', '14:00': 'available', '15:00': 'available', '16:00': 'available', '17:00': 'available' },
            4: { '9:00': 'available', '10:00': 'available', '11:00': 'available', '12:00': 'available', '13:00': 'tentative', '14:00': 'tentative', '15:00': 'needs_coverage', '16:00': 'preferred', '17:00': 'unavailable' },
            5: { '9:00': 'available', '10:00': 'tentative', '11:00': 'tentative', '12:00': 'needs_coverage', '13:00': 'preferred', '14:00': 'unavailable', '15:00': 'available', '16:00': 'available', '17:00': 'available' }
        }
    }
};

// Export to window for global access (no modules)
window.INITIAL_DATA = INITIAL_DATA;
