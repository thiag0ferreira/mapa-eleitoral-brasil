import React,{useEffect,useRef,useState} from 'react';
import {View,Text} from 'react-native';
import {carregarGoogle} from '../services/googlePlaces';

const DARK=[
 {elementType:'geometry',stylers:[{color:'#202832'}]},
 {elementType:'labels.text.fill',stylers:[{color:'#a2b1be'}]},
 {elementType:'labels.text.stroke',stylers:[{color:'#202832'}]},
 {featureType:'road',elementType:'geometry',stylers:[{color:'#485667'}]},
 {featureType:'road',elementType:'geometry.stroke',stylers:[{color:'#273441'}]},
 {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#697184'}]},
 {featureType:'water',elementType:'geometry',stylers:[{color:'#132c3b'}]},
 {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#153e36'}]},
 {featureType:'poi.business',stylers:[{visibility:'off'}]},
 {featureType:'transit',stylers:[{visibility:'off'}]}
];
export default function GoogleMap({origem,destino,rota,posicaoAtual,seguir=false,visaoGeral=false,resultados=[],onPlacePress}){
 const el=useRef(null),map=useRef(null),markers=useRef([]),positionMarker=useRef(null),line=useRef(null),selectRef=useRef(onPlacePress);
 const [error,setError]=useState(''),[ready,setReady]=useState(false);
 selectRef.current=onPlacePress;
 useEffect(()=>{
  let active=true;
  carregarGoogle().then(async maps=>{
   if(!active||!el.current)return;
   const {Map}=await maps.importLibrary('maps');
   if(!active||!el.current)return;
   map.current=new Map(el.current,{
    center:{lat:-15.79,lng:-47.88},zoom:12,mapTypeControl:false,streetViewControl:false,
    fullscreenControl:false,zoomControl:false,styles:DARK,backgroundColor:'#202832'
   });
   setReady(true);
  }).catch(e=>{if(active)setError(e.message)});
  return()=>{active=false;markers.current.forEach(m=>m.setMap(null));markers.current=[];line.current?.setMap(null);positionMarker.current?.setMap(null);map.current=null};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current||!window.google)return;
  const g=window.google.maps;
  markers.current.forEach(m=>m.setMap(null));markers.current=[];
  line.current?.setMap(null);
  const pin=(p,color,title,action)=>{
   const m=new g.Marker({
    map:map.current,position:{lat:p.latitude,lng:p.longitude},title,
    icon:{path:g.SymbolPath.CIRCLE,scale:action?9:8,fillColor:color,fillOpacity:1,strokeColor:'#111827',strokeWeight:2}
   });
   if(action)m.addListener('click',()=>selectRef.current?.(p));
   markers.current.push(m);
  };
  for(const p of resultados){if(p.id!==destino?.id)pin(p,'#adb7c4',p.name,true)}
  if(destino)pin(destino,'#fca311',destino.name||'Destino',true);
  if(origem&&!seguir)pin(origem,'#29b7ea','Origem',false);
  if(rota?.coordenadas?.length){
   line.current=new g.Polyline({map:map.current,
    path:rota.coordenadas.map(p=>({lat:p.latitude,lng:p.longitude})),
    strokeColor:'#47c8f1',strokeWeight:7});
  }
  if(!seguir){
   if(rota?.coordenadas?.length){
    const b=new g.LatLngBounds();
    rota.coordenadas.forEach(p=>b.extend({lat:p.latitude,lng:p.longitude}));
    map.current.fitBounds(b,42);
   }else if(destino){
    map.current.setCenter({lat:destino.latitude,lng:destino.longitude});
    map.current.setZoom(15);
   }else if(origem){
    map.current.setCenter({lat:origem.latitude,lng:origem.longitude});
    map.current.setZoom(14);
   }
  }
 },[ready,origem,destino,rota,seguir,resultados]);
 useEffect(()=>{
  if(!ready||!map.current||!window.google)return;
  positionMarker.current?.setMap(null);
  if(posicaoAtual){
   positionMarker.current=new window.google.maps.Marker({
    position:{lat:posicaoAtual.latitude,lng:posicaoAtual.longitude},map:map.current,
    title:'Minha posição GPS',
    icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:10,fillColor:'#37c7ef',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}
   });
   if(seguir){
    map.current.setCenter({lat:posicaoAtual.latitude,lng:posicaoAtual.longitude});
    map.current.setZoom(16);
   }
  }
 },[ready,posicaoAtual,seguir]);
 useEffect(()=>{
  if(!ready||!map.current||!visaoGeral||!window.google)return;
  const coords=rota?.coordenadas?.length?rota.coordenadas:[origem,destino].filter(Boolean);
  if(coords.length){
   const b=new window.google.maps.LatLngBounds();
   coords.forEach(p=>b.extend({lat:p.latitude,lng:p.longitude}));
   map.current.fitBounds(b,42);
  }
 },[ready,visaoGeral,rota]);
 return <View style={{flex:1,minHeight:180}}>
  {!!error&&<Text style={{padding:16,color:'#fee2e2'}}>{error}</Text>}
  <div ref={el} style={{height:'100%',width:'100%',minHeight:180,backgroundColor:'#202832'}}/>
 </View>;
}
