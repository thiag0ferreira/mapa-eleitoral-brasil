import React,{useEffect,useState} from 'react';
import {SafeAreaView,View,Text,ScrollView,StyleSheet,ActivityIndicator} from 'react-native';
import MapScreen from './src/screens/MapScreen';
import {DEMO,percentual} from './src/data/demo';
import {carregarGeometria} from './src/services/geometria';
const fmt=n=>n.toLocaleString('pt-BR');
export default function App(){
 const [geojson,setGeojson]=useState(null),[erro,setErro]=useState(''),[selecionado,setSelecionado]=useState(DEMO.find(e=>e.uf==='DF'));
 useEffect(()=>{let active=true;carregarGeometria().then(g=>{if(active)setGeojson(g);}).catch(e=>{if(active)setErro(e.message);});return()=>{active=false;};},[]);
 const vencedor=selecionado.esquerda===selecionado.direita?'Empate':selecionado.esquerda>selecionado.direita?'Esquerda (simulação)':'Direita (simulação)';
 return <SafeAreaView style={s.root}><ScrollView contentContainerStyle={s.content}>
 <Text style={s.kicker}>MAPA ELEITORAL • PROTÓTIPO</Text>
 <Text style={s.title}>Brasil por estado</Text>
 <Text style={s.subtitle}>Toque em um estado para visualizar a apuração ilustrativa.</Text>
 <View style={s.notice}><Text style={s.noticeText}>DADOS FICTÍCIOS — Os votos e resultados são simulados. Não representam o TSE nem qualquer eleição.</Text></View>
 <View style={s.legend}><Text style={{color:'#dc4545'}}>● Esquerda</Text><Text style={{color:'#239560'}}>● Direita</Text><Text style={{color:'#64748b'}}>● Sem dados</Text></View>
 <View style={s.map}>{geojson?<MapScreen geojson={geojson} onSelect={setSelecionado}/>:<View style={s.center}>{erro?<Text style={s.error}>Não foi possível carregar o mapa: {erro}</Text>:<><ActivityIndicator/><Text>Carregando estados...</Text></>}</View>}</View>
 <View style={s.card}><Text style={s.state}>{selecionado.nome} ({selecionado.uf})</Text><Text style={s.winner}>Maior votação: {vencedor}</Text>
 <View style={s.line}><Text>Candidato fictício A (esquerda)</Text><Text>{fmt(selecionado.esquerda)} · {percentual(selecionado,'esquerda')}</Text></View>
 <View style={s.line}><Text>Candidato fictício B (direita)</Text><Text>{fmt(selecionado.direita)} · {percentual(selecionado,'direita')}</Text></View>
 </View>
 <Text style={s.footer}>Geometria: Click That Hood. Votos: simulação. Integração oficial com TSE: próxima etapa.</Text>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#f6f8fc'},content:{maxWidth:1100,width:'100%',alignSelf:'center',padding:20,gap:14},kicker:{color:'#2563eb',fontSize:12,fontWeight:'800'},title:{color:'#14233b',fontSize:30,fontWeight:'800'},subtitle:{color:'#64748b'},notice:{backgroundColor:'#fff4df',padding:14,borderRadius:12,borderWidth:1,borderColor:'#f4d391'},noticeText:{color:'#825300',fontWeight:'700',fontSize:12},legend:{flexDirection:'row',gap:20,flexWrap:'wrap'},map:{height:470,overflow:'hidden',borderRadius:16,backgroundColor:'#e8eef5'},center:{flex:1,justifyContent:'center',alignItems:'center',padding:20,gap:10},error:{color:'#b91c1c'},card:{backgroundColor:'#fff',borderRadius:16,padding:20,gap:12,borderWidth:1,borderColor:'#e5ebf4'},state:{fontSize:22,fontWeight:'800',color:'#14233b'},winner:{fontWeight:'700',color:'#334155'},line:{flexDirection:'row',justifyContent:'space-between',gap:10,flexWrap:'wrap'},footer:{color:'#64748b',fontSize:12}});
