import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'igenuguya-miniapp',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [{ name: 'contacts', access: 'read' }],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
  },
  webBundleDir: 'dist',
});
