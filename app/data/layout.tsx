import type {Metadata} from 'next';

export const metadata:Metadata={
  title:'数据洞察｜SynerPlat',
  description:'查看SynerPlat资料类型、行业覆盖、年份分布以及月度和年度重点政策时间轴。',
  openGraph:{title:'SynerPlat 数据洞察',description:'ESG、政策与研究资料的集成数据视图',images:[]},
  twitter:{card:'summary',title:'SynerPlat 数据洞察',description:'ESG、政策与研究资料的集成数据视图',images:[]}
};

export default function DataLayout({children}:{children:React.ReactNode}){return children}
