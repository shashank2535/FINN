"""Build a compact, reviewer-readable snapshot from a locally collected full index.
Full source text is NOT distributed. Each document contributes one short quote,
plus a factual, authored note; full reports stay at their primary-source URLs.
The source SHA-256 always identifies the original PDF, not the note.
"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'.cache'/'full-corpus.json'
if not source.exists(): source=ROOT.parent.parent/'work'/'full-corpus.json'
notes={
 '5f8c7daa665148':('Q2 FY26 earnings call · October 2025',3,'Our revenues for the quarter grew','For Q2 FY26, management reported constant-currency revenue growth of 2.2% sequentially and 2.9% year on year, with a 21% operating margin. Full-year constant-currency growth guidance moved to 2–3%; operating margin guidance remained 20–22%. These are management statements, and the annual forecast must not be compared directly with a single quarter’s growth.'),
 'bdc83ce116f133':('Q1 FY27 earnings call · July 2026',6,'we are changing our revenue growth guidance','For FY27, management revised expected constant-currency annual revenue growth to 1.5–3%. Operating margin guidance stayed at 20–22%. This is forward guidance, not a realized annual outcome. A later annual report is required before grading delivery against this range.'),
 'b868bfd05665cb':('Q1 FY26 earnings call · July 2025',3,'Our revenues grew 2.6%','Management described Q1 FY26 constant-currency revenue growth of 2.6% sequentially and 3.8% year on year. FY26 annual growth guidance increased from 0–3% to 1–3%; the operating margin target stayed at 20–22%. The upper end of the annual growth range did not rise.'),
 'eab53c5893f93f':('Q3 FY25 earnings call · January 2025',4,'we are revising our revenue growth guidance','In January 2025, management raised its full-year FY25 constant-currency revenue growth target to 4.5–5%. The operating margin target remained 20–22%. This final annual revenue-growth forecast is the appropriate promise to compare with the FY25 annual outcome, not with quarterly reported-currency growth.'),
 'd283ccfcecd166':('Q4 FY25 earnings call · April 2025',4,'4.2% growth, cons tant currency terms','For FY25, management reported 4.2% constant-currency revenue growth, a 21.1% operating margin, $4.1 billion free cash flow and $11.6 billion in large deals. The growth figure describes the completed financial year. It can be compared with the final annual guidance from January, while the free cash flow figure is explicitly in US dollars.'),
 '13033ccd2b71c7':('Q2 FY27 earnings call · October 2026',3,'TCV for the quarter was US$9.6 billion','Management reported a Q2 FY27 total contract value of US$9.6 billion, excluding the Porsche and Best Buy deals. BFSI constant-currency revenue grew 2.5% sequentially; manufacturing and technology/services each grew 3.1%. Contract value is a bookings measure and must not be represented as recognized revenue.'),
 '07c34082f55e8a':('Q2 FY27 earnings call · October 2026',3,'Deposits increased 18.8%','Management reported 18.8% year-on-year deposit growth, including a four-percentage-point contribution from the special FCNR(B) window. Overall CASA growth was about 10.8%. Reported deposit growth therefore includes an identified special contribution; it should not all be described as ordinary underlying growth.'),
 '6224d11244d3f4':('Annual report FY25',11,'Total revenues in fiscal 2025','The FY25 annual report records revenue of ₹162,990 crore, 323,578 employees and 1,869 active clients. The capital discussion describes a liquid, debt-free balance sheet. Debt-free should not be read as having no liabilities. Revenue here is in reported Indian rupees; it is a different basis from constant-currency growth guidance.'),
 '15b62bccf89efd':('Q1 FY27 results discussion · July 2026',3,'topline up 25%','The results discussion for the June 2026 quarter describes approximately 25% top-line growth, with oil prices a major contributor. Management also points to roughly 12% top-line growth in Jio and retail. The O2C discussion highlights stronger spreads alongside higher crude procurement differentials. Commodity price effects matter when interpreting consolidated revenue growth.'),
 '889ee382d055a5':('Annual report FY26',11,'Total revenues in fiscal 2026','For FY26, the report lists revenue of ₹178,650 crore, 328,594 employees and 1,965 active clients. Infosys describes its business as AI-focused consulting and technology services. Reported rupee revenue is available in this note; the snapshot does not contain a complete segment mix, cash-flow statement or guidance-to-actual bridge.'),
 '6fc365c08e7be9':('Annual report FY26',41,'The Reliance Integrated Annual Report','The annual-report package contains the integrated report, governance material, related-party proposals and financial statements. The business overview distinguishes retail, digital services, oil-to-chemicals, oil and gas, and media. Segment revenue and EBITDA use different economic drivers; the snapshot deliberately avoids summing segment figures without checking eliminations. The package also includes AGM material before the report.'),
 '92de3c75b6fc05':('Annual report FY26',83,'Net Interest Income:','The FY26 value-creation page lists net interest income of ₹128,686 crore, profit after tax of ₹74,671.30 crore, return on equity of 14.3% and a capital adequacy ratio of 19.7%. A bank’s deposits and borrowings are operating funding; an industrial-company debt/EBITDA template is not a useful substitute for banking capital and asset-quality analysis.'),
 'd0bdc7fe1ae741':('Annual report FY26',6,'TCS generated consolidated revenues','The FY26 overview reports consolidated revenue of about US$30 billion and an operating margin of 25%. TCS describes technology services with delivery across many countries. The snapshot contains the corporate overview and headline operating performance; it does not provide a full revenue segment reconciliation or cash conversion calculation.')
}
full=json.loads(source.read_text(encoding='utf8'));out=[];seen=set()
for doc in full:
 if doc['id'] not in notes:continue
 if doc['id'] in seen:continue
 seen.add(doc['id'])
 title,page,needle,note=notes[doc['id']]
 chunk=next(c for c in doc['chunks'] if c['page']==page and needle in c['text'])
 tail=chunk['text'][chunk['text'].index(needle):]
 quote=' '.join(tail.split()[:20])
 assert quote in chunk['text'],(doc['id'],'quotation must be verbatim')
 assert len(note.split())+len(quote.split())<200
 doc={**doc,'title':title,'snapshot':'Curated factual note plus short verified quotation; not the complete report.',
      'chunks':[{'page':page,'text':quote,'note':note}]}
 out.append(doc)
assert len(out)==13
(ROOT/'data'/'primary.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print('Curated',len(out),'documents; each quote verified against its original PDF text')
