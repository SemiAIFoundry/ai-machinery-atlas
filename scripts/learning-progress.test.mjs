import {test} from 'node:test';import assert from 'node:assert/strict';
import {restoreProgress,serializeProgress,checkRevision} from '../src/lib/learning-progress.ts';
const lesson={id:'adder',check:{question:'1 + 1?',options:['1','2','3'],answer:1}},legacy={adder:checkRevision(lesson.check)};
test('legacy progress migrates only when the question and option ordering are unchanged',()=>{
 const raw=JSON.stringify({visited:['adder','missing','adder'],answers:{adder:1,missing:0}});assert.deepEqual(restoreProgress(raw,[lesson],legacy),{visited:['adder'],answers:{adder:1}});
 assert.deepEqual(restoreProgress(raw,[{...lesson,check:{...lesson.check,options:['2','1','3'],answer:0}}],legacy).answers,{});
});
test('new progress retains revision and rejects a reinterpreted answer',()=>{
 const doc=serializeProgress({visited:['adder'],answers:{adder:1}},[lesson]);assert.equal(restoreProgress(doc,[lesson],legacy).answers.adder,1);
 assert.deepEqual(restoreProgress(doc,[{...lesson,check:{...lesson.check,question:'2 + 2?'}}],legacy).answers,{});
});
test('malformed answers and future versions do not become completed checks',()=>{
 for(const answer of ['1',-1,3,.5,null])assert.deepEqual(restoreProgress(JSON.stringify({answers:{adder:answer}}),[lesson],legacy).answers,{});
 assert.deepEqual(restoreProgress(JSON.stringify({schemaVersion:999,answers:{adder:1}}),[lesson],legacy).answers,{});assert.throws(()=>restoreProgress('broken',[lesson],legacy));
});
