import periodData from '../public/period-highlights.json';

export type Highlight={date:string;title:string;summary:string;sector:string;source:string;url:string;score:number};

export const monthlyHighlights=periodData.monthlyHighlights as Highlight[];
export const annualHighlights=periodData.annualHighlights as Highlight[];

export const heroMessages=[
  ['把复杂变化，整理成可验证的决策线索。','从政策、研究与行业事件中，提取真正影响企业的长期信号。'],
  ['在信息发生之后，看见影响发生之前。','连接监管变化、资本流向、技术演进与企业行动。'],
  ['让可靠来源彼此连接，让趋势自然浮现。','持续追踪 ESG 直接与间接影响，不被单条新闻牵着走。'],
  ['从公开信息出发，构建自己的研究底稿。','新闻、政策、论文与白皮书，在同一套证据框架中被整理。'],
  ['比热点更早一步，比结论多一层证据。','用可追溯资料理解人工智能、能源转型与跨境经营风险。']
] as const;
