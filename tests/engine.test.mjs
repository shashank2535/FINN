import test from 'node:test';
import assert from 'node:assert/strict';
import {tickerOf,percentChange,compareResults,classify,priceSignal,windowItems,dedupe,retrieve} from '../src/engine.mjs';
import {trustedSource,parseNseDate} from '../src/providers.mjs';
import {validateSynthesis,research,corpus} from '../src/research.mjs';
import {handle} from '../src/app.mjs';

test('NSE symbol normalization preserves ampersands and blocks path injection',()=>{
 assert.equal(tickerOf(' infy.ns '),'INFY');assert.equal(tickerOf('M&M'),'M&M');
 for(const bad of ['../etc','A?x=1','https://localhost','', 'A'.repeat(25)])assert.throws(()=>tickerOf(bad));
});
test('growth declines and denominator edge cases are explicit',()=>{
 assert.ok(Math.abs(percentChange(90,100)+10)<1e-9);
 assert.equal(percentChange(2,0),null);assert.equal(percentChange(2,-1),null);assert.equal(percentChange(undefined,3),null);
});
test('result bridge preserves missing EBITDA and calculates only like-for-like fields',()=>{
 const rows=compareResults({revenue:110,pat:12},{revenue:100,pat:10},{revenue:80,pat:8});
 assert.equal(rows.find(r=>r.metric==='ebitda').current,null);
 assert.equal(rows.find(r=>r.metric==='ebitda').qoq,null);
 assert.ok(Math.abs(rows[0].yoy-37.5)<1e-9);
});
test('newspaper publications and board notices are not treated as actual results',()=>{
 assert.equal(classify('Newspaper publication of financial results').score,8);
 assert.equal(classify('Board meeting intimation for quarterly results').score,8);
 assert.equal(classify('Consolidated financial results for Q2').category,'results');
 assert.equal(classify('Investor meeting schedule').category,'investor_meetings');
 assert.equal(classify('CFO resignation').category,'management_change');
});
test('volume baseline excludes the observation and needs twenty prior valid sessions',()=>{
 const bars=Array.from({length:21},(_,i)=>({date:String(i),close:100,volume:i===20?210:100}));
 const s=priceSignal(bars,{volume:2,price:4});assert.equal(s.multiple,2.1);assert.equal(s.baselineDays,20);assert.equal(s.alerts[0].type,'volume');
 assert.equal(priceSignal(bars.slice(1)).alerts.length,0);
});
test('price triggers are symmetric and thresholds are inclusive',()=>{
 assert.equal(priceSignal([{close:100,volume:10},{close:95,volume:10}],{price:5}).alerts.length,1);
 assert.equal(priceSignal([{close:100,volume:10},{close:105,volume:10}],{price:5}).alerts.length,1);
 assert.equal(priceSignal([]).change,null);
});
test('digest window includes the boundary and excludes future timestamps',()=>{
 const now='2026-10-27T10:00:00+05:30';
 const items=[{publishedAt:'2026-10-26T10:00:00+05:30'},{publishedAt:'2026-10-26T09:59:59+05:30'},{publishedAt:'2026-10-28T10:00:00+05:30'}];
 assert.equal(windowItems(items,24,now).length,1);
 assert.equal(parseNseDate('27-10-2026 10:30:00'),'2026-10-27T05:00:00.000Z');
 assert.equal(parseNseDate('27-Oct-2026 10:30:00'),'2026-10-27T05:00:00.000Z');
});
test('duplicate exchange records are collapsed',()=>assert.equal(dedupe([{id:'a'},{id:'a'},{id:'b'}]).length,2));
test('document allowlist rejects private networks, userinfo, suffix tricks and ports',()=>{
 assert.ok(trustedSource('https://www.bseindia.com/xml-data/a.pdf'));
 for(const u of ['http://www.bseindia.com/a','https://127.0.0.1','https://www.bseindia.com.evil.com/a','https://a@www.bseindia.com/a','https://www.bseindia.com:8443/a'])assert.equal(trustedSource(u),false);
});
test('retrieval is scoped to documents and keeps a page citation',()=>{
 const evidence=retrieve(corpus.filter(d=>d.ticker==='TCS'),'operating margin');assert.ok(evidence.length);assert.ok(evidence.every(c=>c.page>0&&c.citation&&c.url));
 assert.equal(retrieve(corpus,'zzzzunseenword').length,0);
});
test('model output rejects invented citations, quotations and numbers',()=>{
 const evidence=[{citation:'S1',text:'Revenue grew 5% and operating margin improved to 21%.'}];
 const good={text:'Revenue grew 5%.',quote:'Revenue grew 5% and operating margin',citation:'S1'};
 assert.equal(validateSynthesis({claims:[good]},evidence).length,1);
 for(const bad of [{...good,citation:'S99'},{...good,quote:'This quote is not in the document.'},{...good,text:'Revenue grew 99%.'}])assert.throws(()=>validateSynthesis({claims:[bad]},evidence));
 assert.throws(()=>validateSynthesis({claims:[{...good,text:'Operating margin was 2 percent.'}]},evidence));
});
test('offline research returns cited notes without calling a model',async()=>{
 const result=await research('INFY','revenue growth guidance');assert.equal(result.mode,'evidence');assert.ok(result.claims.length);assert.ok(result.evidence.every(e=>result.documents.some(d=>d.id===e.docId)));
});
test('corpus has reports and transcripts for four companies and bounded quotations',()=>{
 assert.equal(new Set(corpus.map(d=>d.id)).size,corpus.length);
 for(const t of ['INFY','TCS','HDFCBANK','RELIANCE'])for(const kind of ['annual_report','transcript'])assert.ok(corpus.some(d=>d.ticker===t&&d.kind===kind));
 for(const d of corpus){assert.match(d.sha256,/^[a-f0-9]{64}$/);assert.ok(d.chunks.reduce((n,c)=>n+c.text.split(/\s+/).length,0)<=25);assert.ok(trustedSource(d.url));}
});
test('replay API is coherent and validates ranges',async()=>{
 const r=await handle(new Request('http://localhost/api/digest'));const d=await r.json();assert.equal(r.status,200);assert.equal(d.holdings.length,18);assert.equal(d.holdings.reduce((s,h)=>s+h.weight,0),100);assert.ok(d.announcements.every(a=>a.sample));assert.equal(d.sampleResults.length,4);
 for(const query of ['hours=-1','hours=garbage','price=0','volume=100'])assert.equal((await handle(new Request('http://localhost/api/digest?'+query))).status,400);
});
test('live provider failure never substitutes replay data',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('network unavailable')};
 try{const d=await(await handle(new Request('http://localhost/api/digest?mode=live'))).json();assert.equal(d.mode,'live');assert.equal(d.announcements.length,0);assert.equal(d.coverage.prices,0);assert.ok(d.errors.length>=19);assert.ok(d.holdings.every(h=>h.signal.close===undefined));}finally{globalThis.fetch=original;}
});
test('cross-origin AI requests are blocked before processing',async()=>{
 const r=await handle(new Request('http://localhost/api/research',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}));assert.equal(r.status,403);
});
test('case study compares annual CC growth with annual CC guidance',async()=>{
 const d=await(await handle(new Request('http://localhost/api/case-study'))).json();assert.equal(d.ticker,'INFY');assert.equal(d.evidence.length,2);assert.ok(d.caseStudy);assert.ok(d.claims[1].text.includes('0.3 percentage points'));
});
