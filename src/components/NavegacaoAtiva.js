import React,{useEffect,useMemo,useState} from 'react';
import {SafeAreaView,View,Text,Pressable,Modal,StyleSheet,Linking,ActivityIndicator} from 'react-native';
import GoogleMap from '../screens/GoogleMap';
import MapScreen from '../screens/MapScreen';
import {googleReady} from '../services/googlePlaces';
import {observarLocalizacao} from '../services/localizacao';
import {criarRota,distanciaMetros,distanciaFormatada,orientacao,progressoNaRota,urlGoogleMaps,urlWaze} from '../services/navegacao';
const Btn=({children,onPress,disabled,secondary})=><Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
 style={[s.btn,secondary&&s.secondary,disabled&&{opacity:.5}]}><Text style={s.btnText}>{children}</Text></Pressable>;
export default function NavegacaoAtiva({visible,destino,origem,rota,onFechar,onRotaAtualizada}){
 const [posicao,setPosicao]=useState(origem),[gpsErro,setGpsErro]=useState('');
 const [seguir,setSeguir]=useState(true),[ocupado,setOcupado]=useState(false);
 useEffect(()=>{if(visible){setPosicao(origem);setGpsErro('');setSeguir(true)}},[visible]);
 useEffect(()=>{
  if(!visible)return;
  let active=true,stop=null;
  observarLocalizacao(p=>{if(active){setPosicao(p);setGpsErro('')}},e=>{if(active)setGpsErro(e.message)})
   .then(unsub=>{if(active)stop=unsub;else unsub()})
   .catch(e=>{if(active)setGpsErro(e.message)});
  return()=>{active=false;stop?.()};
 },[visible]);
 const progresso=useMemo(()=>progressoNaRota(rota,posicao),[rota,posicao]);
 const chegou=destino&&posicao&&distanciaMetros(posicao,destino)<35;
 const instrucao=chegou?'Você chegou ao destino':orientacao(progresso?.proxima);
 const prox=chegou?'Chegada':distanciaFormatada(progresso?.distanciaProxima);
 const restante=progresso?.restante??rota?.distancia;
 const minutos=Math.max(0,Math.round((rota?.duracao||0)*(restante/(rota?.distancia||1))/60));
 const velocidade=Number.isFinite(posicao?.speed)&&posicao.speed>=0?Math.round(posicao.speed*3.6):null;
 async function recalc(){
  if(!posicao||!destino)return;
  setOcupado(true);
  try{const r=await criarRota(posicao,destino);onRotaAtualizada(r);setGpsErro('')}
  catch(e){setGpsErro('Não foi possível recalcular: '+e.message)}
  finally{setOcupado(false)}
 }
 return <Modal visible={visible} animationType="slide" onRequestClose={onFechar} presentationStyle="fullScreen">
 <SafeAreaView style={s.root}>
  <View style={s.top}>
   <View style={s.topBar}>
    <Text style={s.kicker}>NAVEGAÇÃO • BETA</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Encerrar navegação" onPress={onFechar}><Text style={s.close}>✕ Encerrar</Text></Pressable>
   </View>
   <View style={s.nextTurn}>
    <Text style={s.turnGlyph}>➤</Text>
    <View style={{flex:1}}>
     <Text style={s.distance}>{prox}</Text>
     <Text style={s.instruction} numberOfLines={2}>{instrucao}</Text>
    </View>
   </View>
  </View>
  <View style={s.map}>
   {googleReady?<GoogleMap origem={origem} destino={destino} rota={rota} posicaoAtual={posicao} seguir={seguir} visaoGeral={!seguir}/>:
   <MapScreen origem={origem} destino={destino} rota={rota} posicaoAtual={posicao} seguir={seguir} visaoGeral={!seguir}/>}
   <View style={s.tools}>
    <Btn secondary onPress={()=>setSeguir(true)}>◎ GPS</Btn>
    <Btn secondary onPress={()=>setSeguir(false)}>◫ Rota</Btn>
   </View>
   <View style={s.speed}>
    <Text style={s.speedNumber}>{velocidade===null?'—':velocidade}</Text>
    <Text style={s.speedUnit}>km/h</Text>
   </View>
  </View>
  <View style={s.bottom}>
   <View style={s.grabber}/>
   <Text style={s.destination} numberOfLines={1}>📍 {destino?.name||destino?.label||'Destino selecionado'}</Text>
   <View style={s.summary}>
    <View><Text style={s.big}>{distanciaFormatada(restante)}</Text><Text style={s.small}>Restantes (estimativa)</Text></View>
    <View><Text style={s.big}>{minutos} min</Text><Text style={s.small}>Sem trânsito ao vivo</Text></View>
   </View>
   {progresso?.foraDaRota&&<Text style={s.warning}>Você pode estar fora da rota. Use Recalcular.</Text>}
   {!!gpsErro&&<Text style={s.warning}>{gpsErro}</Text>}
   <View style={s.actions}>
    <Btn onPress={()=>Linking.openURL(urlGoogleMaps(destino))}>Google Maps ↗</Btn>
    <Btn onPress={()=>Linking.openURL(urlWaze(destino))}>Waze ↗</Btn>
    <Btn secondary onPress={recalc} disabled={ocupado}>{ocupado?'Recalculando…':'↻ Recalcular'}</Btn>
   </View>
   {ocupado&&<ActivityIndicator color="#47c8f1"/>}
   <Text style={s.disclaimer}>GPS e instruções experimentais, sem voz ou desvios automáticos. Para dirigir, use um navegador dedicado e não interaja com a tela ao volante.</Text>
  </View>
 </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#181d25'},
 top:{backgroundColor:'#152d34',paddingHorizontal:17,paddingTop:12,paddingBottom:15},
 topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 kicker:{color:'#b5e9fa',fontSize:11,fontWeight:'900',letterSpacing:.8},
 close:{color:'#f6f7f9',fontSize:12,fontWeight:'800',padding:6},
 nextTurn:{flexDirection:'row',gap:15,alignItems:'center',paddingTop:7},
 turnGlyph:{fontSize:34,fontWeight:'900',color:'#58d1ee'},
 distance:{color:'#fff',fontSize:29,fontWeight:'900'},
 instruction:{color:'#e9f2f6',fontSize:17,fontWeight:'700'},
 map:{flex:1,position:'relative',minHeight:180},
 tools:{position:'absolute',right:11,top:14,gap:8,alignItems:'flex-end'},
 speed:{position:'absolute',left:15,bottom:16,width:78,height:78,borderRadius:40,backgroundColor:'#20252d',borderColor:'#727a84',borderWidth:3,alignItems:'center',justifyContent:'center'},
 speedNumber:{color:'#fff',fontSize:27,fontWeight:'900'},speedUnit:{color:'#c3cbd4',fontSize:10},
 bottom:{backgroundColor:'#202329',paddingTop:9,paddingHorizontal:16,paddingBottom:12,gap:8,borderTopLeftRadius:24,borderTopRightRadius:24},
 grabber:{height:5,width:48,alignSelf:'center',backgroundColor:'#697079',borderRadius:8},
 destination:{color:'#ccd8e1',fontSize:13,fontWeight:'700'},
 summary:{flexDirection:'row',justifyContent:'space-around',paddingVertical:4},
 big:{color:'#fff',fontWeight:'900',fontSize:25},small:{color:'#acb8c5',fontSize:11},
 actions:{flexDirection:'row',gap:7,flexWrap:'wrap'},
 btn:{borderRadius:11,backgroundColor:'#187da6',paddingVertical:10,paddingHorizontal:12,alignSelf:'flex-start'},
 secondary:{backgroundColor:'#3e4651'},
 btnText:{fontSize:12,fontWeight:'800',color:'#fff'},
 warning:{color:'#ffca80',fontWeight:'700',fontSize:12},
 disclaimer:{color:'#8c99a7',fontSize:10,lineHeight:14}
});
