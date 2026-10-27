import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import L from 'leaflet';import 'leaflet/dist/leaflet.css';
import {buscarEstado,colorir} from '../data/demo';
const coord=p=>[p.latitude,p.longitude];
export default function MapScreen({geojson,onSelect,destino,origem,rota,camada}){
 const element=useRef(null),map=useRef(null),layers=useRef(null),selected=useRef(onSelect);selected.current=onSelect;
 useEffect(()=>{if(!element.current)return;const m=L.map(element.current).setView([-14.3,-52],4);map.current=m;
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
 return()=>{m.remove();map.current=null}},[]);
 useEffect(()=>{if(!map.current||!geojson)return;const layer=L.geoJSON(geojson,{style:f=>({color:camada?'#fff':'transparent',weight:1.2,fillColor:colorir(buscarEstado(f.properties)),fillOpacity:camada?.65:0}),onEachFeature:(f,p)=>{
 const e=buscarEstado(f.properties);if(e){p.bindTooltip(e.nome+' — simulação');p.on('click',()=>selected.current(e));}
 }}).addTo(map.current);return()=>layer.remove()},[geojson,camada]);
 useEffect(()=>{if(!map.current)return;if(layers.current){layers.current.remove();layers.current=null}
 const group=L.featureGroup().addTo(map.current);layers.current=group;
 if(destino){L.circleMarker(coord(destino),{radius:9,color:'#1d4ed8',fillOpacity:1}).bindPopup('Destino: '+destino.label.replace(/[<>&]/g,'')).addTo(group)}
 if(rota){L.circleMarker(coord(origem),{radius:7,color:'#0891b2',fillOpacity:1}).bindPopup('Origem ilustrativa').addTo(group);
 L.polyline(rota.coordenadas.map(p=>[p.latitude,p.longitude]),{color:'#2563eb',weight:5,opacity:.87}).addTo(group)}
 if(group.getLayers().length>0){const b=group.getBounds();if(b.isValid())map.current.fitBounds(b.pad(.22),{maxZoom:13})}
 else if(geojson){const bounds=L.geoJSON(geojson).getBounds();if(bounds.isValid())map.current.fitBounds(bounds,{padding:[12,12]})}
 return()=>{group.remove();layers.current=null}},[destino,origem,rota,geojson]);
 return <View style={{flex:1,minHeight:400}}><div ref={element} style={{width:'100%',height:'100%',minHeight:400}} aria-label="Mapa navegável de destinos no Brasil"/></View>;
}
