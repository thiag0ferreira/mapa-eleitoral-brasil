// Busca por estabelecimentos no DF, somente por ação explícita do usuário.
// Overpass e Nominatim são serviços comunitários de prototipagem, sem SLA.
// Antes da disponibilização pública, usar backend com cache e rate limit global.
const cache=new Map();
let ultimaConsulta=0;
const DF={south:-16.10,west:-48.32,north:-15.42,east:-47.25};
const dentro=(lat,lon)=>lat>=DF.south&&lat<=DF.north&&lon>=DF.west&&lon<=DF.east;
const pois=['amenity','shop','tourism','leisure','office','craft','healthcare'];
const categories=new Set(['administrative','road','city','suburb','county','state','municipality','house']);
const digits=n=>Number.isFinite(Number(n));
const text=(s)=>String(s||'').trim();
const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const endereco=(tags={})=>[tags['addr:street']&&[tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(', '),tags['addr:suburb']||tags['addr:neighbourhood'],tags['addr:city']||'Distrito Federal'].filter(Boolean).join(' · ');
export function distanciaKm(a,b){
 if(!a||!b||![a.latitude,a.longitude,b.latitude,b.longitude].every(x=>Number.isFinite(x)))return null;
 const rad=Math.PI/180,dLat=(b.latitude-a.latitude)*rad,dLon=(b.longitude-a.longitude)*rad;
 const v=Math.sin(dLat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));
}
export function formatarDistancia(km){return km==null?'Distância indisponível':km<1?Math.round(km*1000)+' m de distância':km.toFixed(1).replace('.',',')+' km de distância';}
function normalizarOverpass(el){
 const t=el.tags||{},lat=Number(el.lat??el.center?.lat),lon=Number(el.lon??el.center?.lon);
 if(!digits(lat)||!digits(lon)||!dentro(lat,lon))return null;
 const nome=text(t.name||t.brand);if(!nome)return null;
 const tipo=pois.find(k=>t[k])||'estabelecimento';
 return {id:'osm:'+el.type+':'+el.id,osm_type:el.type,osm_id:String(el.id),name:nome,label:endereco(t)||nome+', Distrito Federal',category:t[tipo]||tipo,latitude:lat,longitude:lon,fonte:'OpenStreetMap'};
}
async function overpass(q){
 // Pesquisa nominal parcial e limitada às categorias de estabelecimentos.
 const re=escapeRegExp(q.trim().split(',')[0].slice(0,70));
 const bbox=[DF.south,DF.west,DF.north,DF.east].join(',');
 const body='[out:json][timeout:18];(nwr["name"~"'+re+'",i][~"^(amenity|shop|tourism|leisure|office|craft|healthcare)$"~"."]('+bbox+'););out center 30;';
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),22000);
 try{
  const resp=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:new URLSearchParams({data:body}),signal:ctrl.signal});
  if(!resp.ok)throw new Error('Overpass '+resp.status);
  const result=await resp.json();return (result.elements||[]).map(normalizarOverpass).filter(Boolean);
 }finally{clearTimeout(timer)}
}
async function nominatim(q){
 const params=new URLSearchParams({q:q+', Distrito Federal, Brasil',format:'jsonv2',limit:'20',addressdetails:'1',countrycodes:'br',viewbox:[DF.west,DF.north,DF.east,DF.south].join(','),bounded:'1'});
 const resp=await fetch('https://nominatim.openstreetmap.org/search?'+params.toString(),{headers:{'Accept-Language':'pt-BR'}});
 if(!resp.ok)throw new Error('A busca está temporariamente indisponível.');
 const result=await resp.json();
 return result.filter(x=>x.osm_id&&x.osm_type&&!categories.has(x.addresstype)&&dentro(Number(x.lat),Number(x.lon)))
 .map(x=>({id:'osm:'+x.osm_type+':'+x.osm_id,osm_type:x.osm_type,osm_id:String(x.osm_id),name:text(x.name||x.display_name.split(',')[0]),label:x.display_name,category:x.type||'local',latitude:Number(x.lat),longitude:Number(x.lon),fonte:'OpenStreetMap'}));
}
export async function buscarEstabelecimentos(q){
 q=text(q);if(q.length<3)throw new Error('Digite pelo menos 3 caracteres.');
 const key=q.toLocaleLowerCase('pt-BR');if(cache.has(key))return cache.get(key);
 if(Date.now()-ultimaConsulta<1800)throw new Error('Aguarde alguns segundos antes de pesquisar novamente.');
 ultimaConsulta=Date.now();
 let list=[];
 try{list=await overpass(q);}catch(_e){list=[];}
 if(!list.length)list=await nominatim(q);
 const distinct=[...new Map(list.map(p=>[p.id,p])).values()].slice(0,30);
 cache.set(key,distinct);return distinct;
}
