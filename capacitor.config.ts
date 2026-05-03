import type { CapacitorConfig } from '@capacitor/cli'

// In production, set CAPACITOR_SERVER_URL to your Vercel deployment URL.
// e.g. https://daily-seguros.vercel.app
// For local dev:  npx cap run android  (with CAPACITOR_SERVER_URL unset, uses localhost)
const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.daily.app',
  appName: 'daily',
  webDir: 'public',           // fallback dir (not used when server.url is set)
  server: serverUrl
    ? { url: serverUrl, cleartext: false }
    : { androidScheme: 'https' },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#F5F0E8',   // --sand-bg
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F5F0E8',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  ios: {
    contentInset: 'always',
    scrollEnabled: false,
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
}

export default config
