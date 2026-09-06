/**
 * Client-side Telemetry and Event Tracking for WokChords.
 * Safely dispatches custom events to Google Analytics 4 (gtag.js)
 * and dataLayer without throwing if analytics is blocked or unconfigured.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    if (typeof window === 'undefined') return;

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (err) {
    // Fail silently in production so analytics never disrupts the user experience
  }
}

/**
 * Track when a user views a song sheet
 */
export function trackSongView(details: { title: string; artist: string; key?: string; tempo?: number }) {
  trackEvent('song_view', {
    song_title: details.title,
    artist_name: details.artist,
    musical_key: details.key || 'unknown',
    tempo: details.tempo || 0,
  });
}

/**
 * Track when a musician transposes the song key (+ / - semitones)
 */
export function trackTranspose(details: { title: string; semitones: number; newKey?: string }) {
  trackEvent('chord_transpose', {
    song_title: details.title,
    semitones: details.semitones,
    new_key: details.newKey || 'unknown',
  });
}

/**
 * Track when a musician changes the capo fret
 */
export function trackCapoChange(details: { title: string; capoFret: number }) {
  trackEvent('capo_change', {
    song_title: details.title,
    capo_fret: details.capoFret,
  });
}

/**
 * Track instrument toggle (Guitar, Ukulele, Piano)
 */
export function trackInstrumentChange(instrument: string) {
  trackEvent('instrument_change', {
    instrument_name: instrument,
  });
}

/**
 * Track setlist additions and removals
 */
export function trackSetlistAction(details: { title: string; action: 'add' | 'remove' }) {
  trackEvent('setlist_action', {
    song_title: details.title,
    action: details.action,
  });
}

/**
 * Track user search queries to discover song demand
 */
export function trackSearch(query: string, resultsCount: number) {
  if (!query.trim()) return;
  trackEvent('search', {
    search_term: query.trim(),
    results_count: resultsCount,
  });
}

/**
 * Track social sharing actions
 */
export function trackShare(details: { title: string; method: string }) {
  trackEvent('share', {
    content_type: 'song_chords',
    item_id: details.title,
    method: details.method,
  });
}

/**
 * Track tuner activations
 */
export function trackTunerOpen() {
  trackEvent('tuner_opened', {
    category: 'musical_tools',
  });
}
