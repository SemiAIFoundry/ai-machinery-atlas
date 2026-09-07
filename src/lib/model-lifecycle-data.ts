/** Authored synthetic corpus. Split membership precedes every training operation. */
export const lifecycleDataVersion='symbol-dialogue-1';
export const lifecycleTokenizerVersion='fixed-whitespace-9-1';
export const lifecycleVocabulary=['<bos>','a','b','u','v','ask','<answer>','<eos>','<unused>'] as const;
export type LifecycleSplit='train'|'development'|'final';
export type LifecycleDomain='copy'|'swap';
export type LifecycleExample={id:string;familyId:string;split:LifecycleSplit;domain:LifecycleDomain;sourceId:string;text:string;tokens:number[];answerPosition:number;answer:number;mask:number[]};
export const lifecycleCorpusOrigin={sourceId:'authored-symbol-dialogues',actorType:'agent',actor:'/root/curriculum_assessment',authoredOn:'2026-09-07',rights:'Original synthetic examples authored for this teaching model; no external documents or personal data.',rule:'Copy returns the first symbol; swap returns its opposite. The two domains deliberately conflict on the same prompt. Replay therefore exposes a real tradeoff, not a universal forgetting cure.',splitRule:'Train uses homogeneous filler strings; development uses mixed strings u-v, v-u, u-u-v, v-v-u; final uses u-v-u and v-u-v. Symbol + filler family is disjoint across splits. The same family appears in both domains with deliberately different labels.',tokenizer:'Fixed whitespace vocabulary; no BPE training is claimed. Special-token identities, sequence boundaries and target shifting are explicit.',sealing:'Procedural teaching seal only. All synthetic data are inspectable in the source; do not claim cryptographic secrecy or an independent benchmark after viewing it.'};
const fillers:Record<LifecycleSplit,string[]>={train:['u','v','u u','v v','u u u','v v v'],development:['u v','v u','u u v','v v u'],final:['u v u','v u v']};
export function encodeLifecycleText(text:string){const words=text.trim().split(/\s+/);return words.map(word=>{const id=lifecycleVocabulary.indexOf(word as typeof lifecycleVocabulary[number]);if(id<0)throw Error(`Unknown token: ${word}`);return id;});}
export function lifecycleExamples(split:LifecycleSplit,domain:LifecycleDomain):LifecycleExample[]{
 if(!Object.hasOwn(fillers,split)||!['copy','swap'].includes(domain))throw Error('Unknown corpus slice.');
 return ['a','b'].flatMap(symbol=>fillers[split].map(filler=>{const answer=domain==='copy'?symbol:symbol==='a'?'b':'a',text=`<bos> ${symbol} ${filler} ask <answer> ${answer} <eos>`,tokens=encodeLifecycleText(text),answerPosition=tokens.length-3,familyId=`${symbol}-${filler.replaceAll(' ','')}`;return{id:`${split}-${domain}-${familyId}`,familyId,split,domain,sourceId:lifecycleCorpusOrigin.sourceId,text,tokens,answerPosition,answer:tokens[tokens.length-2],mask:tokens.slice(1).map((_,i)=>i>=answerPosition?1:0)};}));
}
