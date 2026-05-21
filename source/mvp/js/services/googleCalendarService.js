/**
 * Google Calendar API (optional). Requires `googleClientId` in app config.
 * @module services/googleCalendarService
 */

import { appConfig, useGoogleCalendar } from '../config/appConfig.js';

/** @type {boolean} */
let gapiReady = false;
/** @type {object|null} */
let tokenClient = null;
/** @type {string|null} */
let accessToken = null;

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
 * @returns {boolean}
 */
export function isGoogleCalendarConnected() {
  return Boolean(accessToken && gapiReady);
}

/**
 * Request OAuth token and fetch upcoming events (GIS).
 * @returns {Promise<object[]>}
 */
export async function connectAndFetchGoogleEvents() {
  if (!useGoogleCalendar()) {
    throw new Error('Set googleClientId in SITREP_CONFIG (Settings) to connect Google Calendar.');
  }
  if (!gapiReady) {
    const ok = await initGoogleCalendar();
    if (!ok) throw new Error('Google Calendar API failed to initialize');
  }

  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: appConfig.googleClientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: async (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        accessToken = resp.access_token;
        window.gapi.client.setToken({ access_token: accessToken });
        try {
          const events = await listUpcomingEvents(15);
          resolve(events);
        } catch (err) {
          reject(err);
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * List upcoming events (requires prior connect).
 * @param {number} [maxResults]
 * @returns {Promise<object[]>}
 */
export async function listUpcomingEvents(maxResults = 10) {
  if (!gapiReady) {
    throw new Error('Google Calendar not initialized');
  }
  const now = new Date().toISOString();
  const response = await window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: now,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.result.items || [];
}

/**
 * Normalize Google event for SitRep UI chips.
 * @param {object} ev
 * @returns {{ iso: string, title: string, time: string, source: string }}
 */
export function formatGoogleEvent(ev) {
  const start = ev.start?.dateTime || ev.start?.date || '';
  const iso = start.slice(0, 10);
  const time = ev.start?.dateTime
    ? new Date(ev.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'All day';
  return {
    iso,
    title: ev.summary || '(No title)',
    time,
    source: 'google',
  };
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
