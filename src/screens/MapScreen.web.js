import React,{useEffect,useRef} from 'react';
import {View} from 'react-native';
import L from 'leaflet';import 'leaflet/dist/leaflet.css';
export default function MapScreen({destino,origem,rota}){
 const element=useRef(null),map=useRef(null),group=useRef(null);
 useEffect(()=>{if(!element.current)return;const m=L.map(element.current).setView([-15.80,-47.93],11);map.current=m;
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
 return()=>{m.remove();map.current=null}},[]);
 useEffect(()=>{if(!map.current)return;group.current?.remove();const g=L.featureGroup().addTo(map.current);group.current=g;
 const mark=(p,color)=>L.circleMarker([p.latitude,p.longitude],{radius:9,color,fillOpacity:1}).addTo(g);
 if(destino)mark(destino,'#1d4ed8').bindTooltip(destino.name||'Destino');
 if(origem)mark(origem,'#0f766e').bindTooltip('Origem');
 if(rota)L.polyline(rota.coordenadas.map(p=>[p.latitude,p.longitude]),{color:'#2563eb',weight:5}).addTo(g);
 const b=g.getBounds();if(b.isValid())map.current.fitBounds(b.pad(.4),{maxZoom:13});
 return()=>{g.remove();group.current=null}},[origem,destino,rota]);
 return <View style={{flex:1,minHeight:400}}><div ref={element} style={{height:'100%',width:'100%',minHeight:400}} aria-label="Mapa de estabelecimentos e rotas"/></View>;
}
