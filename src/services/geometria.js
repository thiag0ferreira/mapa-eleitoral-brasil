// Fonte comunitária de geometria; será substituída por malha IBGE versionada.
export const GEOJSON_URL='https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson';
export async function carregarGeometria(){
 const r=await fetch(GEOJSON_URL);
 if(!r.ok)throw new Error('Falha ao carregar a malha (HTTP '+r.status+')');
 const data=await r.json();
 if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('GeoJSON inválido');
 return data;
}
