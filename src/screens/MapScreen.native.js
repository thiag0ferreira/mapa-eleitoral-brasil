import React from 'react';
import MapView,{Polygon} from 'react-native-maps';
import {buscarEstado,colorir} from '../data/demo';
const points=ring=>ring.map(([longitude,latitude])=>({longitude,latitude}));
export default function MapScreen({geojson,onSelect}){
 return <MapView style={{flex:1,minHeight:400}} initialRegion={{latitude:-15,longitude:-52,latitudeDelta:44,longitudeDelta:44}}>
 {(geojson?.features||[]).flatMap((f,i)=>{
  const geom=f.geometry,polygons=geom?.type==='Polygon'?[geom.coordinates]:geom?.type==='MultiPolygon'?geom.coordinates:[];
  const estado=buscarEstado(f.properties);
  return polygons.map((rings,j)=><Polygon key={i+'-'+j} coordinates={points(rings[0])} holes={rings.slice(1).map(points)}
    strokeColor="#fff" strokeWidth={1} fillColor={colorir(estado)+'BB'} tappable onPress={()=>estado&&onSelect(estado)}/>);
 })}
 </MapView>;
}
