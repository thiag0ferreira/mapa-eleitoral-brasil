// Geoapify: geocodificação por ação do usuário e roteamento sob demanda.
// Chave pública de navegador SOMENTE com restrição de origem/referrer no painel Geoapify.
// Plano gratuito não equivale a uso ilimitado; não usar consultas em background.
export const GEOAPIFY_KEY=process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY||'';
export const geoapifyReady=Boolean(GEOAPIFY_KEY);
const DF={west:-48.33,east:-47.25,south:-16.10,north:-15.42};
const cache=new Map();
const limites={last:0};
const osmTypes={n:'node',w:'way',r:'relation',node:'node',way:'way',relation:'relation'};
const isInside=(lat,lon)=>lat>=DF.south&&lat<=DF.north&&lon>=DF.west&&lon<=DF.east;
function checkRate(){
 if(Date.now()-limites.last<1000)throw new Error('Aguarde um segundo antes de fazer outra busca.');
 limites.last=Date.now();
}
function isVenue(p){
 const raw=p.datasource?.raw||{};
 const cat=Array.isArray(p.categories)?p.categories:[];
 return p.result_type==='amenity'||!!(raw.amenity||raw.shop||raw.tourism||raw.leisure||raw.office||raw.craft||raw.healthcare)
 ||cat.some(c=>/^(catering|commercial|entertainment|tourism|leisure|office|healthcare|education)(\.|$)/.test(c));
}
export async function buscarLugaresGeoapify(query,origem){
 if(!geoapifyReady)throw new Error('Geoapify ainda não configurado.');
 const q=query.trim();
 if(q.length<3)throw new Error('Informe pelo menos 3 caracteres.');
 const k=q.toLocaleLowerCase('pt-BR');
 if(cache.has(k))return cache.get(k);
 checkRate();
 const params=new URLSearchParams({
  text:q+', Distrito Federal, Brasil',format:'geojson',lang:'pt',
  limit:'12',filter:'rect:-48.33,-16.10,-47.25,-15.42|countrycode:br',apiKey:GEOAPIFY_KEY
 });
 if(origem&&Number.isFinite(origem.latitude)&&Number.isFinite(origem.longitude)){
  params.set('bias','proximity:'+origem.longitude+','+origem.latitude);
 }
 const response=await fetch('https://api.geoapify.com/v1/geocode/search?'+params.toString());
 if(!response.ok)throw new Error(response.status===429?'Limite diário ou de taxa da Geoapify atingido.':'Busca Geoapify indisponível (HTTP '+response.status+').');
 const data=await response.json();
 const places=(data.features||[]).map(feature=>{
  const p=feature.properties||{},raw=p.datasource?.raw||{};
  const latitude=Number(p.lat??feature.geometry?.coordinates?.[1]);
  const longitude=Number(p.lon??feature.geometry?.coordinates?.[0]);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!isInside(latitude,longitude))return null;
  const osm_type=osmTypes[raw.osm_type]||null;
  const osm_id=raw.osm_id!=null?String(raw.osm_id):null;
  const hasOsm=!!(osm_type&&osm_id&&/^[0-9]{1,20}$/.test(osm_id));
  const geoapify_place_id=typeof p.place_id==='string'&&p.place_id.length>4?p.place_id:null;
  if(!hasOsm&&!geoapify_place_id)return null;
  const validVenue=isVenue(p);
  return {
   id:hasOsm?'osm:'+osm_type+':'+osm_id:'geoapify:'+geoapify_place_id,
   osm_type:hasOsm?osm_type:undefined,
   osm_id:hasOsm?osm_id:undefined,
   geoapify_place_id:geoapify_place_id||undefined,
   name:p.name||p.address_line1||p.formatted||q,
   label:p.formatted||[p.address_line1,p.address_line2].filter(Boolean).join(', '),
   category:p.result_type||'endereço',
   latitude,longitude,voteEligible:validVenue,fonte:'Geoapify / OpenStreetMap'
  };
 }).filter(Boolean);
 const distinct=[...new Map(places.map(p=>[p.id,p])).values()];
 cache.set(k,distinct);
 return distinct;
}
export async function rotaGeoapify(origem,destino){
 if(!geoapifyReady)throw new Error('Geoapify não configurado.');
 const params=new URLSearchParams({
  waypoints:origem.latitude+','+origem.longitude+'|'+destino.latitude+','+destino.longitude,
  mode:'drive',lang:'pt-BR',format:'geojson',apiKey:GEOAPIFY_KEY
 });
 const response=await fetch('https://api.geoapify.com/v1/routing?'+params.toString());
 if(!response.ok)throw new Error(response.status===429?'Limite Geoapify atingido.':'Não foi possível calcular a rota Geoapify (HTTP '+response.status+').');
 const data=await response.json();
 const route=data.features?.[0];
 if(!route?.geometry?.coordinates?.length)throw new Error('Rota rodoviária não encontrada. Você pode abrir o Waze ou Google Maps.');
 const legCoords=route.geometry.type==='MultiLineString'?route.geometry.coordinates:[route.geometry.coordinates];
 const coordenadas=legCoords.flatMap((coords,i)=>coords.slice(i===0?0:1).map(([longitude,latitude])=>({longitude,latitude})));
 const passos=(route.properties?.legs||[]).flatMap((leg,index)=>(leg.steps||[]).map(step=>{
  const coords=legCoords[index]||legCoords[0]||[];
  const c=coords[Math.min(Math.max(0,step.from_index||0),coords.length-1)]||[];
  return {distancia:step.distance||0,duracao:step.time||0,via:step.name||'',texto:step.instruction?.text||'',
   tipo:step.instruction?.type||'continue',direcao:'straight',
   ponto:{longitude:c[0],latitude:c[1]}};
 })).filter(p=>Number.isFinite(p.ponto.latitude)&&Number.isFinite(p.ponto.longitude));
 const distancia=Number(route.properties?.distance);
 const duracao=Number(route.properties?.time);
 if(!Number.isFinite(distancia)||!Number.isFinite(duracao)||!coordenadas.length)throw new Error('Dados da rota incompletos.');
 return {distancia,duracao,coordenadas,passos,provider:'Geoapify'};
}
