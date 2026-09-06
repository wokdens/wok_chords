/**
 * Analytics and Telemetry Configuration for WokChords
 * 
 * Supports:
 * - Google Analytics 4 (GA4) via PUBLIC_GA_MEASUREMENT_ID (e.g. 'G-XXXXXXXXXX')
 * - Cloudflare Web Analytics via PUBLIC_CF_BEACON_TOKEN
 * - Microsoft Clarity via PUBLIC_CLARITY_ID
 */

export interface AnalyticsConfig {
  gaMeasurementId: string;
  cloudflareBeaconToken: string;
  clarityId: string;
  debug: boolean;
}

export const analyticsConfig: AnalyticsConfig = {
  // Google Analytics 4 Measurement ID
  gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID || '',

  // Cloudflare Web Analytics Beacon Token (from Cloudflare dashboard)
  cloudflareBeaconToken: import.meta.env.PUBLIC_CF_BEACON_TOKEN || '',

  // Microsoft Clarity Project ID (for heatmaps & session replays)
  clarityId: import.meta.env.PUBLIC_CLARITY_ID || '',

  // Debug mode for console logging events in development
  debug: import.meta.env.DEV || false,
};
