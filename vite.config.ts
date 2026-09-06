import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath, URL} from 'node:url';
export default defineConfig({base:'./', plugins:[react()], resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}, css:{postcss:{plugins:[tailwindcss()]}}, build:{chunkSizeWarningLimit:1500}});
