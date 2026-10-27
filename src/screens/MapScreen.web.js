import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tema escuro por filtro visual nos tiles OSM. Sem replicar interface/marca de terceiros.
export default function MapScreen({destino,origem,rota,posicaoAtual,seguir=false,visaoGeral=false,resultados=[],onPlacePress}){
 const el=useRef(null),map=useRef(null),layers=useRef(null),positionMarker=useRef(null),selected=useRef(onPlacePress);
 selected.current=onPlacePress;
 useEffect(()=>{
  if(!el.current)return;
  const m=L.map(el.current,{zoomControl:false,attributionControl:true}).setView([origem?.latitude||-15.8,origem?.longitude||-47.9],13);
  map.current=m;
  const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
   maxZoom:18,attribution:'&copy; OpenStreetMap contributors'
  }).addTo(m);
  const container=tiles.getContainer();
  if(container)container.style.filter='invert(1) hue-rotate(180deg) brightness(0.68) contrast(1.35) saturate(.85)';
  const onResize=()=>m.invalidateSize();
  window.addEventListener('resize',onResize);
  return()=>{window.removeEventListener('resize',onResize);m.remove();map.current=null};
 },[]);
 useEffect(()=>{
  if(!map.current)return;
  layers.current?.remove();
  const g=L.featureGroup().addTo(map.current);layers.current=g;
  function pin(p,color,size,title,fn){
   const marker=L.circleMarker([p.latitude,p.longitude],{radius:size,color:'#111827',weight:2,fillColor:color,fillOpacity:1}).bindTooltip(title);
   if(fn)marker.on('click',fn);
   marker.addTo(g);
  }
  for(const p of resultados){
   if(p.id!==destino?.id)pin(p,'#b8c0cc',7,p.name,()=>selected.current?.(p));
  }
  if(rota?.coordenadas?.length){
   const coords=rota.coordenadas.map(p=>[p.latitude,p.longitude]);
   L.polyline(coords,{color:'#111827',weight:11,opacity:.95}).addTo(g);
   L.polyline(coords,{color:'#47c8f1',weight:7,opacity:1}).addTo(g);
  }
  if(origem&&!seguir)pin(origem,'#29b7ea',8,'Origem GPS');
  if(destino)pin(destino,'#fca311',11,destino.name||'Destino',()=>selected.current?.(destino));
  if(!seguir){
   if(rota?.coordenadas?.length){
    const bounds=L.latLngBounds(rota.coordenadas.map(p=>[p.latitude,p.longitude]));
    if(bounds.isValid())map.current.fitBounds(bounds,{padding:[30,30],maxZoom:14});
   }else if(destino){
    map.current.setView([destino.latitude,destino.longitude],15,{animate:true});
   }else if(resultados.length){
    const bounds=L.latLngBounds(resultados.map(p=>[p.latitude,p.longitude]));
    if(bounds.isValid())map.current.fitBounds(bounds,{padding:[35,35],maxZoom:14});
   }else if(origem){
    map.current.setView([origem.latitude,origem.longitude],14,{animate:false});
   }
  }
  return()=>{g.remove();layers.current=null};
 },[destino,origem,rota,seguir,resultados]);
 useEffect(()=>{
  if(!map.current)return;
  positionMarker.current?.remove();
  if(posicaoAtual){
   positionMarker.current=L.circleMarker([posicaoAtual.latitude,posicaoAtual.longitude],
    {radius:10,color:'#fff',weight:3,fillColor:'#37c7ef',fillOpacity:1}).addTo(map.current);
   if(seguir)map.current.setView([posicaoAtual.latitude,posicaoAtual.longitude],16,{animate:true});
  }
  return()=>{positionMarker.current?.remove();positionMarker.current=null};
 },[posicaoAtual,seguir]);
 useEffect(()=>{
  if(!map.current||!visaoGeral)return;
  const coords=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(coords.length)map.current.fitBounds(L.latLngBounds(coords.map(p=>[p.latitude,p.longitude])),{padding:[30,30],maxZoom:14});
 },[visaoGeral,rota,origem,destino]);
 return <View style={{flex:1,minHeight:180}}><div ref={el} style={{height:'100%',width:'100%',minHeight:180,backgroundColor:'#111827'}} aria-label="Mapa interativo de estabelecimentos no Distrito Federal"/></View>;
}
