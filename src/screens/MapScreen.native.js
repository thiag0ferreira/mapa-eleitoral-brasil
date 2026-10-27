import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import MapView,{Marker,Polyline} from 'react-native-maps';
const DARK=[
 {elementType:'geometry',stylers:[{color:'#202832'}]},
 {elementType:'labels.text.fill',stylers:[{color:'#abb9c8'}]},
 {elementType:'labels.text.stroke',stylers:[{color:'#202832'}]},
 {featureType:'road',elementType:'geometry',stylers:[{color:'#485667'}]},
 {featureType:'water',elementType:'geometry',stylers:[{color:'#132c3b'}]},
 {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#153e36'}]}
];
export default function MapScreen({destino,origem,rota,posicaoAtual,seguir=false,visaoGeral=false,resultados=[],onPlacePress}){
 const map=useRef(null);
 useEffect(()=>{
  if(!map.current)return;
  if(seguir&&posicaoAtual)map.current.animateCamera({center:{latitude:posicaoAtual.latitude,longitude:posicaoAtual.longitude},zoom:16,pitch:25},{duration:500});
 },[posicaoAtual,seguir]);
 useEffect(()=>{
  if(!map.current||!visaoGeral)return;
  const pts=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(pts.length>1)map.current.fitToCoordinates(pts,{edgePadding:{top:50,right:40,bottom:80,left:40},animated:true});
 },[visaoGeral,rota]);
 useEffect(()=>{
  if(!map.current||seguir)return;
  if(rota?.coordenadas?.length)map.current.fitToCoordinates(rota.coordenadas,{edgePadding:{top:65,right:45,bottom:75,left:45},animated:true});
  else if(destino)map.current.animateCamera({center:{latitude:destino.latitude,longitude:destino.longitude},zoom:15},{duration:400});
  else if(origem)map.current.animateCamera({center:{latitude:origem.latitude,longitude:origem.longitude},zoom:14},{duration:400});
 },[destino,origem,rota,seguir]);
 return <View style={{flex:1,minHeight:180}}>
  <MapView ref={map} style={{flex:1}} customMapStyle={DARK}
   initialRegion={{latitude:origem?.latitude||-15.8,longitude:origem?.longitude||-47.9,latitudeDelta:.2,longitudeDelta:.2}}>
   {resultados.filter(p=>p.id!==destino?.id).map(p=><Marker key={p.id} coordinate={{latitude:p.latitude,longitude:p.longitude}}
    title={p.name} pinColor="#b9c0cc" onPress={()=>onPlacePress?.(p)}/>)}
   {origem&&!seguir&&<Marker coordinate={{latitude:origem.latitude,longitude:origem.longitude}} title="Origem" pinColor="#29b7ea"/>}
   {destino&&<Marker coordinate={{latitude:destino.latitude,longitude:destino.longitude}} title={destino.name||'Destino'}
    pinColor="#fca311" onPress={()=>onPlacePress?.(destino)}/>}
   {posicaoAtual&&<Marker coordinate={{latitude:posicaoAtual.latitude,longitude:posicaoAtual.longitude}} title="Minha posição" pinColor="#37c7ef"/>}
   {rota?.coordenadas?.length>0&&<Polyline coordinates={rota.coordenadas} strokeWidth={6} strokeColor="#47c8f1"/>}
  </MapView>
 </View>;
}
