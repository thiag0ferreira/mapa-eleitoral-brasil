export async function obterLocalizacaoAtual(){
 if(typeof navigator==='undefined'||!navigator.geolocation)throw Error('GPS indisponível neste navegador.');
 return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({
 latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,
 speed:p.coords.speed,
 heading:Number.isFinite(p.coords.heading)?p.coords.heading:null,label:'Minha localização atual'
 }),()=>reject(Error('Permita o acesso à localização no navegador para usar o GPS.')),{enableHighAccuracy:true,timeout:15000,maximumAge:10000}));
}
export async function observarLocalizacao(onPosition,onError){
 if(typeof navigator==='undefined'||!navigator.geolocation)throw Error('GPS indisponível.');
 const id=navigator.geolocation.watchPosition(p=>onPosition({
 latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,
 speed:p.coords.speed,
 heading:Number.isFinite(p.coords.heading)?p.coords.heading:null,label:'Minha localização atual'
 }),e=>onError?.(new Error(e.code===1?'Acesso à localização negado.':'Sinal de GPS indisponível.')),{enableHighAccuracy:true,maximumAge:2000,timeout:15000});
 return ()=>navigator.geolocation.clearWatch(id);
}
