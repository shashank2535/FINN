// Pure business rules: financial arithmetic never depends on a language model.
export function tickerOf(value) {
  const ticker=String(value||'').trim().toUpperCase().replace(/\.NS$/,'');
  if(!/^[A-Z0-9&-]{1,24}$/.test(ticker)) throw new Error('Enter a valid NSE symbol, for example INFY or M&M.');
  return ticker;
}
export const percentChange=(value,base)=>Number.isFinite(value)&&Number.isFinite(base)&&base>0 ? (value/base-1)*100 : null;
export function compareResults(current,previous,yearAgo) {
  return ['revenue','ebitda','pbt','pat'].map(metric=>({metric,current:current?.[metric]??null,qoq:percentChange(current?.[metric],previous?.[metric]),yoy:percentChange(current?.[metric],yearAgo?.[metric])}));
}
const rules=[
  ['results',/financial results|quarterly results|audited results/i,90],
  ['management_change',/resign|appointment.*(chief|ceo|cfo)|chief.*appoint/i,85],
  ['M&A',/acquisit|merger|demerger|joint venture/i,88],
  ['litigation',/penalty|litigation|regulatory order|insolvency|fine imposed/i,86],
  ['fund_raise',/qip|rights issue|buyback|preferential|fund.rais/i,80],
  ['capex',/capacity|capital expenditure|new plant|capex/i,78],
  ['credit_rating',/rating.*(downgrad|upgrad)|downgrad|upgrad.*rating/i,83],
  ['pledging',/pledg/i,75], ['dividend',/dividend/i,48], ['bonus_split',/bonus|stock split/i,45],
  ['earnings_call',/transcript|earnings call|conference call/i,44],
  ['investor_meetings',/investor meet|analyst meet|schedule of.*meet/i,12],
  ['unclassified',/compliance|certificate|esop|newspaper|publication|recording|board meeting intimation/i,8]
];
export function classify(title) {
  // A meeting notice or publication notice is not the financial result itself.
  if(/newspaper|publication|board meeting intimation|notice of.*results/i.test(title))return {category:'unclassified',score:8,reason:'Routine notice, not the results filing.'};
  for(const [category,pattern,score] of rules)if(pattern.test(title))return {category,score,reason:`Matched ${category.replaceAll('_',' ')} disclosure; read the primary filing to confirm materiality.`};
  return {category:'unclassified',score:20,reason:'Unrecognized disclosure retained for review; no automatic materiality claim.'};
}
export function priceSignal(bars,{price=4,volume=2}={}) {
  const valid=bars.filter(b=>Number.isFinite(b.close)&&b.close>0&&Number.isFinite(b.volume)&&b.volume>=0);
  if(valid.length<2)return {change:null,multiple:null,alerts:[],baselineDays:0};
  const latest=valid.at(-1),prior=valid.slice(-21,-1);
  const average=prior.reduce((s,b)=>s+b.volume,0)/prior.length;
  const change=percentChange(latest.close,valid.at(-2).close),multiple=average>0?latest.volume/average:null;
  const alerts=[];
  if(Math.abs(change)>=price)alerts.push({type:'price',text:`${change.toFixed(1)}% daily move crosses your ±${price}% rule.`});
  if(prior.length>=20 && multiple!==null && multiple>=volume)alerts.push({type:'volume',text:`${multiple.toFixed(1)}× volume versus the prior 20 sessions crosses your ${volume}× rule.`});
  return {change,multiple,alerts,baselineDays:prior.length,date:latest.date,close:latest.close};
}
export function windowItems(items,hours,now) {
  const cutoff=new Date(now).getTime()-hours*3600000;
  return items.filter(i=>{const t=Date.parse(i.publishedAt);return t>=cutoff&&t<=Date.parse(now)});
}
export function dedupe(items) {
  const seen=new Set();return items.filter(i=>{const k=i.id||`${i.ticker}|${i.url}|${i.title}`;if(seen.has(k))return false;seen.add(k);return true;});
}
const synonyms={cash:['cash','operating','conversion','flow'],guidance:['guidance','expect','outlook','growth'],debt:['debt','borrowings','liabilities','leverage'],business:['business','segment','services','revenue'],margin:['margin','profit','operating'],risk:['risk','uncertain','challenge'],revenue:['revenue','growth','sales'],capex:['capex','capital','expenditure']};
export function retrieve(documents,question,limit=6) {
  const terms=new Set((question.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(t=>!['the','and','what','does','this','company','about','with','that','from','show'].includes(t)));
  for(const [key,values] of Object.entries(synonyms))if(terms.has(key))values.forEach(v=>terms.add(v));
  const candidates=[];
  for(const doc of documents)for(const chunk of doc.chunks){
    const lower=(chunk.text+' '+(chunk.note||'')).toLowerCase();let score=0;
    for(const term of terms)score+=Math.min(5,lower.split(term).length-1);
    if(score>0)candidates.push({...chunk,docId:doc.id,title:doc.title,url:doc.url,kind:doc.kind,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const picked=[];const used=new Set();
  // One passage per page per document avoids an answer made of overlapping chunks.
  for(const c of candidates){const key=c.docId+':'+c.page;if(used.has(key))continue;used.add(key);picked.push(c);if(picked.length===limit)break;}
  return picked.map((c,i)=>({...c,citation:`S${i+1}`}));
}
export function excerpt(text,question,max=340){
  const terms=question.toLowerCase().match(/[a-z]{4,}/g)||[];
  const sentences=text.split(/(?<=[.!?])\s+/).filter(s=>s.length>40&&s.length<800);
  sentences.sort((a,b)=>terms.filter(t=>b.toLowerCase().includes(t)).length-terms.filter(t=>a.toLowerCase().includes(t)).length);
  const s=sentences[0]||text;return s.length>max?s.slice(0,max)+'…':s;
}
