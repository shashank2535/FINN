export const holdings=[
 ['INFY','Infosys','Technology',8],['TCS','Tata Consultancy Services','Technology',8],['HDFCBANK','HDFC Bank','Banking',9],['ICICIBANK','ICICI Bank','Banking',7],['RELIANCE','Reliance Industries','Diversified',9],['LT','Larsen & Toubro','Industrials',7],['ITC','ITC','Consumer',5],['HINDUNILVR','Hindustan Unilever','Consumer',5],['SUNPHARMA','Sun Pharma','Healthcare',5],['DRREDDY','Dr. Reddy’s','Healthcare',4],['MARUTI','Maruti Suzuki','Auto',6],['TITAN','Titan','Consumer',5],['TATAPOWER','Tata Power','Utilities',4],['ULTRACEMCO','UltraTech Cement','Materials',5],['PERSISTENT','Persistent Systems','Technology',4],['DIXON','Dixon Technologies','Electronics',3],['APLAPOLLO','APL Apollo Tubes','Materials',3],['KEI','KEI Industries','Industrials',3]
].map(([ticker,name,sector,weight],i)=>({ticker,name,sector,weight,bars:Array.from({length:22},(_,j)=>({date:`2026-10-${String(j+1).padStart(2,'0')}`,close:1000+i*137+j*3,volume:1000000+i*70000})).map((b,j)=>j===21?{...b,date:'2026-10-26',close:b.close*(i===15?1.057:i===2?.952:1.006),volume:b.volume*(i===15?3.2:i===2?2.4:1.1)}:b)}));
export const replayNow='2026-10-27T10:00:00+05:30';
const examples=[
 ['INFY','Quarterly results: growth returns, margins need a closer look','results',94,'Revenue growth and margin direction deserve a read together. Open the illustrative result bridge before starting research.',2],
 ['LT','New capacity investment approved by the board','capex',83,'A capital commitment changes future cash requirements. Check timing, funding and expected utilization.',4],
 ['HDFCBANK','Chief financial officer resignation announced','management_change',87,'A senior finance transition warrants attention. The replay contains no verified biography; review the filing before drawing a conclusion.',6],
 ['RELIANCE','Acquisition of a controlling stake proposed','M&A',89,'Capital allocation is the question: purchase price, conditions and integration risk need verification.',10],
 ['TCS','Earnings-call transcript published','earnings_call',44,'New management commentary is available for source-based research.',16],
 ['ITC','Newspaper publication of financial results','unclassified',8,'Routine publication notice; the underlying results should carry the analysis.',19],
 ['MARUTI','Investor meeting schedule','investor_meetings',12,'No operating disclosure in this notice.',20],
 ['SUNPHARMA','Quarterly compliance certificate','unclassified',8,'Compliance paperwork retained for completeness.',22],
 ['TITAN','ESOP allotment disclosure','unclassified',8,'Routine allotment notice.',28],
 ['KEI','Credit rating reaffirmed','credit_rating',36,'Reaffirmation retained; no downgrade signal.',49]
];
export const announcements=examples.map(([ticker,title,category,score,summary,hours],i)=>({id:`replay-${i}`,ticker,title,category,score,summary,publishedAt:new Date(Date.parse(replayNow)-hours*3600000).toISOString(),url:null,reason:score>=75?'Illustrative material event, ranked above routine paperwork.':'Illustrative routine disclosure retained in the archive.',sample:true}));
export const sampleResults={current:{revenue:42000,ebitda:9500,pbt:8800,pat:6600},previous:{revenue:40500,ebitda:9600,pbt:8900,pat:6700},yearAgo:{revenue:39000,ebitda:8800,pbt:8100,pat:6100}};
