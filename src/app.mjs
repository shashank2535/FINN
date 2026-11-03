import {holdings,announcements,replayNow,sampleResults} from '../data/demo.mjs';
import {tickerOf,priceSignal,windowItems,compareResults} from './engine.mjs';
import {prices,filings} from './providers.mjs';
import {research,corpus,documentMetadata} from './research.mjs';

const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...security,'Content-Type':'application/json','Cache-Control':'no-store'}});
const rate=new Map();
function limited(request){const ip=request.headers.get('CF-Connecting-IP')||'local';const minute=Math.floor(Date.now()/60000);const key=ip+minute;if(rate.size>300)rate.clear();const n=(rate.get(key)||0)+1;rate.set(key,n);return n>18;}
async function concurrentMap(values,fn){const result=[];for(let i=0;i<values.length;i+=3)result.push(...await Promise.all(values.slice(i,i+3).map(fn)));return result;}
export async function handle(request,env={},assets={}){
  const u=new URL(request.url);
  try{
    if(u.pathname==='/api/health')return json({ok:true,modelConfigured:!!env.OPENAI_API_KEY,documents:corpus.length,tickers:[...new Set(corpus.map(d=>d.ticker))]});
    if(u.pathname==='/api/sources')return json(documentMetadata(corpus));
    if(u.pathname==='/api/case-study'){
      const promise=corpus.find(d=>d.id==='eab53c5893f93f'),outcome=corpus.find(d=>d.id==='d283ccfcecd166');
      const evidence=[promise,outcome].map((d,i)=>({...d.chunks[0],citation:`S${i+1}`,title:d.title,url:d.url,docId:d.id}));
      return json({ticker:'INFY',question:'Did Infosys meet its final FY25 revenue-growth guidance?',mode:'evidence',caseStudy:true,
        origin:'Historical, curated primary-source comparison',asOf:outcome.retrievedAt,
        documents:documentMetadata([promise,outcome]),evidence,errors:[],
        claims:[{text:'In January 2025, management’s final FY25 revenue-growth guidance was 4.5–5% in constant currency.',citation:'S1'},
          {text:'The April 2025 call reported FY25 constant-currency growth of 4.2%. That is 0.3 percentage points below the final guidance floor. Both figures cover the same year and use the same currency basis.',citation:'S2'},
          {text:'Interpretation: growth missed the final range. That observation alone does not establish a persistent forecasting pattern. The reported 21.1% operating margin was within the 20–22% margin target.',citation:'S2'}],
        limits:['Historical FY25 example, not a claim about current trading. This is one annual promise/outcome check, not a last-four-quarters scorecard.',
          'The growth gap is calculated as 4.2 − 4.5 = −0.3 percentage points. This is not a relative percent change.',
          'The margin interpretation uses the target in S1 and the realized margin in S2. No buy or sell recommendation is made.']});
    }
    if(u.pathname==='/api/digest'){
      const live=u.searchParams.get('mode')==='live',hours=Number(u.searchParams.get('hours')||24),price=Number(u.searchParams.get('price')||4),volume=Number(u.searchParams.get('volume')||2);
      if(!Number.isFinite(hours)||hours<1||hours>168||!Number.isFinite(price)||price<.1||price>30||!Number.isFinite(volume)||volume<1||volume>10)return json({error:'Choose 1–168 hours, 0.1–30% price, and 1–10× volume.'},400);
      if(live&&limited(request))return json({error:'Too many refreshes. Wait a minute.'},429);
      const errors=[];let items=announcements,stocks=holdings,now=replayNow;
      if(live){
        now=new Date().toISOString();
        // Independent failures remain explicit. Never silently substitute replay data in live mode.
        const [stockResult,filingResult]=await Promise.all([
          concurrentMap(holdings,async h=>{try{return {...h,...await prices(h.ticker)};}catch(e){errors.push(`${h.ticker} price: ${e.message}`);return {...h,bars:[],error:e.message};}}),
          filings(holdings.map(h=>h.ticker)).then(value=>({value})).catch(e=>({error:e.message}))
        ]);
        stocks=stockResult;items=filingResult.value||[];
        if(filingResult.error)errors.push(`NSE announcements: ${filingResult.error}`);
      }
      stocks=stocks.map(({bars,...h})=>({...h,history:bars.slice(-30).filter(b=>Number.isFinite(b.close)).map(({date,close})=>({date,close})),signal:priceSignal(bars,{price,volume})}));
      const filtered=windowItems(items,hours,now).sort((a,b)=>b.score-a.score||Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
      return json({mode:live?'live':'replay',asOf:now,hours,holdings:stocks,announcements:filtered,errors,
        coverage:{prices:stocks.filter(h=>h.signal.close).length,total:holdings.length,filings:live?(errors.some(e=>e.startsWith('NSE'))?'unavailable':'NSE feed returned; provider retention may be shorter than your selected window'):'Illustrative scenarios'},
        sampleResults:live?null:compareResults(sampleResults.current,sampleResults.previous,sampleResults.yearAgo)});
    }
    if(u.pathname==='/api/research'&&request.method==='POST'){
      const origin=request.headers.get('Origin');if(origin&&origin!==u.origin)return json({error:'Cross-origin research requests are blocked.'},403);
      if(limited(request))return json({error:'Research request limit reached. Try again in a minute.'},429);
      if(Number(request.headers.get('Content-Length'))>4096)return json({error:'Request too large.'},413);
      const text=await request.text();if(text.length>4096)return json({error:'Request too large.'},413);
      const body=JSON.parse(text);const ticker=tickerOf(body.ticker);
      if(typeof body.question!=='string'||body.question.length>600)return json({error:'Use a question of up to 600 characters.'},400);
      return json(await research(ticker,body.question,env,body.fresh===true));
    }
    if(u.pathname.startsWith('/api/'))return json({error:'Endpoint not found.'},404);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    const path=u.pathname==='/'?'/index.html':u.pathname;
    if(assets[path])return new Response(request.method==='HEAD'?null:assets[path].body,{headers:{...security,'Content-Type':assets[path].type,'Cache-Control':'no-cache'}});
    return new Response('Not found',{status:404,headers:security});
  }catch(e){return json({error:e.message||'Request failed.'},/valid NSE|JSON/.test(e.message)?400:502);}
}
