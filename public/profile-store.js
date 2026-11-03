// Browser-local activity only. This does not identify or impersonate the signed-in account.
const KEY='finn-profile-v1',LIMIT=200;
const clean=(value,max=500)=>String(value??'').slice(0,max);
const validDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export function createProfileStore(storage,now=()=>new Date().toISOString()){
 let value={name:'',events:[],filings:{}};
 try{const saved=JSON.parse(storage.getItem(KEY)||'null');if(saved&&typeof saved==='object')value={name:clean(saved.name,48),events:Array.isArray(saved.events)?saved.events.filter(e=>e&&validDate(e.at)&&typeof e.id==='string'&&typeof e.type==='string').slice(0,LIMIT):[],filings:saved.filings&&typeof saved.filings==='object'&&!Array.isArray(saved.filings)?saved.filings:{}};}catch{}
 const write=()=>{try{storage.setItem(KEY,JSON.stringify(value));return true}catch{return false}};
 return {
  get:()=>JSON.parse(JSON.stringify(value)),
  setName(name){value.name=clean(name,48).trim();write();return value.name;},
  record(type,fields={}){
   const at=now();const event={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`,type:clean(type,40),at,title:clean(fields.title,160),detail:clean(fields.detail),ticker:clean(fields.ticker,24),question:clean(fields.question,600),target:clean(fields.target,180),mode:clean(fields.mode,40),status:clean(fields.status,40)};
   value.events=[event,...value.events].slice(0,LIMIT);write();return event;
  },
  rememberFiling(item){
   if(!item?.id)return;
   let url=null;try{const u=new URL(item.url);if(u.protocol==='https:'&&!u.username&&!u.password)url=u.href;}catch{}
   const key=clean(item.id,180);value.filings[key]={id:key,title:clean(item.title,300),ticker:clean(item.ticker,24),category:clean(item.category,40),url,publishedAt:validDate(item.publishedAt)?item.publishedAt:null,sample:item.sample===true,savedAt:now()};
   const keys=Object.keys(value.filings);if(keys.length>LIMIT)delete value.filings[keys[0]];write();
  }
 };
}
export function filterEvents(events,{type='all',days=0,now=Date.now()}={}){
 const groups={research:['research'],filings:['filing_view','read','unread','save','unsave'],alerts:['rules_updated','notification_preferences_updated'],downloads:['report_downloaded','brief_downloaded'],charts:['chart_view']};
 return events.filter(e=>(type==='all'||(groups[type]||[type]).includes(e.type))&&validDate(e.at)&&(!days||Date.parse(e.at)>=now-days*86400000));
}
export function csvFromRows(headers,rows){
 const cell=value=>{let text=String(value??'');if(typeof value!=='number'&&/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
}
