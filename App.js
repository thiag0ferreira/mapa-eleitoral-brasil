import React,{useEffect,useState} from 'react';
import {SafeAreaView,View,Text,ScrollView,TextInput,Pressable,StyleSheet,ActivityIndicator,Linking} from 'react-native';
import MapScreen from './src/screens/MapScreen';
import {buscarEstabelecimentos,distanciaKm,formatarDistancia} from './src/services/lugares';
import {obterLocalizacaoAtual} from './src/services/localizacao';
import {supabase,configurado,resumo,votar} from './src/services/supabase';
import {criarRota} from './src/services/navegacao';
const BRASILIA={latitude:-15.7939,longitude:-47.8828,label:'Brasília (origem demonstrativa)'};
const Button=({children,onPress,disabled,secondary})=><Pressable disabled={disabled} onPress={onPress} style={[styles.btn,secondary&&{backgroundColor:'#475569'},disabled&&{opacity:.45}]}><Text style={{color:'white',fontWeight:'700'}}>{children}</Text></Pressable>;
export default function App(){
 const [origem,setOrigem]=useState(BRASILIA),[query,setQuery]=useState(''),[results,setResults]=useState([]),[place,setPlace]=useState(null);
 const [route,setRoute]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[score,setScore]=useState(null);
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:listener}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));return()=>listener.subscription.unsubscribe()},[]);
 async function perform(fn){setBusy(true);setMessage('');try{await fn()}catch(e){setMessage(e.message||'Ocorreu um erro')}finally{setBusy(false)}}
 const search=()=>perform(async()=>{setPlace(null);setScore(null);setRoute(null);setResults([]);const a=await buscarEstabelecimentos(query);setResults(a.sort((a,b)=>(distanciaKm(origem,a)??99999)-(distanciaKm(origem,b)??99999)));if(!a.length)setMessage('Nenhum estabelecimento encontrado. Informe o nome ou a unidade e tente novamente.')});
 const select=place=>perform(async()=>{setPlace(place);setScore(null);setRoute(null);setScore(await resumo(place))});
 const gps=()=>perform(async()=>{const p=await obterLocalizacaoAtual();setOrigem(p);setMessage('GPS ativado mediante sua autorização.')});
 const navigate=()=>perform(async()=>{if(place)setRoute(await criarRota(origem,place))});
 const login=(signup=false)=>perform(async()=>{if(!supabase)throw Error('Supabase não configurado.');if(password.length<6)throw Error('A senha deve ter ao menos 6 caracteres.');const r=signup?await supabase.auth.signUp({email:email.trim(),password}):await supabase.auth.signInWithPassword({email:email.trim(),password});if(r.error)throw r.error;setMessage(signup?'Cadastro solicitado. Verifique seu e-mail para confirmar, se necessário.':'Login realizado.');});
 const vote=choice=>perform(async()=>{if(!session)throw Error('Faça login primeiro.');await votar(place,choice);setScore(await resumo(place));setMessage('Voto registrado. Você pode alterar seu voto a qualquer momento.')});
 return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
 <Text style={styles.eyebrow}>MAPA ELEITORAL BRASIL • FASE 1</Text><Text style={styles.title}>Explore lugares no DF</Text>
 <Text style={styles.notice}>A classificação política representa apenas votos de usuários do aplicativo — não é uma declaração do estabelecimento nem medida de segurança ou receptividade.</Text>
 <View style={styles.card}><Text style={styles.h}>Sua origem</Text><Text>{origem.label}</Text><Button onPress={gps} disabled={busy} secondary>Usar minha localização atual (GPS)</Button>
 <Text style={styles.h}>Pesquisar estabelecimentos</Text><View style={styles.row}><TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Ex.: Outback JK Shopping" onSubmitEditing={search}/><Button disabled={busy} onPress={search}>Buscar</Button></View>
 <Text style={styles.caption}>Busca OpenStreetMap no Distrito Federal. Sem sugestões automáticas; uso experimental de baixo volume.</Text>
 {results.length>0&&<Text style={styles.caption}>{results.length} resultado(s) encontrado(s) · ordenados pela distância em linha reta desde a origem selecionada</Text>}
 {results.map(p=><Pressable key={p.id} style={[styles.result,place?.id===p.id&&styles.selectedResult]} onPress={()=>select(p)}><View style={styles.resultHead}><Text style={styles.h}>{p.name}</Text><Text style={styles.distance}>{formatarDistancia(distanciaKm(origem,p))}</Text></View><Text style={styles.caption}>{p.label}</Text><Text style={styles.placeMeta}>{p.category} · OSM {p.osm_type}/{p.osm_id} {place?.id===p.id?'· Selecionado':'· Toque para selecionar'}</Text></Pressable>)}</View>
 {place&&<View style={styles.card}><Text style={styles.h}>{place.name}</Text><Text style={styles.caption}>{place.label}</Text><Text style={styles.placeMeta}>{formatarDistancia(distanciaKm(origem,place))} · Identificador {place.osm_type}/{place.osm_id}</Text><Text style={styles.classification}>Classificação da comunidade: {score?.classificacao||'sem classificação'}</Text>
 <Text>{score?.total||0} votos · {score?.verdes||0} verdes · {score?.vermelhos||0} vermelhos</Text><Text style={styles.caption}>São necessários pelo menos 20 votos e 60% de predominância para colorir o estabelecimento.</Text>
 {configurado&&session?<View style={styles.row}><Button disabled={busy} onPress={()=>vote('verde')}>Votar verde</Button><Button disabled={busy} onPress={()=>vote('vermelho')}>Votar vermelho</Button></View>:<Text style={styles.caption}>Faça login para votar. {configurado?'':'A votação será ativada quando o Supabase for configurado.'}</Text>}
 <Button disabled={busy} onPress={navigate}>Traçar rota até este lugar</Button>
 {route&&<Text>Rota estimada: {(route.distancia/1000).toFixed(1)} km · {Math.round(route.duracao/60)} min, sem trânsito em tempo real.</Text>}</View>}
 <View style={styles.map}><MapScreen geojson={null} onSelect={()=>{}} destino={place} origem={origem} rota={route} camada={false}/></View>
 <View style={styles.card}><Text style={styles.h}>Conta e participação</Text>
 {!configurado?<Text style={styles.caption}>Modo visual: configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY para habilitar cadastro e votos.</Text>:session?<><Text>Conectado: {session.user.email}</Text><Button secondary onPress={()=>perform(async()=>{const {error}=await supabase.auth.signOut();if(error)throw error;})}>Sair</Button></>:<>
 <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address"/>
 <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Senha" secureTextEntry autoCapitalize="none"/>
 <View style={styles.row}><Button disabled={busy} onPress={()=>login(false)}>Entrar</Button><Button disabled={busy} secondary onPress={()=>login(true)}>Criar conta</Button></View></>}
 </View>{busy&&<ActivityIndicator/>}{!!message&&<Text style={styles.notice}>{message}</Text>}
 <Text style={styles.caption}>Mapa © OpenStreetMap contributors · Busca Nominatim / OSM. Rotas OSRM demonstrativas. Não usar APIs comunitárias para lançamento em massa sem serviço apropriado.</Text>
 </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#f3f6fb'},content:{maxWidth:1020,width:'100%',alignSelf:'center',padding:18,gap:13},eyebrow:{color:'#2563eb',fontWeight:'800'},title:{fontSize:27,fontWeight:'800',color:'#14233b'},notice:{backgroundColor:'#fff4df',color:'#815000',padding:12,borderRadius:10},card:{backgroundColor:'white',borderRadius:14,padding:16,gap:12,borderWidth:1,borderColor:'#dbe4ef'},h:{fontWeight:'800',fontSize:16,color:'#14233b'},row:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'},input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:9,padding:12,minWidth:190,flexGrow:1},btn:{backgroundColor:'#1d4ed8',borderRadius:9,padding:12,alignSelf:'flex-start'},caption:{fontSize:12,color:'#64748b'},result:{padding:12,borderTopWidth:1,borderColor:'#e2e8f0',gap:5},selectedResult:{backgroundColor:'#eff6ff',borderLeftWidth:3,borderLeftColor:'#2563eb'},resultHead:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',alignItems:'center',gap:6},distance:{fontSize:12,fontWeight:'700',color:'#2563eb'},placeMeta:{fontSize:11,color:'#475569'},map:{height:470,overflow:'hidden',borderRadius:14,backgroundColor:'#e8eef5'},classification:{fontWeight:'800',color:'#334155'}});
