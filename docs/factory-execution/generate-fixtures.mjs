import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildFactoryExecution,factoryDefaults,factoryModels,serializeFactoryWorkspace} from '../../src/lib/factory-execution.ts';
import {createLifecycleRun,advanceLifecycleRun} from '../../src/lib/model-lifecycle.ts';
const directory=path.dirname(fileURLToPath(import.meta.url));
const cases=[
 ['uninterrupted',{fault:'none'}],
 ['partial-write-replay',{}],
 ['written-before-marker',{fault:'checkpoint-commit'}],
 ['rank-stop-replay',{fault:'rank-stop'}],
 ['volatile-update-lost',{fault:'after-update'}],
 ['stopped-with-earlier-artifact',{fault:'checkpoint-commit',recover:false}],
 ['restore-checkpoint-one',{checkpointEvery:1}],
 ['replacement-capacity',{fault:'none',storageLimitBytes:120000}],
 ['unadmitted-feed',{feedLimitW:150}],
 ['wrong-valid-mapping',{readiness:'wrong-mapping'}],
 ['carried-trained-source',{rounds:2}],
];
const scenarios=cases.map(([id,patch])=>{const source=id==='carried-trained-source'?advanceLifecycleRun(createLifecycleRun({seed:11}),3):createLifecycleRun(),input={...factoryDefaults,...patch},r=buildFactoryExecution(input,source);return {id,before:JSON.parse(serializeFactoryWorkspace(input,source)),after:{status:r.status,reason:r.reason,final:r.final,acceptedArtifact:r.status==='complete'?r.finalRun:null,durableArtifact:r.durableRun,equivalence:r.equivalence,checkpoints:r.checkpoints.map(({raw,...meta})=>meta),abortedCheckpoints:r.abortedCheckpoints}};});
fs.writeFileSync(path.join(directory,'scenarios.json'),JSON.stringify({schemaVersion:1,models:factoryModels,basis:'Actual computed before/after teaching artifacts; all hardware times and powers are assumed. No observed learners, devices or production measurements.',scenarios},null,2)+'\n');
fs.writeFileSync(path.join(directory,'example-workspace.json'),JSON.stringify(scenarios[1].before,null,2)+'\n');
console.log(`Generated ${scenarios.length} complete factory workspace fixtures.`);
