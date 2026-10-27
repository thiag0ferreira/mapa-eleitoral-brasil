import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {buscarEstado,colorir} from '../data/demo';
export default function MapScreen({geojson,onSelect}){
 const element=useRef(null),map=useRef(null),selected=useRef(onSelect);selected.current=onSelect;
 useEffect(()=>{
  if(!element.current)return;
  const m=L.map(element.current).setView([-14.3,-52],4);map.current=m;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:12,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
  return ()=>{m.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  if(!map.current||!geojson)return;
  const layer=L.geoJSON(geojson,{style:f=>({color:'#fff',weight:1.2,fillColor:colorir(buscarEstado(f.properties)),fillOpacity:.76}),onEachFeature:(f,p)=>{
   const estado=buscarEstado(f.properties);p.bindTooltip(estado?.nome||f.properties?.name||'Estado');p.on('click',()=>{if(estado)selected.current(estado);});
  }}).addTo(map.current);
  if(layer.getBounds().isValid())map.current.fitBounds(layer.getBounds(),{padding:[12,12]});
  return ()=>layer.remove();
 },[geojson]);
 return <View style={{flex:1,minHeight:400}}><div ref={element} style={{width:'100%',height:'100%',minHeight:400}} aria-label="Mapa interativo dos estados do Brasil"/></View>;
}
