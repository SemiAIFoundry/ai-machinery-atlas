import {loadCurrent} from '../docs/curation/curation-common.mjs';
/** Load the same complete authored corpus for generation and source review. */
export async function loadAuthoredAtlas(){return loadCurrent().atlas;}
