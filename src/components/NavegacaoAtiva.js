import React,{useEffect,useMemo,useState} from 'react';
import {SafeAreaView,View,Text,Pressable,Modal,StyleSheet,Linking,ActivityIndicator} from 'react-native';
import GoogleMap from '../screens/GoogleMap';
import MapScreen from '../screens/MapScreen';
import {googleReady} from '../services/googlePlaces';
import {observarLocalizacao} from '../services/localizacao';
import {criarRota,distanciaMetros,distanciaFormatada,orientacao,progressoNaRota,urlGoogleMaps,urlWaze} from '../services/navegacao';
const Action=({children,onPress,neutral,disabled})=><Pressable onPress={onPress} disabled={disabled} style={[s.action,neutral&&s.neutral,disabled&&{opacity:.5}]}><Text style={s.actionText}>{children}</Text></Pressable>;
export default function NavegacaoAtiva({visible,destino,origem,rota,onFechar,onRotaAtualizada,onPosicaoAtualizada}){
 const [posicao,setPosicao]=useState(origem),[gpsErro,setGpsErro]=useState('');
 const [seguir,setSeguir]=useState(true),[ocupado,setOcupado]=useState(false);
 useEffect(()=>{if(visible){setPosicao(origem);setGpsErro('');setSeguir(true)}},[visible]);
 useEffect(()=>{
  if(!visible)return;
  let ativo=true,parar=null;
  observarLocalizacao(p=>{if(!ativo)return;setPosicao(p);onPosicaoAtualizada?.(p);setGpsErro('')},e=>{if(ativo)setGpsErro(e.message)})
   .then(fn=>{if(ativo)parar=fn;else fn()})
   .catch(e=>{if(ativo)setGpsErro(e.message)});
  return()=>{ativo=false;parar?.()};
 },[visible]);
 const progresso=useMemo(()=>progressoNaRota(rota,posicao),[rota,posicao]);
 const chegou=destino&&posicao&&distanciaMetros(posicao,destino)<35;
 const proxima=chegou?'Você chegou ao destino':orientacao(progresso?.proxima);
 const distanciaProxima=chegou?'Chegada':distanciaFormatada(progresso?.distanciaProxima);
 const restante=progresso?.restante??rota?.distancia;
 const minutos=Math.max(0,Math.round((rota?.duracao||0)*(restante/(rota?.distancia||1))/60));
 const recalcular=async()=>{
  if(!posicao||!destino)return;
  setOcupado(true);
  try{const nova=await criarRota(posicao,destino);onRotaAtualizada(nova);setGpsErro('')}
  catch(e){setGpsErro('Não foi possível recalcular: '+e.message)}
  finally{setOcupado(false)}
 };
 return <Modal visible={visible} animationType="slide" onRequestClose={onFechar} presentationStyle="fullScreen">
 <SafeAreaView style={s.root}>
  <View style={s.header}>
   <View style={s.headerTop}><Text style={s.kicker}>NAVEGAÇÃO GPS • TESTE</Text><Pressable onPress={onFechar} accessibilityLabel="Encerrar navegação"><Text style={s.close}>✕ Encerrar</Text></Pressable></View>
   <Text style={s.distance}>{distanciaProxima}</Text>
   <Text style={s.instruction} numberOfLines={2}>{proxima}</Text>
  </View>
  <View style={s.map}>
   {googleReady?<GoogleMap origem={origem} destino={destino} rota={rota} posicaoAtual={posicao} seguir={seguir} visaoGeral={!seguir}/>:
   <MapScreen origem={origem} destino={destino} rota={rota} posicaoAtual={posicao} seguir={seguir} visaoGeral={!seguir}/>}
   <View style={s.mapControls}>
    <Action onPress={()=>setSeguir(true)} neutral>◎ Seguir GPS</Action>
    <Action onPress={()=>setSeguir(false)} neutral>◫ Ver rota</Action>
   </View>
  </View>
  <View style={s.bottom}>
   <Text style={s.destination} numberOfLines={1}>Destino: {destino?.name||destino?.label||'Selecionado'}</Text>
   <View style={s.summary}>
    <View><Text style={s.big}>{distanciaFormatada(restante)}</Text><Text style={s.small}>restantes (aprox.)</Text></View>
    <View><Text style={s.big}>{minutos} min</Text><Text style={s.small}>estimados, sem trânsito</Text></View>
   </View>
   {progresso?.foraDaRota&&<Text style={s.warning}>Você pode estar fora da rota. Recalcule o caminho.</Text>}
   {!!gpsErro&&<Text style={s.warning}>{gpsErro}</Text>}
   <View style={s.actionRow}>
    <Action onPress={()=>Linking.openURL(urlGoogleMaps(destino))}>↗ Google Maps</Action>
    <Action onPress={()=>Linking.openURL(urlWaze(destino))} neutral>↗ Waze</Action>
    <Action onPress={recalcular} disabled={ocupado} neutral>{ocupado?'Recalculando...':'↻ Recalcular'}</Action>
   </View>
   {ocupado&&<ActivityIndicator/>}
   <Text style={s.disclaimer}>Acompanhamento experimental, sem voz ou trânsito. Mantenha o app aberto. Para dirigir, prefira a navegação guiada do Google Maps/Waze e não interaja com a tela ao volante.</Text>
  </View>
 </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#e5edf6'},
 header:{backgroundColor:'#123d73',paddingHorizontal:19,paddingVertical:15,gap:4},
 headerTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 kicker:{fontSize:11,fontWeight:'800',color:'#c9e1ff',letterSpacing:.6},
 close:{color:'#fff',fontWeight:'700',padding:6},
 distance:{fontSize:29,fontWeight:'900',color:'#fff'},
 instruction:{fontSize:20,fontWeight:'700',color:'#fff'},
 map:{flex:1,position:'relative',minHeight:180},
 mapControls:{position:'absolute',right:10,top:14,gap:8,alignItems:'flex-end'},
 bottom:{padding:15,backgroundColor:'#fff',gap:9,borderTopColor:'#dbe4ef',borderTopWidth:1},
 destination:{fontWeight:'700',fontSize:14,color:'#334155'},
 summary:{flexDirection:'row',justifyContent:'space-around',paddingVertical:4},
 big:{color:'#14233b',fontSize:25,fontWeight:'900'},
 small:{color:'#64748b',fontSize:11},
 actionRow:{flexDirection:'row',flexWrap:'wrap',gap:7},
 action:{paddingVertical:10,paddingHorizontal:13,backgroundColor:'#185ed4',borderRadius:10,alignSelf:'flex-start'},
 neutral:{backgroundColor:'#475569'},
 actionText:{fontWeight:'700',color:'#fff',fontSize:12},
 warning:{color:'#b45309',fontWeight:'700',fontSize:12},
 disclaimer:{fontSize:10,color:'#64748b',lineHeight:15}
});
