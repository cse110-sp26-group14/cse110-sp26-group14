import { createId } from '../utils/ids.js';
import { currentTimestamp } from '../utils/dates.js';

export function createSummaryLogForReport(report) {
    if (report.blockers === 'None') {
        return null;
    }

    return {
        id: createId(),
        type: 'Summary',
        title: 'AI Summary Updated',
        status: 'approved',
        content: `Alert: ${report.blockers} reported as a blocker. Team summary updated.`,
        timestamp: currentTimestamp(),
        details: { input: 'New check-in report', reviewer: 'System' }
    };
}
