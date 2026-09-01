import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const autoPath=path.join(root,'public/auto-intelligence.json');
const libraryPath=path.join(root,'public/research-library.json');
const now=new Date();
const endDate=isoDate(now);
const weekStart=isoDate(new Date(now.getTime()-7*86400000));
const esgPattern=/\b(esg|climate|carbon|emission|renewable|clean energy|energy transition|data cent(?:er|re)|artificial intelligence|biodiversity|deforestation|sustainab|green finance|transition plan|supply chain|human rights|pollution|water risk|critical mineral|net[ -]?zero)\b/i;
const highImpactPattern=/regulation|rule|directive|standard|disclosure|mandatory|ban|permit|effective|final rule|investment|billion|framework|taxonomy|report|working paper|peer.review/i;

function isoDate(date){return date.toISOString().slice(0,10)}
function dotDate(value){return String(value||'').replaceAll('-','.')}
function decode(value=''){return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function tag(block,name){const match=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'));return decode(match?.[1]||'')}
function link(block){const href=block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];return href||tag(block,'link')}
function idFor(value){return String(value).toLowerCase().replace(/^https?:\/\//,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72)}
function dateParts(value){if(!value)return '';const date=new Date(value);return Number.isNaN(date.valueOf())?'':isoDate(date)}
function uniqueByUrl(items){const seen=new Set();return items.filter(item=>{const key=(item.url||item.title).toLowerCase().replace(/\/$/,'');if(!key||seen.has(key))return false;seen.add(key);return true})}
function heuristicScore(item){let score=4;if(['Federal Register','GOV.UK'].includes(item.source))score+=2;if(item.source==='Crossref')score+=1;if(highImpactPattern.test(`${item.title} ${item.summary}`))score+=2;if(/effective|final rule|mandatory|billion|cross-sector|systemic/i.test(`${item.title} ${item.summary}`))score+=1;return Math.min(10,score)}
function sectorFor(text){if(/artificial intelligence|\bai\b|data cent/i.test(text))return '人工智能';if(/renewable|solar|wind|battery|hydrogen|electricity|grid|energy/i.test(text))return '新能源';if(/disclosure|supply chain|trade|border|export|deforestation/i.test(text))return '企业出海';if(/finance|investment|bank|insurance|taxonomy/i.test(text))return '绿色金融';if(/steel|cement|aluminium|oil|gas|coal|chemical|emission|pollution/i.test(text))return '高排放行业';return '新兴行业'}

async function fetchText(url,options={}){const response=await fetch(url,{...options,headers:{'user-agent':'SynerPlat-ESG-Intelligence/1.0 (+https://github.com/JimPlatzer/SynerPlat)',...(options.headers||{})},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`${response.status} ${url}`);return response.text()}
async function fetchJson(url,options={}){return JSON.parse(await fetchText(url,options))}

async function collectFederalRegister(){
 const terms=['climate emissions energy','artificial intelligence energy','sustainability disclosure'];const rows=[];
 for(const term of terms){
  const query=new URLSearchParams({'per_page':'40','order':'newest','conditions[publication_date][gte]':weekStart,'conditions[publication_date][lte]':endDate,'conditions[term]':term});
  const data=await fetchJson(`https://www.federalregister.gov/api/v1/documents.json?${query}`);
  for(const item of data.results||[])rows.push({candidateId:`fr-${item.document_number}`,source:'Federal Register',publisher:(item.agencies||[]).map(x=>x.name).join(' / ')||'U.S. Federal Register',sourceType:'policy',title:item.title,summary:item.abstract||item.excerpts||'',publishedDate:item.publication_date,eventDate:item.effective_on||item.publication_date,dateNote:item.effective_on?'生效':'发布',url:item.html_url,peerReviewed:false});
 }
 return rows;
}

async function collectGovUk(){
 const terms=['climate energy','artificial intelligence sustainability','emissions disclosure'];const rows=[];
 for(const term of terms){
  const xml=await fetchText(`https://www.gov.uk/search/news-and-communications.atom?keywords=${encodeURIComponent(term)}`);
  for(const entry of xml.match(/<entry[\s\S]*?<\/entry>/gi)||[]){
   const published=dateParts(tag(entry,'updated')||tag(entry,'published'));if(!published||published<weekStart)continue;
   rows.push({candidateId:`govuk-${idFor(link(entry)||tag(entry,'id'))}`,source:'GOV.UK',publisher:'UK Government',sourceType:'policy',title:tag(entry,'title'),summary:tag(entry,'summary')||tag(entry,'content'),publishedDate:published,eventDate:published,dateNote:'发布',url:link(entry),peerReviewed:false});
  }
 }
 return rows;
}

async function collectCrossref(){
 const terms=['ESG climate disclosure','artificial intelligence energy sustainability','renewable energy transition'];const rows=[];
 for(const term of terms){
  const query=new URLSearchParams({'query.bibliographic':term,'filter':`from-created-date:${weekStart},until-created-date:${endDate},type:journal-article`,'rows':'25','sort':'score','select':'DOI,title,abstract,publisher,published,created,URL,type,subtype,author'});
  const data=await fetchJson(`https://api.crossref.org/works?${query}`);
  for(const item of data.message?.items||[]){
   const parts=item.published?.['date-parts']?.[0]||item.created?.['date-parts']?.[0]||[];const published=parts.length?`${parts[0]}-${String(parts[1]||1).padStart(2,'0')}-${String(parts[2]||1).padStart(2,'0')}`:'';
   rows.push({candidateId:`doi-${idFor(item.DOI)}`,source:'Crossref',publisher:item.publisher||'Academic publisher',sourceType:'academic',title:decode(item.title?.[0]||''),summary:decode(item.abstract||''),publishedDate:published||endDate,eventDate:published||endDate,dateNote:'论文发表',url:item.URL||`https://doi.org/${item.DOI}`,peerReviewed:true,doi:item.DOI});
  }
 }
 return rows;
}

async function collectArxiv(){
 const start=weekStart.replaceAll('-','')+'0000';const end=endDate.replaceAll('-','')+'2359';
 const search=`submittedDate:[${start} TO ${end}] AND (all:climate OR all:sustainability OR all:emissions OR all:"energy transition" OR all:ESG)`;
 const xml=await fetchText(`https://export.arxiv.org/api/query?search_query=${encodeURIComponent(search)}&start=0&max_results=40&sortBy=submittedDate&sortOrder=descending`);
 return (xml.match(/<entry[\s\S]*?<\/entry>/gi)||[]).map(entry=>{const url=tag(entry,'id');const published=dateParts(tag(entry,'published'));return {candidateId:`arxiv-${idFor(url)}`,source:'arXiv',publisher:'arXiv',sourceType:'preprint',title:tag(entry,'title'),summary:tag(entry,'summary'),publishedDate:published,eventDate:published,dateNote:'预印本发布',url,peerReviewed:false}});
}

async function verifyCandidates(items){
 const filtered=uniqueByUrl(items).filter(item=>item.title&&item.url&&esgPattern.test(`${item.title} ${item.summary}`)).map(item=>({...item,heuristicScore:heuristicScore(item)})).filter(item=>item.heuristicScore>=6).sort((a,b)=>b.heuristicScore-a.heuristicScore).slice(0,32);
 const verified=[];
 for(let index=0;index<filtered.length;index+=5){
  const batch=filtered.slice(index,index+5);
  const results=await Promise.all(batch.map(async item=>{try{const body=await fetchText(item.url,{headers:{accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}});return body.length>300?{...item,verified:true}:null}catch{return null}}));
  verified.push(...results.filter(Boolean));
 }
 return verified;
}

function modelPrompt(candidates){return `你是 SynerPlat 的 ESG 研究编辑。只使用下方已经从原始官方页面、正式元数据 API 或论文原始页抓取并完成链接可访问性检查的候选资料。不得补造事实、数字、机构、日期或链接。\n\n筛选规则：ESG 直接或间接相关；重大性通常至少 6/10；优先政策法规、监管、跨行业制度、高额资本开支、重要国际组织报告、重要同行评审论文和有明确新方法的预印本。区分同行评审与预印本。对每条选中候选，必须使用 candidateId。\n\n输出严格 JSON 对象，字段：stories、resources、sectorInsights、summary、monthlyHighlights、annualHighlights。stories 每项字段 candidateId,titleZh,summaryZh,sector,relevance,event,score,tags；resources 每项字段 candidateId,type,summaryZh,insightZh,tags,featured；sectorInsights 是最多5个对象{name,text,count,arrow}；summary 包含 week 和 month，各有 label,title,range,copy,words，其中 words 是最多20个 [词,1到10]；monthlyHighlights/annualHighlights 是 candidateId 数组。年度只选制度性、跨行业或 score>=9 的候选。若证据不足则不选。\n\n当前日期 ${endDate}，七日窗口 ${weekStart} 至 ${endDate}。候选：\n${JSON.stringify(candidates)}`}

async function runModel(candidates){
 const token=process.env.GITHUB_TOKEN;if(!token||!candidates.length)return null;
 const response=await fetch('https://models.github.ai/inference/chat/completions',{method:'POST',headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2026-03-10'},body:JSON.stringify({model:process.env.SYNERPLAT_MODEL||'openai/gpt-4.1',temperature:0.1,max_tokens:6500,response_format:{type:'json_object'},messages:[{role:'system',content:'Return valid JSON only. Follow evidence constraints exactly.'},{role:'user',content:modelPrompt(candidates)}]}),signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw new Error(`GitHub Models ${response.status}: ${await response.text()}`);
 const data=await response.json();return JSON.parse(data.choices?.[0]?.message?.content||'null');
}

function normalizeModel(model,candidates,previous){
 const byId=new Map(candidates.map(item=>[item.candidateId,item]));
 const stories=(model?.stories||[]).flatMap(item=>{const source=byId.get(item.candidateId);if(!source)return [];return [{id:source.candidateId,sector:item.sector||sectorFor(`${source.title} ${source.summary}`),relevance:item.relevance==='间接 ESG'?'间接 ESG':'直接 ESG',event:item.event||'研究发布',title:item.titleZh||source.title,summary:item.summaryZh||source.summary,score:Math.max(6,Math.min(10,Number(item.score)||source.heuristicScore)),publishedDate:dotDate(source.publishedDate),eventDate:dotDate(source.eventDate),dateNote:source.dateNote,source:source.publisher,url:source.url,tags:Array.isArray(item.tags)?item.tags.slice(0,5):[]}]});
 const resources=(model?.resources||[]).flatMap(item=>{const source=byId.get(item.candidateId);if(!source)return [];const type=source.sourceType==='preprint'?'工作论文':source.sourceType==='academic'?'学术论文':item.type||'政策法规';return [{id:source.candidateId,type,title:source.title,publisher:source.publisher,date:source.publishedDate,publishedDate:source.publishedDate,eventDate:source.eventDate,dateNote:source.dateNote,sector:sectorFor(`${source.title} ${source.summary}`),tags:Array.from(new Set([...(Array.isArray(item.tags)?item.tags:[]),...(source.sourceType==='preprint'?['非同行评审']:[])])),summary:item.summaryZh||source.summary,insight:item.insightZh||'自动检索资料；正式引用前请再次核验原文与适用范围。',url:source.url,featured:Boolean(item.featured)}]});
 const sectorInsights=(model?.sectorInsights||[]).slice(0,5).map(item=>[item.name,item.text,item.count,item.arrow||'→']);
 const summary=model?.summary?.week&&model?.summary?.month?model.summary:previous.summary;
 const highlight=(id,annual=false)=>{const story=stories.find(item=>item.id===id);if(!story||annual&&story.score<9)return null;return {date:story.publishedDate.slice(5),title:story.title,summary:story.summary,sector:story.sector,source:story.source,url:story.url,score:story.score}};
 return {stories,resources,sectorInsights,summary,monthlyHighlights:(model?.monthlyHighlights||[]).map(id=>highlight(id)).filter(Boolean),annualHighlights:(model?.annualHighlights||[]).map(id=>highlight(id,true)).filter(Boolean)};
}

async function main(){
 const previous=JSON.parse(await readFile(autoPath,'utf8'));const library=JSON.parse(await readFile(libraryPath,'utf8'));
 const collectors=[['Federal Register',collectFederalRegister],['GOV.UK',collectGovUk],['Crossref',collectCrossref],['arXiv',collectArxiv]];
 const sourceHealth=[];const candidates=[];
 for(const [name,collector] of collectors){try{const rows=await collector();candidates.push(...rows);sourceHealth.push({source:name,status:'ok',items:rows.length})}catch(error){sourceHealth.push({source:name,status:'error',message:String(error.message||error).slice(0,180)})}}
 const verified=await verifyCandidates(candidates);let normalized={stories:[],resources:[],sectorInsights:[],summary:previous.summary,monthlyHighlights:[],annualHighlights:[]};
 try{const model=await runModel(verified);if(model)normalized=normalizeModel(model,verified,previous)}catch(error){sourceHealth.push({source:'GitHub Models',status:'error',message:String(error.message||error).slice(0,180)})}
 const previousRecent=(previous.stories||[]).filter(item=>String(item.publishedDate).replaceAll('.','-')>=weekStart);
 const stories=uniqueByUrl([...normalized.stories,...previousRecent]).sort((a,b)=>String(b.publishedDate).localeCompare(String(a.publishedDate))).slice(0,16);
 const existingUrls=new Set((library.items||[]).map(item=>item.url));const newResources=normalized.resources.filter(item=>!existingUrls.has(item.url));
 const updatedAt=new Date().toISOString();const weekRange=`${dotDate(weekStart)}—${dotDate(endDate).slice(5)}`;
 const auto={updatedAt,weekRange,monthLabel:`${endDate.slice(0,4)}年${Number(endDate.slice(5,7))}月`,stories,sectorInsights:normalized.sectorInsights.length?normalized.sectorInsights:previous.sectorInsights||[],summary:normalized.summary||previous.summary,monthlyHighlights:uniqueByUrl([...normalized.monthlyHighlights,...(previous.monthlyHighlights||[])]).slice(0,20),annualHighlights:uniqueByUrl([...normalized.annualHighlights,...(previous.annualHighlights||[])]).slice(0,30),sourceHealth,verifiedCandidateCount:verified.length};
 library.updatedAt=updatedAt;library.items=[...newResources,...library.items];
 await writeFile(autoPath,JSON.stringify(auto,null,2)+'\n');
 await writeFile(libraryPath,JSON.stringify(library,null,2)+'\n');
 console.log(`Verified ${verified.length} candidates; selected ${stories.length} stories; added ${newResources.length} library items.`);
}

await main();
