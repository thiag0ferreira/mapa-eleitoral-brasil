import React,{useEffect,useState} from 'react';
import {SafeAreaView,View,Text,ScrollView,TextInput,Pressable,StyleSheet,ActivityIndicator,Linking} from 'react-native';
import MapScreen from './src/screens/MapScreen';
import {DEMO,percentual} from './src/data/demo';
import {carregarGeometria} from './src/services/geometria';
import {pesquisarDestino,criarRota,LINK_POLITICA} from './src/services/navegacao';
const fmt=n=>n.toLocaleString('pt-BR');
const inicio={latitude:-15.7939,longitude:-47.8828,label:'Brasília, DF (origem ilustrativa)'};
export default function App(){
 const [geojson,setGeojson]=useState(null),[erroMapa,setErroMapa]=useState('');
 const [selecionado,setSelecionado]=useState(DEMO.find(e=>e.uf==='DF'));
 const [texto,setTexto]=useState(''),[destino,setDestino]=useState(null);
 const [origem,setOrigem]=useState(inicio),[resultadoBusca,setResultadoBusca]=useState(''),[rota,setRota]=useState(null);
 const [buscando,setBuscando]=useState(false),[roteando,setRoteando]=useState(false);
 const [camada,setCamada]=useState(true);
 useEffect(()=>{let ok=true;carregarGeometria().then(g=>ok&&setGeojson(g)).catch(e=>ok&&setErroMapa(e.message));return()=>{ok=false}},[]);
 const buscar=async()=>{
  if(texto.trim().length<3){setResultadoBusca('Digite um endereço ou local com ao menos 3 caracteres.');return}
  setBuscando(true);setResultadoBusca('');setRota(null);
  try{const d=await pesquisarDestino(texto);setDestino(d);setResultadoBusca('Destino encontrado: '+d.label)}
  catch(e){setResultadoBusca(e.message)}finally{setBuscando(false)}
 };
 const fazerRota=async()=>{
  if(!destino)return;
  setRoteando(true);setResultadoBusca('');
  try{const r=await criarRota(origem,destino);setRota(r)}
  catch(e){setResultadoBusca(e.message)}finally{setRoteando(false)}
 };
 const vencedor=selecionado.esquerda===selecionado.direita?'Empate':selecionado.esquerda>selecionado.direita?'Esquerda (simulação)':'Direita (simulação)';
 return <SafeAreaView style={s.root}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
 <Text style={s.kicker}>MAPA ELEITORAL • NAVEGAÇÃO EXPERIMENTAL</Text><Text style={s.title}>Para onde vamos?</Text>
 <Text style={s.subtitle}>Busque o destino e consulte uma rota ilustrada com a camada eleitoral de demonstração.</Text>
 <View style={s.notice}><Text style={s.noticeText}>DADOS ELEITORAIS FICTÍCIOS — As cores não descrevem moradores, estabelecimentos, segurança ou acolhimento. Resultados do TSE ainda não integrados.</Text></View>
 <View style={s.card}><Text style={s.label}>Origem (protótipo)</Text><Text style={s.muted}>{origem.label}</Text>
 <Text style={s.label}>Buscar destino no Brasil</Text>
 <View style={s.searchRow}><TextInput style={s.input} value={texto} onChangeText={setTexto} onSubmitEditing={buscar} returnKeyType="search" placeholder="Ex.: Praça dos Três Poderes, Brasília" accessibilityLabel="Endereço de destino"/><Pressable disabled={buscando} onPress={buscar} style={s.button}><Text style={s.buttonText}>{buscando?'Buscando...':'Buscar'}</Text></Pressable></View>
 {destino&&<><Text style={s.muted}>📍 {destino.label}</Text><Pressable disabled={roteando} onPress={fazerRota} style={s.button}><Text style={s.buttonText}>{roteando?'Calculando...':'Traçar rota até o destino'}</Text></Pressable></>}
 {rota&&<Text style={s.route}>Rota estimada: {(rota.distancia/1000).toFixed(1).replace('.',',')} km · {Math.round(rota.duracao/60)} min (sem trânsito ao vivo)</Text>}
 {!!resultadoBusca&&<Text style={s.muted}>{resultadoBusca}</Text>}
 <Text style={s.foot}>Busca manual somente ao clicar em Buscar. Serviço público sujeito a limites de utilização. <Text onPress={()=>Linking.openURL(LINK_POLITICA)} style={s.link}>Política de uso</Text>.</Text>
 </View>
 <View style={s.legend}><Text style={{color:'#dc4545'}}>● Esquerda</Text><Text style={{color:'#239560'}}>● Direita</Text><Text style={{color:'#64748b'}}>● Sem dados</Text></View>
 <Pressable onPress={()=>setCamada(!camada)} style={s.switch}><Text style={s.switchText}>{camada?'Ocultar':'Exibir'} camada eleitoral demonstrativa</Text></Pressable>
 <View style={s.map}>{geojson?<MapScreen geojson={geojson} onSelect={setSelecionado} destino={destino} origem={origem} rota={rota} camada={camada}/>:<View style={s.center}>{erroMapa?<Text style={s.error}>Falha ao carregar malha: {erroMapa}</Text>:<><ActivityIndicator/><Text>Carregando mapa...</Text></>}</View>}</View>
 <View style={s.card}><Text style={s.state}>{selecionado.nome} ({selecionado.uf})</Text><Text style={s.winner}>Maior votação simulada: {vencedor}</Text>
 <View style={s.line}><Text>Candidato fictício A (esquerda)</Text><Text>{fmt(selecionado.esquerda)} · {percentual(selecionado,'esquerda')}</Text></View>
 <View style={s.line}><Text>Candidato fictício B (direita)</Text><Text>{fmt(selecionado.direita)} · {percentual(selecionado,'direita')}</Text></View>
 </View>
 <Text style={s.footer}>Detalhamento futuro: pontos de locais de votação e apuração TSE. Uma seção eleitoral não define o perfil das ruas ao redor. Origem fixa em Brasília apenas para demonstração; geolocalização ainda não está ativa.</Text>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#f6f8fc'},content:{maxWidth:1100,width:'100%',alignSelf:'center',padding:20,gap:14},kicker:{color:'#2563eb',fontSize:12,fontWeight:'800'},title:{color:'#14233b',fontSize:30,fontWeight:'800'},subtitle:{color:'#64748b'},notice:{backgroundColor:'#fff4df',padding:14,borderRadius:12,borderWidth:1,borderColor:'#f4d391'},noticeText:{color:'#825300',fontWeight:'700',fontSize:12},legend:{flexDirection:'row',gap:20,flexWrap:'wrap'},map:{height:480,overflow:'hidden',borderRadius:16,backgroundColor:'#e8eef5'},center:{flex:1,justifyContent:'center',alignItems:'center',padding:20,gap:10},error:{color:'#b91c1c'},card:{backgroundColor:'#fff',borderRadius:16,padding:20,gap:12,borderWidth:1,borderColor:'#e5ebf4'},state:{fontSize:22,fontWeight:'800',color:'#14233b'},winner:{fontWeight:'700',color:'#334155'},line:{flexDirection:'row',justifyContent:'space-between',gap:10,flexWrap:'wrap'},footer:{color:'#64748b',fontSize:12},label:{fontWeight:'700',color:'#334155'},muted:{color:'#64748b',fontSize:13},searchRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},input:{borderColor:'#cbd5e1',borderWidth:1,borderRadius:8,padding:12,flexGrow:1,flexBasis:180},button:{padding:12,borderRadius:9,backgroundColor:'#1d4ed8',alignSelf:'flex-start'},buttonText:{color:'#fff',fontWeight:'700'},route:{fontWeight:'700',color:'#0f766e'},foot:{fontSize:11,color:'#64748b'},link:{textDecorationLine:'underline',color:'#2563eb'},switch:{padding:10,backgroundColor:'#e2e8f0',borderRadius:8,alignSelf:'flex-start'},switchText:{fontWeight:'600',color:'#334155'}});
