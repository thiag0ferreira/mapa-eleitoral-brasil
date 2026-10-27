// Integrações públicas apenas para testes manuais de baixo volume.
// Nominatim: sem autocomplete, consulta somente após clique explícito do usuário.
// OSRM demo: serviço comunitário sem garantia, sem trânsito ao vivo.
export const LINK_POLITICA='https://operations.osmfoundation.org/policies/nominatim/';
const BASE_BUSCA='https://nominatim.openstreetmap.org/search';
const BASE_ROTA='https://router.project-osrm.org/route/v1/driving/';
let ultimaBusca=0;
const cache=new Map();
export async function pesquisarDestino(texto){
 const q=texto.trim();
 if(q.length<3)throw new Error('Informe pelo menos três caracteres');
 const chave=q.toLocaleLowerCase('pt-BR');
 if(cache.has(chave))return cache.get(chave);
 const espera=1000-(Date.now()-ultimaBusca);
 if(espera>0)throw new Error('Aguarde um segundo antes de buscar novamente.');
 ultimaBusca=Date.now();
 const url=BASE_BUSCA+'?format=jsonv2&limit=1&countrycodes=br&q='+encodeURIComponent(q);
 const res=await fetch(url,{headers:{'Accept':'application/json','Accept-Language':'pt-BR'}});
 if(!res.ok)throw new Error('Serviço de busca indisponível (HTTP '+res.status+').');
 const data=await res.json();
 if(!data.length)throw new Error('Endereço não encontrado no Brasil. Experimente informar cidade e estado.');
 const p=data[0],destino={latitude:Number(p.lat),longitude:Number(p.lon),label:p.display_name};
 if(!Number.isFinite(destino.latitude)||!Number.isFinite(destino.longitude))throw new Error('Coordenadas inválidas.');
 cache.set(chave,destino);
 return destino;
}
export async function criarRota(origem,destino){
 const p=a=>a.longitude+','+a.latitude;
 const url=BASE_ROTA+p(origem)+';'+p(destino)+'?overview=full&geometries=geojson';
 const res=await fetch(url);
 if(!res.ok)throw new Error('Serviço experimental de rotas indisponível.');
 const data=await res.json();
 const r=data.routes?.[0];
 if(!r||data.code!=='Ok'||!r.geometry?.coordinates)throw new Error('Não foi encontrada uma rota rodoviária entre origem e destino.');
 return {distancia:r.distance,duracao:r.duration,coordenadas:r.geometry.coordinates.map(([longitude,latitude])=>({longitude,latitude}))};
}
