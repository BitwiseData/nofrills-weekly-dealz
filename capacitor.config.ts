// Capacitor config — used ONLY when building the native iOS/Android app.
// Not imported by Next.js. Run: npx cap add ios/android
// See MOBILE_SETUP.md for full instructions.

const config = {
  appId: "com.fairfare.app",
  appName: "Fair Fare",
  // Points the native shell to the live Vercel deployment.
  // No static export needed — the app loads the website inside a native container.
  server: {
    url: "https://fair-fare.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
