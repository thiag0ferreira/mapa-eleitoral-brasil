import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export default function MapScreen({destino,origem,rota,posicaoAtual,seguir=false,visaoGeral=false}){
 const el=useRef(null),map=useRef(null),layers=useRef(null),positionMarker=useRef(null);
 useEffect(()=>{
  if(!el.current)return;
  const m=L.map(el.current,{zoomControl:true}).setView([-15.80,-47.93],11);map.current=m;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
  return()=>{m.remove();map.current=null};
 },[]);
 useEffect(()=>{
  if(!map.current)return;
  layers.current?.remove();
  const g=L.featureGroup().addTo(map.current);layers.current=g;
  const mk=(p,c,n)=>L.circleMarker([p.latitude,p.longitude],{radius:9,color:c,fillOpacity:1}).bindTooltip(n).addTo(g);
  if(origem&&!seguir)mk(origem,'#0f766e','Origem');
  if(destino)mk(destino,'#1d4ed8',destino.name||'Destino');
  if(rota?.coordenadas?.length){
   L.polyline(rota.coordenadas.map(p=>[p.latitude,p.longitude]),{color:'#fff',weight:10,opacity:.9}).addTo(g);
   L.polyline(rota.coordenadas.map(p=>[p.latitude,p.longitude]),{color:'#2563eb',weight:6}).addTo(g);
  }
  const coords=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(!seguir&&coords.length){
   const bounds=L.latLngBounds(coords.map(p=>[p.latitude,p.longitude]));
   if(bounds.isValid())map.current.fitBounds(bounds,{padding:[30,30],maxZoom:14});
  }
  return()=>{g.remove();layers.current=null};
 },[destino,origem,rota,seguir]);
 useEffect(()=>{
  if(!map.current)return;
  if(positionMarker.current){positionMarker.current.remove();positionMarker.current=null}
  if(posicaoAtual){
   positionMarker.current=L.circleMarker([posicaoAtual.latitude,posicaoAtual.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#1683f5',fillOpacity:1}).bindTooltip('Minha posição GPS').addTo(map.current);
   if(seguir)map.current.setView([posicaoAtual.latitude,posicaoAtual.longitude],16,{animate:true});
  }
  return()=>{positionMarker.current?.remove();positionMarker.current=null};
 },[posicaoAtual,seguir]);
 useEffect(()=>{
  if(!map.current||!visaoGeral)return;
  const coords=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(coords.length)map.current.fitBounds(L.latLngBounds(coords.map(p=>[p.latitude,p.longitude])),{padding:[30,30],maxZoom:14});
 },[visaoGeral,rota,origem,destino]);
 return <View style={{flex:1,minHeight:180}}><div ref={el} style={{height:'100%',width:'100%',minHeight:180}} aria-label="Mapa da rota"/></View>;
}
