import * as Location from 'expo-location';
export async function obterLocalizacaoAtual(){
 const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')throw Error('Permissão de GPS não concedida.');
 const loc=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
 return {latitude:loc.coords.latitude,longitude:loc.coords.longitude,label:'Minha localização atual'};
}
