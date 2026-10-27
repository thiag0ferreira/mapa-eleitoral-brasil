export async function obterLocalizacaoAtual(){
 if(!navigator.geolocation)throw Error('GPS indisponível.');
 return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,label:'Minha localização atual'}),()=>reject(Error('Não foi possível acessar a localização. Verifique as permissões.')),{enableHighAccuracy:true,timeout:12000,maximumAge:60000}));
}
