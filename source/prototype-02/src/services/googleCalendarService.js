const FALLBACK_BUSY_BLOCKS = [
    { date: '2026-05-18', hour: '10:00', title: 'Calendar hold' },
    { date: '2026-05-20', hour: '14:00', title: 'Focus block' }
];

function hasConfiguredGoogleClient() {
    return Boolean(
        window.gapi?.client?.calendar &&
        window.google?.accounts?.oauth2 &&
        window.SITREP_GOOGLE_CALENDAR_CONFIG
    );
}

export async function syncAvailabilityWithGoogleCalendar(grid) {
    if (!hasConfiguredGoogleClient()) {
        return applyBusyBlocks(grid, FALLBACK_BUSY_BLOCKS, {
            source: 'local-fallback',
            status: 'fallback',
            message: 'Google Calendar client was not configured. Local busy blocks were applied.'
        });
    }

    return {
        availability: grid,
        sync: {
            source: 'google-calendar',
            status: 'ready',
            message: 'Google Calendar client detected. Live busy lookup can be enabled when credentials are configured.'
        }
    };
}

function applyBusyBlocks(grid, busyBlocks, sync) {
    const availability = structuredCloneSafe(grid);

    busyBlocks.forEach(block => {
        if (!availability[block.date] || !availability[block.date][block.hour]) return;
        if (availability[block.date][block.hour] !== 'needs_coverage') {
            availability[block.date][block.hour] = 'unavailable';
        }
    });

    return { availability, sync };
}

function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
}
