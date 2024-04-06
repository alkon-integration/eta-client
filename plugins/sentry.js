import Vue from 'vue'
import * as Sentry from '@sentry/vue'

Sentry.init({
  Vue,
  dsn: 'https://7a563b674cbc0d1f946c40911bc49e0d@o4507029627797504.ingest.us.sentry.io/4507029632122880',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      networkDetailAllowUrls: ['/api/devices']
    })
  ],
  tracesSampleRate: 0.01,
  tracePropagationTargets: [/.*/],
  replaysSessionSampleRate: 0.01, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 0.01 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
})
