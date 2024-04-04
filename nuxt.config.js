import * as Sentry from "@sentry/vue";

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    TRACCAR_SERVER: process.env.TRACCAR_SERVER,
    TRACCAR_USER: process.env.TRACCAR_USER,
    TRACCAR_PASS: process.env.TRACCAR_PASS,
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    mapboxglAccessTokenDirections: process.env.mapboxglAccessTokenDirections
  },
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Seguimiento ' + process.env.npm_package_version,
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    'mapbox-gl/dist/mapbox-gl.css', '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  plugins: [
    '~/plugins/fontawesome.js', '~/plugins/dynamo.js'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/eslint-module'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/i18n',
    '@nuxtjs/proxy',
    '@nuxtjs/sentry'
  ],
  sentry: {
    dsn: "https://7a563b674cbc0d1f946c40911bc49e0d@o4507029627797504.ingest.us.sentry.io/4507029632122880",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/polpaico.fleetrack.eu\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  },
  i18n: {
    locales: ['pt', 'es'],
    defaultLocale: 'es',
    vueI18n: {
      messages: {
        pt: {
          Obscuro: 'Escuro',
          Calles: 'Ruas'
        }
      }
    }
  },
  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    baseURL: '/api',
    credentials: true
  },
  ...process.env.NODE_ENV === 'development' && {
    proxy: {
      '/api': {
        target: 'https://traccar-eu.fleetmap.pt',
        ws: true
      }
    }
  }
  // Build Configuration: https://go.nuxtjs.dev/config-build
}
