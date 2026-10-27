import * as Location from 'expo-location';
function normalizar(loc){
 return {latitude:loc.coords.latitude,longitude:loc.coords.longitude,
 accuracy:loc.coords.accuracy,speed:loc.coords.speed,heading:loc.coords.heading,label:'Minha localização atual'};
}
export async function obterLocalizacaoAtual(){
 const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')throw Error('Permissão de GPS não concedida.');
 const loc=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
 return normalizar(loc);
}
export async function observarLocalizacao(onPosition,onError){
 const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')throw Error('Permissão de GPS não concedida.');
 const sub=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,timeInterval:2500,distanceInterval:5},loc=>onPosition(normalizar(loc)));
 return ()=>sub.remove();
}
