import React from 'react';
import MapView,{Marker,Polyline} from 'react-native-maps';
export default function MapScreen({destino,origem,rota}){
 return <MapView style={{flex:1,minHeight:400}} initialRegion={{latitude:-15.8,longitude:-47.9,latitudeDelta:.65,longitudeDelta:.65}} showsUserLocation={false}>
 {origem&&<Marker coordinate={{latitude:origem.latitude,longitude:origem.longitude}} title="Origem"/>}
 {destino&&<Marker coordinate={{latitude:destino.latitude,longitude:destino.longitude}} title={destino.name||'Destino'}/>}
 {rota&&<Polyline coordinates={rota.coordenadas} strokeWidth={5} strokeColor="#2563eb"/>}
 </MapView>;
}
