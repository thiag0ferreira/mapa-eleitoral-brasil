// Serviço experimental OSRM para consultas de rota de baixo volume.
// Não usar o servidor comunitário para navegação pública em escala.
const BASE_ROTA='https://router.project-osrm.org/route/v1/driving/';

export function distanciaMetros(a,b){
 if(!a||!b)return Infinity;
 const rad=Math.PI/180;
 const dl=(b.latitude-a.latitude)*rad,do_=(b.longitude-a.longitude)*rad;
 const v=Math.sin(dl/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(do_/2)**2;
 return 12742000*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));
}
const caminho=(p)=>p.longitude+','+p.latitude;
export async function criarRota(origem,destino){
 if(!origem||!destino)throw Error('Selecione origem e destino.');
 const url=BASE_ROTA+caminho(origem)+';'+caminho(destino)+'?overview=full&geometries=geojson&steps=true';
 const response=await fetch(url);
 if(!response.ok)throw new Error('Serviço de rotas indisponível. Use Abrir no Google Maps para navegar.');
 const result=await response.json();
 const rota=result.routes?.[0];
 if(!rota||result.code!=='Ok'||!rota.geometry?.coordinates?.length)throw new Error('Não foi encontrada uma rota rodoviária.');
 const coordenadas=rota.geometry.coordinates.map(([longitude,latitude])=>({latitude,longitude}));
 const passos=(rota.legs||[]).flatMap(leg=>(leg.steps||[]).map(step=>({
  distancia:step.distance,duracao:step.duration,via:step.name||'',
  tipo:step.maneuver?.type||'continue',direcao:step.maneuver?.modifier||'straight',
  ponto:{longitude:step.maneuver?.location?.[0],latitude:step.maneuver?.location?.[1]}
 }))).filter(x=>Number.isFinite(x.ponto.latitude)&&Number.isFinite(x.ponto.longitude));
 return {distancia:rota.distance,duracao:rota.duration,coordenadas,passos};
}
export function orientacao(passo){
 if(!passo)return 'Siga a rota indicada no mapa';
 const nome=passo.via?' na '+passo.via:'';
 const tipo=passo.tipo,d=passo.direcao;
 if(tipo==='arrive')return 'Você chegou ao destino';
 if(tipo==='depart')return 'Siga em frente'+nome;
 if(tipo==='roundabout'||tipo==='rotary')return 'Entre na rotatória'+nome;
 if(tipo==='merge')return 'Entre na via'+nome;
 if(tipo==='on ramp'||tipo==='off ramp')return 'Pegue o acesso'+nome;
 if(tipo==='fork')return 'Mantenha-se '+(d.includes('left')?'à esquerda':'à direita')+nome;
 if(d==='left'||d==='slight left'||d==='sharp left')return 'Vire à esquerda'+nome;
 if(d==='right'||d==='slight right'||d==='sharp right')return 'Vire à direita'+nome;
 if(d==='uturn')return 'Faça o retorno'+nome;
 return 'Continue em frente'+nome;
}
export function distanciaFormatada(m){
 if(!Number.isFinite(m))return '—';
 if(m<1000)return Math.max(0,Math.round(m/10)*10)+' m';
 return (m/1000).toFixed(1).replace('.',',')+' km';
}
// Projeta a posição do GPS sobre os segmentos da rota, em plano local (aproximação).
export function progressoNaRota(rota,local){
 if(!rota?.coordenadas?.length||!local)return null;
 const points=rota.coordenadas;
 if(points.length<2)return null;
 const latFactor=111195,lonFactor=latFactor*Math.cos(local.latitude*Math.PI/180);
 let best={dist:Infinity,index:0,t:0},total=0;
 const lengths=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  const ax=(a.longitude-local.longitude)*lonFactor,ay=(a.latitude-local.latitude)*latFactor;
  const dx=(b.longitude-a.longitude)*lonFactor,dy=(b.latitude-a.latitude)*latFactor;
  const squared=dx*dx+dy*dy;
  const t=squared?Math.min(1,Math.max(0,-(ax*dx+ay*dy)/squared)):0;
  const dist=Math.hypot(ax+t*dx,ay+t*dy);
  const len=Math.sqrt(squared);
  lengths.push(len);
  if(dist<best.dist)best={dist,index:i,t};
  total+=len;
 }
 const ate=lengths.slice(0,best.index).reduce((a,b)=>a+b,0)+best.t*lengths[best.index];
 // Correção pelo comprimento rodoviário retornado pelo OSRM.
 const ratio=total>0?Math.max(0,Math.min(1,ate/total)):0;
 const restante=Math.max(0,rota.distancia*(1-ratio));
 const passos=rota.passos||[];
 const next=passos.find(p=>p.tipo!=='depart'&&localizarPasso(points,p.ponto,lengths)>=ate+12)||passos[passos.length-1];
 const nextPos=next?localizarPasso(points,next.ponto,lengths):ate;
 return {restante,progresso:ratio,foraDaRota:best.dist>Math.max(90,(local.accuracy||0)*1.7),
  proxima:next,distanciaProxima:Math.max(0,nextPos-ate),metrosFora:best.dist};
}
function localizarPasso(points,ponto,lengths){
 if(!ponto||!Number.isFinite(ponto.latitude))return 0;
 let best=Infinity,idx=0;
 for(let i=0;i<points.length;i++){const d=distanciaMetros(points[i],ponto);if(d<best){best=d;idx=i}}
 return lengths.slice(0,idx).reduce((a,b)=>a+b,0);
}
export function urlGoogleMaps(destino){
 if(!destino)return '';
 const q=new URLSearchParams({api:'1',destination:destino.latitude+','+destino.longitude,travelmode:'driving',dir_action:'navigate'});
 if(destino.google_place_id)q.set('destination_place_id',destino.google_place_id);
 return 'https://www.google.com/maps/dir/?'+q.toString();
}
export function urlWaze(destino){
 if(!destino)return '';
 return 'https://waze.com/ul?'+new URLSearchParams({ll:destino.latitude+','+destino.longitude,navigate:'yes'}).toString();
}
