import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileStore,filterEvents,csvFromRows} from '../public/profile-store.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
test('activity and name survive reload; saved filing details outlive a digest window',()=>{
 const storage=memory(),store=createProfileStore(storage,()=> '2026-11-03T10:00:00.000Z');store.setName('  Alex  ');store.record('research',{ticker:'INFY',question:'Cash flow',title:'Researched INFY'});store.rememberFiling({id:'f1',ticker:'INFY',title:'Results',sample:true,publishedAt:'2026-10-27T10:00:00Z'});
 const restored=createProfileStore(storage).get();assert.equal(restored.name,'Alex');assert.equal(restored.events[0].ticker,'INFY');assert.equal(restored.filings.f1.title,'Results');assert.ok(restored.filings.f1.savedAt);
});
test('a fresh profile is empty; malformed or unavailable browser storage is recoverable',()=>{
 assert.equal(createProfileStore(memory()).get().events.length,0);
 const broken={getItem:()=>'{not json',setItem:()=>{throw Error('quota')}};const store=createProfileStore(broken);assert.doesNotThrow(()=>store.record('chart_view',{ticker:'INFY'}));assert.equal(store.get().events.length,1);
});
test('activity is bounded and report filters respect date and type',()=>{
 const store=createProfileStore(memory(),()=> '2026-11-03T10:00:00.000Z');for(let i=0;i<230;i++)store.record('research',{title:'Query '+i});assert.equal(store.get().events.length,200);assert.equal(store.get().events[0].title,'Query 229');
 const events=[{type:'research',at:'2026-11-03T10:00:00Z'},{type:'save',at:'2026-11-02T10:00:00Z'},{type:'research',at:'2026-10-01T10:00:00Z'}];assert.equal(filterEvents(events,{type:'research',days:7,now:Date.parse('2026-11-03T11:00:00Z')}).length,1);
});
test('CSV reports escape cells and prevent spreadsheet formula injection',()=>{
 const csv=csvFromRows(['Question','Count'],[['=HYPERLINK("evil")',2],['Cash, debt\nand "growth"',-5]]);assert.ok(csv.includes("'="));assert.ok(csv.includes('"-5"'));assert.ok(csv.includes('"Cash, debt\nand ""growth"""'));
});
