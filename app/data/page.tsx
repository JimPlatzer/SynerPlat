'use client';
import {useEffect,useMemo,useState} from 'react';
import {annualHighlights,monthlyHighlights} from '../intelligence-data';
import {publicAsset,siteHref} from '../site-paths';

type Resource={id:string;type:string;title:string;publisher:string;date:string;sector:string;tags:string[]};
const palette=['#d7ff43','#8ebd74','#3d7c64','#174d3b','#9b9f93','#6d846f','#c5d7a4'];

function BarList({rows}:{rows:[string,number][]}){const max=Math.max(1,...rows.map(x=>x[1]));return <div className="data-bars">{rows.map(([label,value],i)=><div key={label}><span>{label}</span><i><b style={{width:`${value/max*100}%`,background:palette[i%palette.length]}}/></i><strong>{value}</strong></div>)}</div>}

export default function DataPage(){
 const [resources,setResources]=useState<Resource[]>([]);const [scope,setScope]=useState<'month'|'year'>('year');
 useEffect(()=>{fetch(publicAsset('research-library.json')).then(r=>r.json()).then((data:unknown)=>{const payload=data as {items?:Resource[]};setResources(Array.isArray(payload.items)?payload.items:[])})},[]);
 const byType=useMemo(()=>Object.entries(resources.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]) as [string,number][],[resources]);
 const bySector=useMemo(()=>Object.entries(resources.reduce((a,r)=>(a[r.sector]=(a[r.sector]||0)+1,a),{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]) as [string,number][],[resources]);
 const byYear=useMemo(()=>Object.entries(resources.reduce((a,r)=>{const y=String(r.date).slice(0,4);a[y]=(a[y]||0)+1;return a},{} as Record<string,number>)).sort((a,b)=>a[0].localeCompare(b[0])) as [string,number][],[resources]);
 const academic=resources.filter(r=>['学术论文','学术评论','工作论文'].includes(r.type)).length;const official=resources.filter(r=>['政策法规','政策报告'].includes(r.type)).length;const highlights=scope==='year'?annualHighlights:monthlyHighlights;
 const coverage=new Set(resources.flatMap(r=>r.tags)).size;
 return <main className="data-page"><header className="topbar"><a className="brand designed" href={siteHref()}><span>Syner</span>Plat</a><nav><a href={siteHref()}>情报首页</a><a href="#overview">数据概览</a><a href="#timeline">重点时间轴</a></nav><a className="outline data-back" href={siteHref()}>← 返回首页</a></header>
 <section className="data-hero"><div><p className="eyebrow">INTEGRATED DATA VIEW</p><h1>数据不是装饰，<br/>而是证据的结构。</h1><p>所有统计均来自网站当前收录的真实资料和已核验重点事件。随着资料库每日更新，本页分布会同步变化。</p></div><div className="data-orbit"><b>{resources.length}</b><span>可追溯资料</span><i/></div></section>
 <section className="data-kpis" id="overview"><div><b>{resources.length}</b><span>资料总数</span><small>官方、期刊及工作论文</small></div><div><b>{academic}</b><span>学术与工作论文</span><small>明确区分同行评审状态</small></div><div><b>{official}</b><span>政策与官方报告</span><small>优先原始发布页面</small></div><div><b>{coverage}</b><span>主题标签</span><small>跨行业可检索</small></div></section>
 <section className="data-grid"><article className="data-panel"><div className="data-panel-head"><div><p className="eyebrow">FORMAT MIX</p><h2>资料类型分布</h2></div><span>{resources.length} 条</span></div><BarList rows={byType}/></article><article className="data-panel dark"><div className="data-panel-head"><div><p className="eyebrow">SECTOR COVERAGE</p><h2>行业覆盖</h2></div><span>{bySector.length} 类</span></div><BarList rows={bySector}/></article></section>
 <section className="data-panel wide"><div className="data-panel-head"><div><p className="eyebrow">ARCHIVE GROWTH</p><h2>资料年份分布</h2></div><span>按发布日期统计</span></div><div className="year-chart">{byYear.map(([year,count])=><div key={year}><span style={{height:`${Math.max(12,count/Math.max(...byYear.map(x=>x[1]))*100)}%`}}><b>{count}</b></span><small>{year}</small></div>)}</div></section>
 <section className="timeline-section" id="timeline"><div className="section-head"><div><p className="eyebrow">PRIORITY TIMELINE</p><h2>重点政策与事件时间轴</h2></div><div className="scope-toggle"><button className={scope==='month'?'active':''} onClick={()=>setScope('month')}>本月</button><button className={scope==='year'?'active':''} onClick={()=>setScope('year')}>本年度</button></div></div><div className="integrity-note">只保留重大性评分较高、具有跨行业影响或改变市场准入与披露义务的事件。</div><div className="timeline">{highlights.map(h=><article key={h.title}><div><span>{h.date}</span><b>{h.score}/10</b></div><i/><div><small>{h.sector} · {h.source}</small><h3>{h.title}</h3><p>{h.summary}</p><a href={h.url} target="_blank" rel="noopener noreferrer">查看原始来源 ↗</a></div></article>)}</div></section>
 <section className="data-method"><div><p className="eyebrow">READING GUIDE</p><h2>如何使用这些数据</h2></div><div><p><b>分布不是质量排名。</b>某一行业资料较多，可能意味着监管活跃，也可能只是公开信息更充足。</p><p><b>工作论文单独标注。</b>预印本可以提示新方法，但不等同于已完成同行评审的研究结论。</p><p><b>年度重点是精选集。</b>时间轴不追求完整收录，而是聚焦制度性、跨行业和高重大性变化。</p></div></section><footer><a className="brand designed" href={siteHref()}><span>Syner</span>Plat</a><p>Evidence, structured.</p><a href="#">返回顶部 ↑</a></footer></main>
}
