import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryOrganization,decodeMemoryAddress as decode,encodeMemoryAddress as encode,accessMemoryRow,memoryExplorerDefaults as defaults,validateMemoryExplorerInput} from '../src/lib/memory-interfaces.ts';

test('the declared organization closes bytes, words, cells and each address stride',()=>{
 const o=memoryOrganization(8);assert.equal(o.windowBytes,8*2**31);assert.equal(o.perDieWindowBytes,2**31);
 assert.equal(o.rowBytes,256*4);assert.deepEqual(o.fields.map(f=>f.strideBytes),[1,4,1024,16384,32768,65536,2**31]);
 const d=decode(o.windowBytes-1,7,8);assert.deepEqual(d.parts,{byteInWord:3,column:255,bank:15,pseudoChannel:1,channelInDie:1,row:32767,die:7});assert.equal(d.bitInWord,31);
});
test('addresses beyond 32 bits survive exact round trips, including a 12-die non-power-of-two population',()=>{
 for(const dies of[4,8,12,16]){
  const n=memoryOrganization(dies).windowBytes;let random=42;
  for(const a of [0,1,3,4,1023,1024,65535,65536,2**31-1,2**31,2**32+3,n-1])if(a<n)assert.equal(encode(decode(a,0,dies).parts,dies),a);
  for(let i=0;i<250;i++){random=(random*16807)%2147483647;const a=Math.floor(random/2147483647*n);assert.equal(encode(decode(a,7,dies).parts,dies),a);}
  assert.throws(()=>decode(n,0,dies));assert.throws(()=>encode({...decode(0,0,dies).parts,die:dies},dies));
 }
});
test('a bit selector changes the cell bit, never its byte address or physical mapping fields',()=>{
 const values=Array.from({length:8},(_,b)=>decode(0x123456789,b,8));assert.equal(new Set(values.map(v=>v.cellId)).size,8);
 for(const v of values){assert.deepEqual(v.parts,values[0].parts);assert.equal(v.byteAddress,0x123456789);assert.equal(v.bitInWord,8*v.parts.byteInWord+v.bitInByte);}
});
test('changing one address field leaves all other decoded fields invariant',()=>{
 const zero=decode(0,0,8).parts;
 for(const field of memoryOrganization(8).fields){const parts={...zero,[field.id]:field.count-1};assert.deepEqual(decode(encode(parts,8),0,8).parts,parts);}
});
test('row access distinguishes cold activation, row hits, row conflicts and independent bank state',()=>{
 const first=accessMemoryRow(0,8);assert.deepEqual(first.commands,['ACTIVATE','READ']);
 const hit=accessMemoryRow(4,8,first.openRows);assert.equal(hit.status,'row-hit');assert.deepEqual(hit.commands,['READ']);
 const other=accessMemoryRow(1024,8,hit.openRows);assert.equal(other.status,'closed-bank');assert.equal(Object.keys(other.openRows).length,2);
 const conflict=accessMemoryRow(65536,8,other.openRows);assert.deepEqual(conflict.commands,['PRECHARGE','ACTIVATE','READ']);assert.equal(conflict.openRows['d0/c0/p0/b0'],1);assert.equal(conflict.openRows['d0/c0/p0/b1'],0);
 assert.equal(first.openRows['d0/c0/p0/b0'],0);assert.throws(()=>accessMemoryRow(0,8,{'d00/c0/p0/b0':0}));
});
test('inputs reject aliases, incomplete documents, non-integers, nonfinite numbers and out-of-window addresses',()=>{
 assert.deepEqual(validateMemoryExplorerInput(defaults,8),defaults);
 for(const input of[null,[],{...defaults,extra:1},{...defaults,byteAddress:-1},{...defaults,byteAddress:2**34},{...defaults,bitInByte:8},{...defaults,byteValue:.5},{...defaults,padWidthUm:NaN},{...defaults,kgdEvidence:'passed'}])assert.throws(()=>validateMemoryExplorerInput(input,8));
 assert.throws(()=>decode(Number.MAX_SAFE_INTEGER+1,0,8));assert.throws(()=>decode(0,-1,8));assert.throws(()=>memoryOrganization(3));assert.throws(()=>encode({...decode(0,0,8).parts,unknown:1},8));
});

import {accessStackRow} from '../src/lib/memory-interfaces.ts';
test('equal bank addresses on different HBM stacks have independent open rows',()=>{
 const first=accessStackRow(0,8,0);assert.equal(first.status,'closed-bank');
 const second=accessStackRow(0,8,1,first.openStacks);assert.equal(second.status,'closed-bank');
 const returnToFirst=accessStackRow(0,8,0,second.openStacks);assert.equal(returnToFirst.status,'row-hit');
 const conflict=accessStackRow(65536,8,1,returnToFirst.openStacks);assert.equal(conflict.status,'row-conflict');
 assert.equal(accessStackRow(0,8,0,conflict.openStacks).status,'row-hit');
});
