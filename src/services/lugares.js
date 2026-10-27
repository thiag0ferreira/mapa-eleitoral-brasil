// Consulta manual para teste: sem autocomplete e sem uso em massa.
// O limite de 1 req/s do Nominatim aplica-se ao aplicativo inteiro.
const cache=new Map();let last=0;
export async function buscarEstabelecimentos(q){
 q=q.trim();if(q.length<3)throw Error('Digite 3 caracteres ou mais.');
 const key=q.toLowerCase();if(cache.has(key))return cache.get(key);
 if(Date.now()-last<1300)throw Error('Aguarde um segundo entre buscas.');
 last=Date.now();
 const p=new URLSearchParams({q:q+', Distrito Federal, Brasil',format:'jsonv2',limit:'8',addressdetails:'1',countrycodes:'br',viewbox:'-48.32,-15.42,-47.25,-16.10',bounded:'1'});
 const r=await fetch('https://nominatim.openstreetmap.org/search?'+p.toString(),{headers:{'Accept-Language':'pt-BR'}});
 if(!r.ok)throw Error('Consulta a estabelecimentos indisponível.');
 const data=await r.json();
 const places=data.filter(x=>x.osm_id&&x.osm_type&&Number(x.lat)>=-16.10&&Number(x.lat)<=-15.42&&Number(x.lon)>=-48.32&&Number(x.lon)<=-47.25)
 .filter(x=>!['administrative','road','city','suburb'].includes(x.addresstype))
 .map(x=>({id:'osm:'+x.osm_type+':'+x.osm_id,osm_type:x.osm_type,osm_id:String(x.osm_id),name:x.name||x.display_name.split(',')[0],label:x.display_name,category:x.type||'local',latitude:Number(x.lat),longitude:Number(x.lon)}));
 cache.set(key,places);return places;
}
