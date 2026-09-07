import test from 'node:test';
import assert from 'node:assert/strict';
import {sensorDataset,retrievalDataset,runSensorApplication,fitSensorNormalizer,logistic,binaryCrossEntropyFromLogit,sensorObjectiveGradient,binaryMetrics,runRetrievalApplication,fitRetrievalIndex,retrieveAndAnswer,gradeCitedAnswer,evaluateRetrievalQuestions,calibrateRetrievalPolicy,retrievalTokens} from '../src/lib/evaluated-applications.ts';
const near=(actual,expected,tolerance=1e-11)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} ≉ ${expected}`);
const deepFreeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value;};

// Independent loop implementation: does not call the model's feature, gradient, or sigmoid helpers.
function referenceSensor(options){
 const training=sensorDataset.training,N=training.length,mean=[0,0],sd=[0,0];
 for(const s of training){mean[0]+=s.temperatureC/N;mean[1]+=s.vibrationMmS/N;}
 for(const s of training){sd[0]+=(s.temperatureC-mean[0])**2/N;sd[1]+=(s.vibrationMmS-mean[1])**2/N;}
 sd[0]=Math.sqrt(sd[0]);sd[1]=Math.sqrt(sd[1]);
 const p=[0,0,0],history=[];
 for(let k=0;k<options.steps;k++){
  const g=[0,0,0];
  for(const s of training){const x=[options.featureSet==='vibration'?0:(s.temperatureC-mean[0])/sd[0],options.featureSet==='temperature'?0:(s.vibrationMmS-mean[1])/sd[1],1];const prob=1/(1+Math.exp(-(p[0]*x[0]+p[1]*x[1]+p[2])));for(let j=0;j<3;j++)g[j]+=(prob-s.label)*x[j]/N;}
  g[0]+=options.l2*p[0];g[1]+=options.l2*p[1];for(let j=0;j<3;j++)p[j]-=options.learningRate*g[j];history.push([...p]);
 }
 return{mean,sd,p,history};
}
// Independent objective for the finite-difference gradient oracle (moderate logits only).
function referenceLoss(parameters,normalizer,l2){let loss=0;for(const s of sensorDataset.training){const x=[(s.temperatureC-normalizer.mean[0])/normalizer.standardDeviation[0],(s.vibrationMmS-normalizer.mean[1])/normalizer.standardDeviation[1]];const z=parameters[2]+parameters[0]*x[0]+parameters[1]*x[1],p=1/(1+Math.exp(-z));loss+=(-s.label*Math.log(p)-(1-s.label)*Math.log(1-p))/sensorDataset.training.length;}return loss+.5*l2*(parameters[0]**2+parameters[1]**2);}

test('authored splits are explicit, finite, unique and contain independent correlation-breaking sensor examples',()=>{
 assert.equal(sensorDataset.training.length,8);assert.equal(sensorDataset.evaluation.length,6);assert.equal(new Set([...sensorDataset.training,...sensorDataset.evaluation].map(s=>s.id)).size,14);
 assert.equal(retrievalDataset.documents.length,7);assert.equal(retrievalDataset.tuning.length,6);assert.equal(retrievalDataset.evaluation.length,7);
 assert.equal(new Set([...retrievalDataset.tuning,...retrievalDataset.evaluation].map(q=>q.id)).size,13);
 assert.equal(sensorDataset.evaluation[4].label,0);assert.equal(sensorDataset.evaluation[5].label,1);
});
test('training-only normalization and every batch step match independent scalar reference for feature and regularization controls',()=>{
 for(const featureSet of ['both','temperature','vibration'])for(const l2 of [0,.2,1])for(const learningRate of [.01,.3,1]){
  const s=runSensorApplication({steps:12,featureSet,l2,learningRate}),ref=referenceSensor(s.options);
  for(let j=0;j<2;j++){near(s.normalizer.mean[j],ref.mean[j]);near(s.normalizer.standardDeviation[j],ref.sd[j]);near(s.parameters.weights[j],ref.p[j]);}
  near(s.parameters.bias,ref.p[2]);s.steps.forEach((step,k)=>{near(step.after.weights[0],ref.history[k][0]);near(step.after.weights[1],ref.history[k][1]);near(step.after.bias,ref.history[k][2]);});
 }
});
test('analytic mean cross-entropy plus L2 gradient agrees with independent central differences; bias is unpenalized',()=>{
 const n=fitSensorNormalizer(sensorDataset.training),p=[.4,-.7,.2],l2=.3,g=sensorObjectiveGradient(sensorDataset.training,n,{weights:p.slice(0,2),bias:p[2]},'both',l2);
 for(let j=0;j<3;j++){const a=[...p],b=[...p];a[j]+=1e-5;b[j]-=1e-5;near(j===2?g.gradient.bias:g.gradient.weights[j],(referenceLoss(a,n,l2)-referenceLoss(b,n,l2))/2e-5,1e-9);}
 assert.equal(g.regularizationGradient.bias,0);near(g.penalty,.5*l2*(.4**2+.7**2));
});
test('changing held-out features and labels never changes normalization, gradient or fitted parameters',()=>{
 const changed=structuredClone(sensorDataset);changed.evaluation=changed.evaluation.map(s=>({...s,temperatureC:s.temperatureC+100,vibrationMmS:s.vibrationMmS*5,label:1-s.label}));
 const a=runSensorApplication(),b=runSensorApplication({},changed);assert.deepEqual(a.parameters,b.parameters);assert.deepEqual(a.normalizer,b.normalizer);assert.deepEqual(a.steps.map(s=>s.gradient),b.steps.map(s=>s.gradient));assert.notDeepEqual(a.evaluation.metrics,b.evaluation.metrics);
});
test('decision threshold changes decisions and display trace, but never fitting or cross-entropy',()=>{
 const a=runSensorApplication({decisionThreshold:0}),b=runSensorApplication({decisionThreshold:1});assert.deepEqual(a.parameters,b.parameters);near(a.evaluation.metrics.meanCrossEntropy,b.evaluation.metrics.meanCrossEntropy);
 assert.equal(a.evaluation.metrics.fp,3);assert.equal(b.evaluation.metrics.fn,3);assert.ok(a.steps.every(s=>s.rows.every(r=>r.prediction===1)));assert.ok(b.steps.every(s=>s.rows.every(r=>r.prediction===0)));
});
test('zero-step initial state is explicit and stable logistic loss handles extreme finite logits',()=>{
 const s=runSensorApplication({steps:0});assert.deepEqual(s.parameters,{weights:[0,0],bias:0});assert.equal(s.steps.length,0);near(s.training.metrics.meanCrossEntropy,Math.log(2));assert.ok(s.training.predictions.every(r=>r.probability===.5));
 assert.equal(logistic(1000),1);assert.equal(logistic(-1000),0);assert.equal(binaryCrossEntropyFromLogit(1000,0),1000);assert.equal(binaryCrossEntropyFromLogit(-1000,1),1000);near(binaryCrossEntropyFromLogit(1000,1),0);
});
test('default objective falls at each observed step; temperature-only failure is counted on shifted examples',()=>{
 const a=runSensorApplication();assert.ok(a.steps.every(s=>s.objectiveAfter<s.objectiveBefore));assert.equal(a.evaluation.metrics.accuracy,1);
 const b=runSensorApplication({featureSet:'temperature'});assert.equal(b.parameters.weights[1],0);assert.deepEqual(b.evaluation.predictions.filter(r=>!r.correct).map(r=>r.sampleId),['eval-05','eval-06']);assert.deepEqual([b.evaluation.metrics.tp,b.evaluation.metrics.tn,b.evaluation.metrics.fp,b.evaluation.metrics.fn],[2,2,1,1]);assert.equal(b.qualityGate.passed,false);
 const c=runSensorApplication({featureSet:'vibration'});assert.equal(c.parameters.weights[0],0);assert.equal(c.evaluation.metrics.accuracy,1);
});
test('confusion matrix denominators agree with hand-counted examples and undefined rates are null',()=>{
 const rows=[{label:1,prediction:1,crossEntropy:1},{label:1,prediction:0,crossEntropy:2},{label:0,prediction:1,crossEntropy:3},{label:0,prediction:0,crossEntropy:4}];const m=binaryMetrics(rows);assert.deepEqual([m.tp,m.tn,m.fp,m.fn],[1,1,1,1]);near(m.precision,.5);near(m.recall,.5);near(m.falsePositiveRate,.5);near(m.meanCrossEntropy,2.5);
 const n=binaryMetrics([{label:0,prediction:0,crossEntropy:0}]);assert.equal(n.precision,null);assert.equal(n.recall,null);assert.equal(n.falsePositiveRate,0);assert.equal(binaryMetrics([{label:1,prediction:1,crossEntropy:0}]).falsePositiveRate,null);assert.throws(()=>binaryMetrics([]));
});
test('sensor hypothetical cost is reproducible and cannot alter quality or fitted parameters',()=>{
 const a=runSensorApplication(),b=runSensorApplication({cost:{fixedLatencyUs:200,featureMacLatencyUs:3,sigmoidLatencyUs:4},latencyBudgetUs:1});assert.deepEqual(a.parameters,b.parameters);assert.deepEqual(a.qualityGate,b.qualityGate);assert.equal(b.resourceScenario.modeledInferenceUs,210);assert.equal(b.resourceScenario.latencyPassed,false);assert.equal(b.resourceScenario.coefficientPayloadBytes,24);assert.equal(b.resourceScenario.trainingCoreFeatureMacs,24*8*2);
});
test('sensor top-level validation rejects bad controls, overlap and degenerate training features',()=>{
 for(const opts of [{steps:-1},{steps:1.5},{learningRate:0},{decisionThreshold:NaN},{featureSet:'all'},{l2:2},{other:1},{cost:{other:1}},{cost:null}])assert.throws(()=>runSensorApplication(opts));
 const d=structuredClone(sensorDataset);d.evaluation[0].id=d.training[0].id;assert.throws(()=>runSensorApplication({},d));d.evaluation[0].id='unique';d.training.forEach(s=>s.temperatureC=20);assert.throws(()=>runSensorApplication({},d));
});

// Independent TF–IDF reference uses a dense vocabulary vector and dot products, not model scoring helpers.
const excluded='what is the a an of for to in how many does do are from who and with its this please s'.split(' ');
const refTokens=text=>(text.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>!excluded.includes(t));
function referenceRetrieval(question){const docs=retrievalDataset.documents.map(d=>({id:d.id,t:refTokens(d.text)})),v=[...new Set(docs.flatMap(d=>d.t))].sort(),idf=v.map(term=>Math.log(docs.length/docs.filter(d=>d.t.includes(term)).length)),qt=refTokens(question),q=v.map((term,j)=>qt.filter(t=>t===term).length*idf[j]),qn=Math.hypot(...q);return docs.map(d=>{const x=v.map((term,j)=>d.t.filter(t=>t===term).length*idf[j]),dn=Math.hypot(...x),dot=x.reduce((sum,a,j)=>sum+a*q[j],0);return{id:d.id,score:qn&&dn?dot/qn/dn:0};}).sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0));}

test('index IDF and every tuning/evaluation cosine score match independent dense-vector reference',()=>{
 const index=fitRetrievalIndex();assert.equal(index.documentCount,7);assert.equal(index.documentFrequency.alder,3);near(index.idf.alder,Math.log(7/3));assert.equal(index.documentFrequency.cedar,1);near(index.idf.cedar,Math.log(7));
 for(const q of [...retrievalDataset.tuning,...retrievalDataset.evaluation]){const actual=retrieveAndAnswer(q.question),ref=referenceRetrieval(q.question);assert.deepEqual(actual.ranked.map(r=>r.documentId),ref.map(r=>r.id));actual.ranked.forEach((r,i)=>near(r.score,ref[i].score));for(const r of actual.ranked)near(r.dot,r.overlap.reduce((sum,x)=>sum+x.product,0));}
});
test('term tokenization, repeated counts, unknown terms and empty-query score rules are explicit',()=>{
 assert.deepEqual(retrievalTokens('What is ALDER input: 3 volts?'),['alder','input','3','volts']);const r=retrieveAndAnswer('Alder Alder sampling interval xyzzy');assert.equal(r.queryWeights.find(t=>t.term==='alder').count,2);assert.ok(r.ignoredTerms.includes('xyzzy'));
 for(const query of ['','xyzzy plugh','what is the']){const x=retrieveAndAnswer(query);assert.equal(x.queryNorm,0);assert.equal(x.answer,null);assert.deepEqual(x.selectedDocumentIds,[]);assert.ok(x.ranked.every(r=>r.score===0));}
});
test('topK and minimum similarity filter actual scores before answer selection',()=>{
 for(const topK of [1,2,3,4])for(const minScore of [0,.25,.5,.75,1]){const r=retrieveAndAnswer('Alder sampling interval',{topK,minScore});const expected=r.ranked.filter(x=>x.score>0&&x.score>=minScore).slice(0,topK).map(x=>x.documentId);assert.deepEqual(r.selectedDocumentIds,expected);}
});
test('default closed-corpus support differs from task correctness on the wrong-entity question',()=>{
 const r=runRetrievalApplication();assert.equal(r.evaluation.metrics.correct,5);assert.equal(r.evaluation.metrics.count,7);assert.equal(r.evaluation.metrics.supportedAnswers,4);assert.equal(r.evaluation.metrics.answered,4);assert.equal(r.evaluation.metrics.sourceSupportAmongAnswers,1);assert.equal(r.selectedQuery.trace.answer.fact.id,'alder-interval-fact');assert.equal(r.selectedQuery.grade.sourceSupported,true);assert.equal(r.selectedQuery.grade.answerValueCorrect,false);assert.equal(r.selectedQuery.grade.taskCorrect,false);assert.equal(r.qualityGate.passed,false);assert.equal(r.evaluation.metrics.retrievalRecallAtK,1);
});
test('an exact copied fact is insufficient when citation document, quote, response text or typed value is corrupted',()=>{
 const question=retrievalDataset.evaluation[0],valid=retrieveAndAnswer(question.question).answer;assert.ok(valid);assert.equal(gradeCitedAnswer(valid,question).taskCorrect,true);
 const mutations=[a=>a.citation.documentId='birch-input',a=>a.citation.quote='unsupported text',a=>a.text='Alder input voltage limit is 9 volts.',a=>a.fact.value=9,a=>a.fact.id='unknown',a=>a.fact.unit='amperes'];
 for(const mutate of mutations){const answer=structuredClone(valid);mutate(answer);const grade=gradeCitedAnswer(answer,question);assert.equal(grade.sourceSupported,false);assert.equal(grade.taskCorrect,false);}
});
test('abstention correctness uses answer availability, with null support when no answer is produced',()=>{
 const answerable=retrievalDataset.evaluation[0],unknown=retrievalDataset.evaluation[4];assert.equal(gradeCitedAnswer(null,answerable).taskCorrect,false);assert.equal(gradeCitedAnswer(null,unknown).taskCorrect,true);assert.equal(gradeCitedAnswer(null,unknown).sourceSupported,null);
 const q=[{id:'none',question:'xyzzy',expectedFactIds:[],note:''}];const e=evaluateRetrievalQuestions(q);assert.equal(e.metrics.taskAccuracy,1);assert.equal(e.metrics.sourceSupportAmongAnswers,null);assert.equal(e.metrics.correctAnswersAmongAnswerable,null);assert.equal(e.metrics.retrievalRecallAtK,null);assert.equal(e.metrics.unanswerableAbstentionRecall,1);
});
test('first-passage policy yields all supported answers but fails the two unanswerable cases',()=>{
 const r=runRetrievalApplication({answerMode:'top-passage'});assert.equal(r.evaluation.metrics.answered,7);assert.equal(r.evaluation.metrics.supportedAnswers,7);assert.equal(r.evaluation.metrics.correct,4);assert.equal(r.evaluation.metrics.correctAbstentions,0);assert.equal(r.evaluation.rows.find(q=>q.queryId==='question-05').grade.taskCorrect,false);assert.equal(r.evaluation.rows.find(q=>q.queryId==='question-07').grade.taskCorrect,false);
});
test('threshold calibration is reproducible from tuning labels only, with explicit tie-breaking',()=>{
 const a=calibrateRetrievalPolicy();assert.equal(a.trials.length,11);const max=Math.max(...a.trials.map(t=>t.metrics.taskAccuracy)),expected=Math.max(...a.trials.filter(t=>t.metrics.taskAccuracy===max).map(t=>t.minScore));assert.equal(a.recommendedMinScore,expected);assert.equal(expected,.5);assert.deepEqual(a.usedQueryIds,retrievalDataset.tuning.map(q=>q.id));
 const d=structuredClone(retrievalDataset);d.evaluation=d.evaluation.map(q=>({...q,question:'changed unseen terms',expectedFactIds:[]}));assert.deepEqual(calibrateRetrievalPolicy({},d),a);assert.deepEqual(fitRetrievalIndex(d),fitRetrievalIndex());
});
test('answer construction is independent of expected labels while grading responds to changed labels',()=>{
 const d=structuredClone(retrievalDataset);d.evaluation[0].expectedFactIds=['birch-input-fact'];const a=runRetrievalApplication({queryId:'question-01'}),b=runRetrievalApplication({queryId:'question-01'},d);assert.deepEqual(a.selectedQuery.trace,b.selectedQuery.trace);assert.equal(a.selectedQuery.grade.taskCorrect,true);assert.equal(b.selectedQuery.grade.taskCorrect,false);assert.deepEqual(a.index,b.index);assert.deepEqual(a.calibration,b.calibration);
});
test('retrieval resource inputs affect only the hypothetical budget and match counted trace work',()=>{
 const q=retrievalDataset.evaluation[0].question,a=retrieveAndAnswer(q),b=retrieveAndAnswer(q,{latencyBudgetUs:1,cost:{fixedLatencyUs:10,dictionaryProbeLatencyUs:2,contextTokenLatencyUs:3}});assert.deepEqual(a.answer,b.answer);assert.deepEqual(a.ranked,b.ranked);const probes=7*b.queryWeights.length,words=b.selectedDocumentIds.map(id=>retrievalDataset.documents.find(d=>d.id===id).text.match(/[a-z0-9]+/gi).length).reduce((s,n)=>s+n,0);assert.equal(b.resourceScenario.dictionaryProbes,probes);assert.equal(b.resourceScenario.contextTokenCount,words);assert.equal(b.resourceScenario.modeledLatencyUs,10+2*probes+3*words);assert.equal(b.resourceScenario.latencyPassed,false);
 const r=runRetrievalApplication();assert.equal(r.indexResourceScenario.sparsePairPayloadBytes,r.index.documents.reduce((s,d)=>s+d.weights.filter(w=>w.weight!==0).length,0)*12);
});
test('retrieval validation rejects invalid controls and broken references',()=>{
 for(const opts of [{topK:0},{topK:1.5},{minScore:NaN},{answerMode:'generated'},{queryId:'no-such-id'},{cost:{wrong:1}},{cost:null},{unknown:true}])assert.throws(()=>runRetrievalApplication(opts));
 let d=structuredClone(retrievalDataset);d.evaluation[0].id=d.tuning[0].id;assert.throws(()=>runRetrievalApplication({},d));d=structuredClone(retrievalDataset);d.evaluation[0].expectedFactIds=['missing'];assert.throws(()=>runRetrievalApplication({},d));d=structuredClone(retrievalDataset);d.documents[0].facts[0].statement='absent text';assert.throws(()=>runRetrievalApplication({},d));assert.throws(()=>retrieveAndAnswer('x'.repeat(4001)));
});
test('both applications accept frozen inputs, have deterministic JSON-safe output and resolve saved options',()=>{
 const sd=deepFreeze(structuredClone(sensorDataset)),rd=deepFreeze(structuredClone(retrievalDataset)),s=runSensorApplication(deepFreeze({steps:3,cost:{fixedLatencyUs:12}}),sd),r=runRetrievalApplication(deepFreeze({topK:1,cost:{fixedLatencyUs:12}}),rd);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),s);assert.deepEqual(JSON.parse(JSON.stringify(r)),r);assert.deepEqual(runSensorApplication(s.options,sd),s);assert.deepEqual(runRetrievalApplication(r.options,rd),r);
});
