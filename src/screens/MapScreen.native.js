import React from 'react';
import MapView,{Polygon,Marker,Polyline} from 'react-native-maps';
import {buscarEstado,colorir} from '../data/demo';
const pts=ring=>ring.map(([longitude,latitude])=>({longitude,latitude}));
export default function MapScreen({geojson,onSelect,destino,origem,rota,camada}){
 return <MapView style={{flex:1,minHeight:400}} initialRegion={{latitude:-15,longitude:-52,latitudeDelta:44,longitudeDelta:44}}>
 {camada&&(geojson?.features||[]).flatMap((f,i)=>{
 const g=f.geometry,polygons=g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
 const e=buscarEstado(f.properties);
 return polygons.map((rings,j)=><Polygon key={i+'-'+j} coordinates={pts(rings[0])} holes={rings.slice(1).map(pts)} strokeColor="#fff" strokeWidth={1} fillColor={colorir(e)+'BB'} tappable onPress={()=>e&&onSelect(e)}/>);
 })}
 {destino&&<Marker coordinate={{latitude:destino.latitude,longitude:destino.longitude}} title="Destino" description={destino.label}/>}
 {rota&&<><Marker coordinate={{latitude:origem.latitude,longitude:origem.longitude}} title="Origem ilustrativa"/><Polyline coordinates={rota.coordenadas} strokeWidth={5} strokeColor="#2563eb"/></>}
 </MapView>;
}