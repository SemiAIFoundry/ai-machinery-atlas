import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath, URL} from 'node:url';
// @ts-ignore — shared Node build utility is also exercised by release checks.
import {buildIdentity} from './scripts/build-identity.mjs';
const identity=buildIdentity();
const provenance:import('vite').Plugin={name:'atlas-build-identity',generateBundle(){this.emitFile({type:'asset' as const,fileName:'build-info.json',source:JSON.stringify(identity,null,2)});}};
export default defineConfig({base:'./', plugins:[react(),provenance], define:{__ATLAS_BUILD__:JSON.stringify(identity)}, resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}, css:{postcss:{plugins:[tailwindcss()]}}, build:{chunkSizeWarningLimit:1500}});
