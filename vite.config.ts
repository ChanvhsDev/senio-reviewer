import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __HAS_CAT_IMG__: JSON.stringify(
      fs.existsSync(path.resolve(__dirname, 'public/cat.jpg'))
    ),
  },
});
