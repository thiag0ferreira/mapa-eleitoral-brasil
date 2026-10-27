import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import MapView,{Marker,Polyline} from 'react-native-maps';
export default function MapScreen({destino,origem,rota,posicaoAtual,seguir=false,visaoGeral=false}){
 const map=useRef(null);
 useEffect(()=>{
  if(!map.current)return;
  if(seguir&&posicaoAtual)map.current.animateCamera({center:{latitude:posicaoAtual.latitude,longitude:posicaoAtual.longitude},zoom:16,pitch:20},{duration:500});
 },[posicaoAtual,seguir]);
 useEffect(()=>{
  if(!map.current||!visaoGeral)return;
  const points=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(points.length>1)map.current.fitToCoordinates(points,{edgePadding:{top:60,left:40,right:40,bottom:60},animated:true});
 },[visaoGeral,rota]);
 return <View style={{flex:1,minHeight:180}}>
  <MapView ref={map} style={{flex:1}} initialRegion={{latitude:origem?.latitude||-15.8,longitude:origem?.longitude||-47.9,latitudeDelta:.16,longitudeDelta:.16}} showsCompass>
   {origem&&!seguir&&<Marker coordinate={{latitude:origem.latitude,longitude:origem.longitude}} title="Origem"/>}
   {destino&&<Marker coordinate={{latitude:destino.latitude,longitude:destino.longitude}} title={destino.name||'Destino'}/>}
   {posicaoAtual&&<Marker coordinate={{latitude:posicaoAtual.latitude,longitude:posicaoAtual.longitude}} title="Minha posição" pinColor="#1683f5"/>}
   {rota?.coordenadas?.length>0&&<Polyline coordinates={rota.coordenadas} strokeWidth={6} strokeColor="#2563eb"/>}
  </MapView>
 </View>;
}
