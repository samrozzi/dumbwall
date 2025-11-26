import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Don't send errors in development unless explicitly enabled
    enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',

    beforeSend(event, hint) {
      // Filter out errors we don't want to track
      const error = hint.originalException;

      // Don't track network errors from browser extensions
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message.includes('Extension') || message.includes('chrome-extension')) {
          return null;
        }
      }

      return event;
    },
  });
};

export { Sentry };
