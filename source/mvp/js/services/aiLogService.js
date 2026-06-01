/**
 * AI log entries triggered by user actions.
 * @module services/aiLogService
 */

import { createId } from '../utils/ids.js';
import { currentTimestamp } from '../utils/dates.js';

/**
 * Builds an "approved" Note-type AI log entry from a manual team note.
 * @param {string} title
 * @param {string} content
 * @param {string} author
 * @returns {object}
 */
export function createNoteLog(title, content, author) {
  return {
    id: createId(),
    type: 'Note',
    title: title || 'Team Note',
    status: 'approved',
    content,
    timestamp: currentTimestamp(),
    details: { input: 'Manual note', reviewer: author || 'Team' },
  };
}

/**
 * Builds an AI summary log entry when the report records a blocker; returns
 * null when there is no blocker (or it is "None").
 * @param {object} report - daily check-in report
 * @returns {object|null}
 */
export function createSummaryLogForReport(report) {
  if (!report.blockers || report.blockers === 'None') {
    return null;
  }

  return {
    id: createId(),
    type: 'Summary',
    title: 'AI Summary Updated',
    status: 'approved',
    content: `Alert: ${report.blockers} reported as a blocker. Team summary updated.`,
    timestamp: currentTimestamp(),
    details: { input: 'New check-in report', reviewer: 'System' },
  };
}