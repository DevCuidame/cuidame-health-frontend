import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.cuidame.health',
  appName: 'Cuídame Health',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;