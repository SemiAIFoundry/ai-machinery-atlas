/** Authored synthetic teaching data. No real equipment observations or vendor specifications. */
export type SensorSample = { id: string; temperatureC: number; vibrationMmS: number; label: 0 | 1; note: string };
export type SensorDataset = { version: string; training: readonly SensorSample[]; evaluation: readonly SensorSample[] };
export const sensorDataset: SensorDataset = {
 version:'synthetic-sensor-data-1',
 training:[
  {id:'train-01',temperatureC:25,vibrationMmS:1,label:0,note:'Synthetic ordinary condition'},
  {id:'train-02',temperatureC:28,vibrationMmS:1.2,label:0,note:'Synthetic ordinary condition'},
  {id:'train-03',temperatureC:31,vibrationMmS:1.1,label:0,note:'Synthetic ordinary condition'},
  {id:'train-04',temperatureC:35,vibrationMmS:1.8,label:0,note:'Synthetic ordinary condition'},
  {id:'train-05',temperatureC:37,vibrationMmS:3,label:1,note:'Synthetic inspection-needed label'},
  {id:'train-06',temperatureC:40,vibrationMmS:3.6,label:1,note:'Synthetic inspection-needed label'},
  {id:'train-07',temperatureC:43,vibrationMmS:4,label:1,note:'Synthetic inspection-needed label'},
  {id:'train-08',temperatureC:46,vibrationMmS:4.4,label:1,note:'Synthetic inspection-needed label'},
 ],
 evaluation:[
  {id:'eval-01',temperatureC:27,vibrationMmS:1.1,label:0,note:'Held-out ordinary example'},
  {id:'eval-02',temperatureC:34,vibrationMmS:2.2,label:0,note:'Held-out near-boundary example'},
  {id:'eval-03',temperatureC:39,vibrationMmS:3.1,label:1,note:'Held-out inspection-needed example'},
  {id:'eval-04',temperatureC:44,vibrationMmS:3.8,label:1,note:'Held-out inspection-needed example'},
  {id:'eval-05',temperatureC:45,vibrationMmS:1,label:0,note:'Warm but low vibration: breaks the training correlation'},
  {id:'eval-06',temperatureC:29,vibrationMmS:3.8,label:1,note:'Cool but high vibration: breaks the training correlation'},
 ],
};
export type FactAttribute = 'sampleIntervalMs' | 'inputLimitV' | 'logRetentionDays';
export type ManualFact = { id: string; documentId: string; entity: string; attribute: FactAttribute; value: number; unit: string; statement: string };
export type ManualDocument = { id: string; title: string; text: string; facts: readonly ManualFact[] };
export type RetrievalQuestion = { id: string; question: string; expectedFactIds: readonly string[]; note: string };
export type RetrievalDataset = { version: string; documents: readonly ManualDocument[]; tuning: readonly RetrievalQuestion[]; evaluation: readonly RetrievalQuestion[] };
const fact=(documentId:string,entity:string,attribute:FactAttribute,value:number,unit:string,statement:string):ManualDocument=>({id:documentId,title:`Fictional ${entity} manual`,text:statement,facts:[{id:documentId+'-fact',documentId,entity,attribute,value,unit,statement}]});
export const retrievalDataset: RetrievalDataset = {
 version:'fictional-manual-data-1',
 documents:[
  fact('alder-interval','Alder','sampleIntervalMs',20,'ms','Alder sampling interval is 20 milliseconds.'),
  fact('alder-input','Alder','inputLimitV',3,'V','Alder input voltage limit is 3 volts.'),
  fact('alder-logs','Alder','logRetentionDays',7,'days','Alder retains logs for 7 days.'),
  fact('birch-interval','Birch','sampleIntervalMs',50,'ms','Birch sampling interval is 50 milliseconds.'),
  fact('birch-input','Birch','inputLimitV',5,'V','Birch input voltage limit is 5 volts.'),
  fact('birch-logs','Birch','logRetentionDays',14,'days','Birch retains logs for 14 days.'),
  fact('cedar-interval','Cedar','sampleIntervalMs',20,'ms','Cedar sampling interval is 20 milliseconds.'),
 ],
 tuning:[
  {id:'tune-01',question:'What is Alder sampling interval?',expectedFactIds:['alder-interval-fact'],note:'Tuning query; direct wording'},
  {id:'tune-02',question:'What is Birch input voltage limit?',expectedFactIds:['birch-input-fact'],note:'Tuning query; direct wording'},
  {id:'tune-03',question:'How many days does Alder retain logs?',expectedFactIds:['alder-logs-fact'],note:'Tuning query; retention wording'},
  {id:'tune-04',question:'What is Cedar sampling interval?',expectedFactIds:['cedar-interval-fact'],note:'Tuning query; direct wording'},
  {id:'tune-05',question:'What is Birch sampling interval?',expectedFactIds:['birch-interval-fact'],note:'Tuning query; direct wording'},
  {id:'tune-06',question:'What is Cedar log retention?',expectedFactIds:[],note:'Tuning query; this fact is absent from the corpus'},
 ],
 evaluation:[
  {id:'question-01',question:'What is Alder input voltage limit?',expectedFactIds:['alder-input-fact'],note:'Held-out query about an indexed fact'},
  {id:'question-02',question:'What is Birch sampling cadence?',expectedFactIds:['birch-interval-fact'],note:'Held-out partial paraphrase'},
  {id:'question-03',question:'Alder is the old bench; what is Birch sampling interval?',expectedFactIds:['birch-interval-fact'],note:'Two entities; first-entity parsing is deliberately inadequate'},
  {id:'question-04',question:'How many days does Birch retain logs?',expectedFactIds:['birch-logs-fact'],note:'Held-out retention query'},
  {id:'question-05',question:'What is Cedar input voltage limit?',expectedFactIds:[],note:'Unanswerable in this corpus; an input limit must not be invented'},
  {id:'question-06',question:'What is the reading cadence of Alder?',expectedFactIds:['alder-interval-fact'],note:'Lexical paraphrase beyond the simple attribute parser'},
  {id:'question-07',question:'Who manufactured Birch?',expectedFactIds:[],note:'Unanswerable in this corpus; a related citation would not answer it'},
 ],
};
