"""One-time, reproducible corpus collection. Runtime app does not require Python.
pip install pypdf; python scripts/collect_sources.py
Screener is used ONLY as a directory. No Screener financial tables or summaries enter research.
"""
import concurrent.futures, hashlib, io, json, re, time, urllib.request
from html.parser import HTMLParser
from pathlib import Path
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
HEADERS={'User-Agent':'Mozilla/5.0 (FINN educational research prototype)'}
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.items=[]; self.current=None
    def handle_starttag(self,tag,attrs):
        if tag=='a': self.current=[dict(attrs).get('href',''),'']
    def handle_data(self,data):
        if self.current: self.current[1]+=data
    def handle_endtag(self,tag):
        if tag=='a' and self.current: self.items.append(self.current);self.current=None
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=50) as r:
        return r.read()
def discover(ticker):
    page=get(f'https://www.screener.in/company/{ticker}/consolidated/').decode()
    parser=Links(); parser.feed(page)
    annual=[(u,t.strip()) for u,t in parser.items if re.search(r'Annual Report 202[56]',t)]
    calls=[(u,t.strip()) for u,t in parser.items if t.strip()=='Transcript']
    return (annual[:1]+calls[:1]+(annual[1:2]+calls[4:8] if ticker=='INFY' else []))
def extract(ticker,url,title):
    try:
        body=get(url); r=PdfReader(io.BytesIO(body)); chunks=[]
        for i,p in enumerate(r.pages):
            text=re.sub(r'\s+',' ',p.extract_text() or '').strip()
            if len(text)<80: continue
            # Preserve page identity, with overlap. Select relevant pages, never generated text.
            score=len(re.findall(r'revenue|cash flow|guidance|margin|business|segment|capital|debt|outlook|risk',text,re.I))
            if len(r.pages)>70 and score<4: continue
            for offset in range(0,len(text),1400):
                part=text[max(0,offset-150):offset+1550]
                if len(part)>80: chunks.append({'page':i+1,'text':part,'score':score})
        chunks=sorted(chunks,key=lambda c:c['score'],reverse=True)[:350]
        chunks.sort(key=lambda c:c['page'])
        for c in chunks: c.pop('score',None)
        return {'id':hashlib.sha256(body).hexdigest()[:14],'ticker':ticker,'title':title,
            'kind':'transcript' if 'call' in title.lower() or 'transcript' in title.lower() else 'annual_report',
            'url':url,'retrievedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
            'sha256':hashlib.sha256(body).hexdigest(),'pages':len(r.pages),'chunks':chunks}
    except Exception as e: print('FAILED',ticker,title,str(e),flush=True);return None
def main():
    jobs=[]
    for ticker in ['INFY','TCS','HDFCBANK','RELIANCE']:
        try:
            for u,t in discover(ticker):jobs.append((ticker,u,('Earnings call transcript' if t=='Transcript' else 'Annual report '+t)))
        except Exception as e: print('DISCOVERY FAILED',ticker,e)
    base='https://www.infosys.com/investors/reports-filings/quarterly-results/2024-2025'
    for q in range(1,5):jobs.append(('INFY',f'{base}/q{q}/documents/transcripts/earningscall.pdf',f'Q{q} FY25 earnings call'))
    jobs.append(('INFY','https://www.bseindia.com/xml-data/corpfiling/AttachHis/4527f4d2-dac4-4528-a1dc-5070fd9e140d.pdf','Annual report FY25'))
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures=[pool.submit(extract,*job) for job in jobs]
        for f in concurrent.futures.as_completed(futures):
            doc=f.result()
            if doc: results.append(doc);print('OK',doc['ticker'],doc['title'],doc['pages'],len(doc['chunks']),flush=True)
    (ROOT/'.cache').mkdir(exist_ok=True)
    (ROOT/'.cache'/'full-corpus.json').write_text(json.dumps(results,ensure_ascii=False),encoding='utf8')
    print('Saved',len(results),'primary documents')
if __name__=='__main__':main()
