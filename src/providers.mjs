import {getDocumentProxy} from 'unpdf';
import {tickerOf,classify,dedupe} from './engine.mjs';

// Bounded, best-effort isolate cache. Deliberately not described as durable storage.
const cache=new Map();const pending=new Map();
export async function cached(key,ttl,fn){
  const hit=cache.get(key);if(hit&&Date.now()<hit.expires)return hit.value;
  if(pending.has(key))return pending.get(key);
  const work=fn().then(value=>{if(cache.size>=48)cache.delete(cache.keys().next().value);cache.set(key,{expires:Date.now()+ttl,value});return value;}).finally(()=>pending.delete(key));
  pending.set(key,work);return work;
}
const sourceHosts=new Set(['www.bseindia.com','bseindia.com','nsearchives.nseindia.com','archives.nseindia.com','www.infosys.com','www.tcs.com','www.hdfcbank.com','www.ril.com']);
export function trustedSource(url){try{const u=new URL(url);return u.protocol==='https:'&&sourceHosts.has(u.hostname)&&!u.username&&!u.password&&!u.port;}catch{return false}}
export async function request(url,{max=22*1024*1024,headers={},trusted=false}={}){
  if(trusted&&!trustedSource(url))throw Error('Document URL is outside the primary-source allowlist.');
  let target=url;
  for(let i=0;i<4;i++){
    const r=await fetch(target,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*',...headers},redirect:'manual',signal:AbortSignal.timeout(22000)});
    if(r.status>=300&&r.status<400){const next=new URL(r.headers.get('location'),target).href;if(!trusted||!trustedSource(next))throw Error('Unapproved redirect blocked.');target=next;continue;}
    if(!r.ok)throw Error(`Provider returned HTTP ${r.status}.`);
    if(Number(r.headers.get('content-length'))>max)throw Error('Document exceeds the prototype size limit.');
    const reader=r.body.getReader(),parts=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Document exceeds the prototype size limit.');}parts.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.length;}
    return {body,headers:r.headers};
  }
  throw Error('Too many redirects.');
}
const decode=body=>new TextDecoder().decode(body);
export async function prices(ticker){return cached(`price:${ticker}`,900000,async()=>{
  const {body}=await request(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tickerOf(ticker))}.NS?range=3mo&interval=1d`);
  const data=JSON.parse(decode(body));const result=data.chart?.result?.[0];if(!result)throw Error('Price history unavailable.');
  const q=result.indicators.quote[0];const ist=new Date(Date.now()+19800000);const today=ist.toISOString().slice(0,10),hour=ist.getUTCHours();
  const bars=result.timestamp.map((ts,i)=>({date:new Date(ts*1000+19800000).toISOString().slice(0,10),close:q.close[i],volume:q.volume[i]})).filter(b=>b.close!==null&&b.volume!==null&&(b.date<today||hour>=16));
  return {ticker,bars,provider:'Yahoo Finance',source:`https://finance.yahoo.com/quote/${ticker}.NS/history/`,fetchedAt:new Date().toISOString()};
});}
export function parseNseDate(value){
  const match=String(value||'').match(/(\d{2})[-/](\d{2})[-/](\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if(match)return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:${match[6]||'00'}+05:30`).toISOString();
  const named=String(value||'').match(/(\d{2})-([A-Za-z]{3})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if(named){const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(named[2].toLowerCase())+1;if(!month)return null;return new Date(`${named[3]}-${String(month).padStart(2,'0')}-${named[1]}T${named[4]}:${named[5]}:${named[6]||'00'}+05:30`).toISOString();}
  const d=new Date(value);return Number.isFinite(+d)?d.toISOString():null;
}
export async function filings(symbols){return cached('filings:'+symbols.join(','),300000,async()=>{
  const home=await request('https://www.nseindia.com/');const cookies=(home.headers.getSetCookie?.()||[]).map(c=>c.split(';')[0]).join('; ');
  const exchangeDate=t=>{const d=new Date(t+19800000);return [String(d.getUTCDate()).padStart(2,'0'),String(d.getUTCMonth()+1).padStart(2,'0'),d.getUTCFullYear()].join('-')};
  const from=exchangeDate(Date.now()-8*86400000),to=exchangeDate(Date.now());
  const {body}=await request(`https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=${from}&to_date=${to}`,{headers:{Referer:'https://www.nseindia.com/companies-listing/corporate-filings-announcements',Cookie:cookies}});
  const records=JSON.parse(decode(body));if(!Array.isArray(records))throw Error('Unexpected NSE response.');
  return dedupe(records.filter(r=>symbols.includes(r.symbol)).map(r=>{
    const title=[r.desc,r.attchmntText].filter(Boolean).join(' · '),classification=classify(title);
    return {id:r.seq_id?String(r.seq_id):`${r.symbol}|${r.attchmntFile}|${r.an_dt}`,ticker:r.symbol,title,...classification,summary:title,publishedAt:parseNseDate(r.an_dt||r.dt),url:trustedSource(r.attchmntFile)?r.attchmntFile:null,sample:false};
  })).filter(r=>r.publishedAt);
});}
export async function discover(ticker){return cached('discover:'+ticker,3600000,async()=>{
  const url=`https://www.screener.in/company/${encodeURIComponent(tickerOf(ticker))}/consolidated/`;
  const {body}=await request(url,{max:2*1024*1024});const html=decode(body);const links=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const title=m[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();const href=m[1].replaceAll('&amp;','&');
    if(trustedSource(href)&&(/Annual Report 20\d\d/i.test(title)||title==='Transcript'))links.push({url:href,title,kind:title==='Transcript'?'transcript':'annual_report'});
  }
  return {directory:url,links};
});}
export async function loadPrimary(ticker){return cached('docs:'+ticker,24*3600000,async()=>{
  const {links,directory}=await discover(ticker);const selected=['annual_report','transcript'].map(kind=>links.find(l=>l.kind===kind)).filter(Boolean);
  const docs=[],errors=[];
  // Sequential extraction bounds peak memory, particularly in a 128 MB Worker isolate.
  for(const link of selected){try{
    const {body}=await request(link.url,{trusted:true});
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',body))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const pdf=await getDocumentProxy(body);const chunks=[];const pages=Math.min(pdf.numPages,100);
    for(let n=1;n<=pages;n++){
      const page=await pdf.getPage(n);const content=await page.getTextContent();const text=content.items.map(x=>x.str||'').join(' ').replace(/\s+/g,' ').trim();
      if(text.length>80)for(let p=0;p<text.length;p+=1400)chunks.push({page:n,text:text.slice(Math.max(0,p-150),p+1550)});
      page.cleanup();
    }
    const totalPages=pdf.numPages;await pdf.destroy();
    if(!chunks.length)throw Error('No extractable text. Scanned PDFs need OCR, which this prototype does not perform.');
    docs.push({id:digest.slice(0,14),ticker,title:link.title==='Transcript'?'Latest discovered earnings-call transcript':link.title,kind:link.kind,url:link.url,sha256:digest,pages:totalPages,indexedPages:pages,chunks,retrievedAt:new Date().toISOString()});
    if(totalPages>pages)errors.push(`${link.title}: indexed the first ${pages} of ${totalPages} pages to bound memory.`);
  }catch(e){errors.push(`${link.title}: ${e.message}`);}}
  if(!selected.length)errors.push('No allowlisted primary report or transcript links found in the directory.');
  return {documents:docs,errors,directory};
});}
