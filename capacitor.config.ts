import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fairfare.app",
  appName: "Fair Fare",
  // Points the native shell to the live Vercel deployment.
  // The app works online; no static export needed.
  server: {
    url: "https://fair-fare.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  // For local dev/testing, swap the server URL above with:
  //   url: "http://YOUR_LOCAL_IP:3000"
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
