import {execFileSync} from 'node:child_process';
const run=(args)=>execFileSync(process.execPath,args,{stdio:'inherit',env:{...process.env,ATLAS_REPO_ROOT:process.cwd(),ATLAS_REPO:process.cwd()}});
run(['--experimental-strip-types','docs/instructor-kit/verify-kit.mjs']);
run(['--experimental-strip-types','docs/instructor-kit/next-horizon/verify-contracts.mjs']);
run(['docs/curation/advancement/validate-addendum.mjs']);
run(['--test','docs/curation/advancement/curation-advancement.test.mjs']);
run(['docs/curation/advancement/exercise-supersession.mjs']);
run(['docs/curation/distributed-output/verify-integrated-review.mjs','.']);
