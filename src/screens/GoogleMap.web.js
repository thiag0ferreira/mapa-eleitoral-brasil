import React,{useEffect,useRef,useState} from 'react';
import {View,Text} from 'react-native';
import {carregarGoogle} from '../services/googlePlaces';
export default function GoogleMap({origem,destino,rota}){
 const el=useRef(null),map=useRef(null),markers=useRef([]),line=useRef(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;carregarGoogle().then(async maps=>{
  if(!active||!el.current)return;
  const {Map}=await maps.importLibrary('maps');
  if(!active||!el.current)return;
  map.current=new Map(el.current,{center:{lat:-15.79,lng:-47.88},zoom:11,mapTypeControl:false,streetViewControl:false});
 }).catch(e=>active&&setError(e.message));return()=>{active=false;markers.current.forEach(m=>m.setMap(null));markers.current=[];line.current?.setMap(null);map.current=null}},[]);
 useEffect(()=>{if(!map.current||!window.google)return;
  const g=window.google.maps;markers.current.forEach(m=>m.setMap(null));markers.current=[];line.current?.setMap(null);
  const pts=[origem,destino].filter(Boolean);
  pts.forEach((p,i)=>markers.current.push(new g.Marker({position:{lat:p.latitude,lng:p.longitude},map:map.current,title:i===0?'Origem':'Destino'})));
  if(rota?.coordenadas?.length){line.current=new g.Polyline({map:map.current,path:rota.coordenadas.map(p=>({lat:p.latitude,lng:p.longitude})),strokeColor:'#2563eb',strokeWeight:5});}
  if(pts.length>1){const bounds=new g.LatLngBounds();pts.forEach(p=>bounds.extend({lat:p.latitude,lng:p.longitude}));map.current.fitBounds(bounds,48)}
  else if(pts.length)map.current.setCenter({lat:pts[0].latitude,lng:pts[0].longitude});
 },[origem,destino,rota,error]);
 return <View style={{flex:1,minHeight:400}}>{error?<Text style={{padding:16,color:'#b91c1c'}}>{error}</Text>:null}<div ref={el} style={{width:'100%',height:'100%',minHeight:400}}/></View>;
}
