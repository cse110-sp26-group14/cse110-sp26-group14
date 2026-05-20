/**
 * Google Calendar API (optional). Requires `googleClientId` in app config.
 * Team discussed this in Week 7; Kaitlyn owns full integration on the backend/API side.
 * @module services/googleCalendarService
 */

import { appConfig, useGoogleCalendar } from '../config/appConfig.js';

/** @type {boolean} */
let gapiReady = false;

/**
 * Load Google API scripts (already included from index.html) and init client.
 * @returns {Promise<boolean>}
 */
export async function initGoogleCalendar() {
  if (!useGoogleCalendar()) {
    console.info('[Calendar] Set SITREP_CONFIG.googleClientId to enable Google Calendar.');
    return false;
  }

  await waitForGlobal('gapi');
  await waitForGlobal('google');

  return new Promise((resolve) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          clientId: appConfig.googleClientId,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        gapiReady = true;
        resolve(true);
      } catch (err) {
        console.error('[Calendar] gapi init failed', err);
        resolve(false);
      }
    });
  });
}

/**
 * List upcoming events (after user grants consent via Google Identity Services).
 * @returns {Promise<object[]>}
 */
export async function listUpcomingEvents() {
  if (!gapiReady) {
    throw new Error('Google Calendar not initialized');
  }
  const now = new Date().toISOString();
  const response = await window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: now,
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.result.items || [];
}

/**
 * @param {string} name
 * @returns {Promise<void>}
 */
function waitForGlobal(name) {
  if (window[name]) return Promise.resolve();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window[name]) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}
