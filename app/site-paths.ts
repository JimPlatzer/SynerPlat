const normalizeBase=(value:string)=>{
 const trimmed=value.trim();
 if(!trimmed||trimmed==='/')return '/';
 return `/${trimmed.replace(/^\/+|\/+$/g,'')}/`;
};

export const siteBase=()=>{
 if(typeof document==='undefined')return '/';
 const configured=document.querySelector<HTMLMetaElement>('meta[name="synerplat-base"]')?.content||'/';
 return normalizeBase(configured);
};

export const siteHref=(path='')=>`${siteBase()}${path.replace(/^\//,'')}`;
export const publicAsset=(path:string)=>siteHref(path);
