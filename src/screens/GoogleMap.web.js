import React,{useEffect,useRef,useState} from 'react';
import {View,Text} from 'react-native';
import {carregarGoogle} from '../services/googlePlaces';
export default function GoogleMap({origem,destino,rota,posicaoAtual,seguir=false,visaoGeral=false}){
 const el=useRef(null),map=useRef(null),markers=useRef([]),positionMarker=useRef(null),line=useRef(null);
 const [error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{
  let active=true;
  carregarGoogle().then(async maps=>{
   if(!active||!el.current)return;
   const {Map}=await maps.importLibrary('maps');
   if(!active||!el.current)return;
   map.current=new Map(el.current,{center:{lat:-15.79,lng:-47.88},zoom:11,mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
   setReady(true);
  }).catch(e=>{if(active)setError(e.message)});
  return()=>{active=false;markers.current.forEach(m=>m.setMap(null));markers.current=[];line.current?.setMap(null);positionMarker.current?.setMap(null);map.current=null};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current||!window.google)return;
  const g=window.google.maps;
  markers.current.forEach(m=>m.setMap(null));markers.current=[];line.current?.setMap(null);
  const pts=[origem,destino].filter(Boolean);
  if(destino)markers.current.push(new g.Marker({map:map.current,position:{lat:destino.latitude,lng:destino.longitude},title:destino.name||'Destino'}));
  if(origem&&!seguir)markers.current.push(new g.Marker({map:map.current,position:{lat:origem.latitude,lng:origem.longitude},title:'Origem'}));
  if(rota?.coordenadas?.length)line.current=new g.Polyline({map:map.current,path:rota.coordenadas.map(p=>({lat:p.latitude,lng:p.longitude})),strokeColor:'#2563eb',strokeWeight:6});
  if(!seguir&&pts.length){const b=new g.LatLngBounds();(rota?.coordenadas?.length?rota.coordenadas:pts).forEach(p=>b.extend({lat:p.latitude,lng:p.longitude}));map.current.fitBounds(b,35)}
 },[ready,origem,destino,rota,seguir]);
 useEffect(()=>{
  if(!ready||!map.current||!window.google)return;
  positionMarker.current?.setMap(null);
  if(posicaoAtual){
   positionMarker.current=new window.google.maps.Marker({position:{lat:posicaoAtual.latitude,lng:posicaoAtual.longitude},map:map.current,title:'Minha posição GPS',icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:9,fillColor:'#1683f5',fillOpacity:1,strokeColor:'#ffffff',strokeWeight:3}});
   if(seguir){map.current.setCenter({lat:posicaoAtual.latitude,lng:posicaoAtual.longitude});map.current.setZoom(16)}
  }
 },[ready,posicaoAtual,seguir]);
 useEffect(()=>{
  if(!ready||!map.current||!visaoGeral||!window.google)return;
  const coordinates=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(coordinates.length){const b=new window.google.maps.LatLngBounds();coordinates.forEach(p=>b.extend({lat:p.latitude,lng:p.longitude}));map.current.fitBounds(b,35)}
 },[ready,visaoGeral,rota]);
 return <View style={{flex:1,minHeight:180}}>{error?<Text style={{padding:16,color:'#b91c1c'}}>{error}</Text>:null}<div ref={el} style={{height:'100%',width:'100%',minHeight:180}}/></View>;
}
