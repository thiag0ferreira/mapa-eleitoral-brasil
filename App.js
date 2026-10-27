import React,{useEffect,useState} from 'react';
import {SafeAreaView,View,Text,TextInput,Pressable,ScrollView,StyleSheet,ActivityIndicator,Linking,useWindowDimensions} from 'react-native';
import MapScreen from './src/screens/MapScreen';
import GoogleMap from './src/screens/GoogleMap';
import NavegacaoAtiva from './src/components/NavegacaoAtiva';
import {googleReady,buscarGooglePlaces} from './src/services/googlePlaces';
import {buscarEstabelecimentos,distanciaKm,formatarDistancia} from './src/services/lugares';
import {obterLocalizacaoAtual,observarLocalizacao} from './src/services/localizacao';
import {supabase,configurado,resumo,votar} from './src/services/supabase';
import {criarRota,urlGoogleMaps,urlWaze,distanciaFormatada} from './src/services/navegacao';

const DF_CENTRO={latitude:-15.7939,longitude:-47.8828,label:'Brasília, DF (centro inicial do mapa)'};
const COLORS={background:'#181d25',panel:'#1f232b',muted:'#aab5c2',border:'#343a45',blue:'#33b9e6',green:'#36b978',red:'#e56b66',white:'#f5f7fb'};
function Tap({children,onPress,variant='plain',disabled=false,style,accessibilityLabel}){
 return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} disabled={disabled}
  style={[styles.tap,variant==='primary'&&styles.primary,variant==='quiet'&&styles.quiet,disabled&&{opacity:.45},style]}>
  <Text style={[styles.tapText,variant==='primary'&&{color:'#0b2030'}]}>{children}</Text>
 </Pressable>;
}
function Tag({children,onPress}){return <Pressable onPress={onPress} style={styles.tag}><Text style={styles.tagText}>{children}</Text></Pressable>}

export default function App(){
 const {width,height}=useWindowDimensions();
 const wide=width>=800;
 const [panel,setPanel]=useState('home');
 const [origem,setOrigem]=useState(null);
 const [gpsStatus,setGpsStatus]=useState('Ative o GPS');
 const [followHome,setFollowHome]=useState(true);
 const [query,setQuery]=useState('');
 const [results,setResults]=useState([]);
 const [place,setPlace]=useState(null);
 const [score,setScore]=useState(null);
 const [route,setRoute]=useState(null);
 const [recent,setRecent]=useState([]);
 const [favorites,setFavorites]=useState([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [navegando,setNavegando]=useState(false);
 const [session,setSession]=useState(null);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');

 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)}).catch(()=>{});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,s)=>{if(active)setSession(s)});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 // A permissão de GPS é solicitada pelo navegador. Se negada, o app continua utilizável.
 useEffect(()=>{
  if(navegando)return;
  let active=true,unsub=null;
  observarLocalizacao(p=>{if(active){setOrigem(p);setGpsStatus('GPS ativo')}},
   ()=>{if(active)setGpsStatus('Toque em ◎ para verificar o GPS')})
   .then(fn=>{if(active)unsub=fn;else fn()})
   .catch(()=>{if(active)setGpsStatus('Toque em ◎ para ativar o GPS')});
  return()=>{active=false;unsub?.()};
 },[navegando]);
 async function action(fn){
  if(busy)return;
  setBusy(true);setMessage('');
  try{await fn()}catch(e){setMessage(e?.message||'Não foi possível concluir esta ação.')}
  finally{setBusy(false)}
 }
 const gps=()=>action(async()=>{
  const p=await obterLocalizacaoAtual();setOrigem(p);setFollowHome(true);setGpsStatus('GPS ativo');
 });
 const search=()=>action(async()=>{
  if(query.trim().length<3)throw Error('Digite pelo menos 3 caracteres para buscar.');
  setResults([]);
  const found=googleReady?await buscarGooglePlaces(query,origem||DF_CENTRO):await buscarEstabelecimentos(query);
  const ordered=found.slice().sort((a,b)=>(distanciaKm(origem,a)??99999)-(distanciaKm(origem,b)??99999));
  setResults(ordered);setFollowHome(false);
  if(!ordered.length)setMessage('Nenhum estabelecimento encontrado. Tente nome e unidade.');
 });
 const selectPlace=async(p)=>{
  if(!p)return;
  setPlace(p);setPanel('place');setRoute(null);setScore(null);setFollowHome(false);
  setRecent(old=>[p,...old.filter(x=>x.id!==p.id)].slice(0,6));
  if(configurado){
   try{const s=await resumo(p);setScore(s)}
   catch(_e){setMessage('Informações de votação indisponíveis para esse lugar.')}
  }
 };
 const toggleFav=()=>{
  if(!place)return;
  setFavorites(old=>old.some(p=>p.id===place.id)?old.filter(p=>p.id!==place.id):[place,...old]);
 };
 const goPreview=()=>action(async()=>{
  if(!place)return;
  const gpsOrigin=origem||await obterLocalizacaoAtual();
  if(!origem){setOrigem(gpsOrigin);setGpsStatus('GPS ativo')}
  const r=await criarRota(gpsOrigin,place);setRoute(r);setPanel('place');
 });
 const startNavigation=()=>action(async()=>{
  if(!place)throw Error('Escolha o destino antes de iniciar.');
  const current=await obterLocalizacaoAtual();
  setOrigem(current);setGpsStatus('GPS ativo');
  const r=await criarRota(current,place);
  setRoute(r);setNavegando(true);
 });
 const vote=choice=>action(async()=>{
  if(!session){setPanel('account');throw Error('Entre na sua conta para votar.')}
  if(!configurado)throw Error('Supabase ainda não configurado.');
  if(!place)return;
  await votar(place,choice);
  setScore(await resumo(place));setMessage('Voto registrado. Você pode alterar sua escolha.');
 });
 const login=signup=>action(async()=>{
  if(!supabase)throw Error('Supabase não configurado.');
  if(password.length<8)throw Error('A senha deve ter pelo menos 8 caracteres.');
  const credential={email:email.trim(),password};
  const r=signup?await supabase.auth.signUp(credential):await supabase.auth.signInWithPassword(credential);
  if(r.error)throw r.error;
  setMessage(signup?'Verifique seu e-mail para confirmar o cadastro.':'Bem-vindo!');
  if(!signup)setPanel(place?'place':'home');
 });
 const logout=()=>action(async()=>{
  const r=await supabase.auth.signOut();if(r.error)throw r.error;
  setPanel('home');setMessage('Você saiu da conta.');
 });
 const selectedSaved=favorites.some(p=>p.id===place?.id);
 const category=score?.classificacao||'sem classificação';
 const badgeColor=category==='verde'?COLORS.green:category==='vermelho'?COLORS.red:'#9ba5b2';
 const sheetHeight=Math.min(height*(wide?0.83:0.82),panel==='home'?318:panel==='place'?470:panel==='search'?500:panel==='account'?430:panel==='menu'?390:425);
 const openSearch=()=>{setPanel('search');setMessage('')};
 const renderList=(items)=>items.map(p=><Pressable key={p.id} onPress={()=>selectPlace(p)} style={styles.placeItem}>
  <View style={styles.placeIcon}><Text style={{fontSize:20}}>📍</Text></View>
  <View style={{flex:1,gap:4}}>
   <Text style={styles.placeName} numberOfLines={1}>{p.name}</Text>
   <Text style={styles.secondary} numberOfLines={2}>{p.label}</Text>
   <Text style={styles.distance}>{origem?formatarDistancia(distanciaKm(origem,p)):'Distância: ative o GPS'}</Text>
  </View>
  <Text style={styles.chevron}>›</Text>
 </Pressable>);

 return <SafeAreaView style={styles.root}>
  <View style={[styles.mapCanvas,{bottom:wide?0:sheetHeight}]}>
   {googleReady?
    <GoogleMap origem={origem||DF_CENTRO} destino={place} rota={route} posicaoAtual={origem} seguir={followHome&&!place&&!route} resultados={results} onPlacePress={selectPlace}/>:
    <MapScreen origem={origem||DF_CENTRO} destino={place} rota={route} posicaoAtual={origem} seguir={followHome&&!place&&!route} resultados={results} onPlacePress={selectPlace}/>}
  </View>
  <View style={styles.topControls} pointerEvents="box-none">
   <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={()=>setPanel(panel==='menu'?'home':'menu')} style={styles.floatButton}><Text style={styles.floatIcon}>☰</Text></Pressable>
   <View style={styles.titlePill}><Text style={styles.titlePillText}>MAPA ELEITORAL</Text><Text style={styles.titlePillSub}>Brasília e DF · Beta</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={()=>setPanel('account')} style={styles.avatar}><Text style={styles.avatarText}>{session?'✓':'♙'}</Text></Pressable>
  </View>
  <View style={styles.rightTools} pointerEvents="box-none">
   <Pressable accessibilityRole="button" accessibilityLabel="Centralizar minha localização" onPress={gps} style={styles.floatButton}><Text style={styles.floatIcon}>◎</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Ver lugares favoritos" onPress={()=>setPanel('favorites')} style={styles.floatButton}><Text style={styles.floatIcon}>☆</Text></Pressable>
  </View>
  <View style={[styles.gpsPill,{bottom:sheetHeight+16,left:wide?24:16}]}>
   <Text style={styles.gpsText}>{origem?'● '+gpsStatus:'○ '+gpsStatus}</Text>
  </View>

  <View style={[styles.sheet,{height:sheetHeight},
   wide?{left:20,right:undefined,bottom:18,width:420,borderRadius:25}:null]}>
   <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao início" onPress={()=>setPanel('home')} style={styles.handleContainer}>
    <View style={styles.handle}/>
   </Pressable>
   {panel==='home'&&<View style={styles.sheetBody}>
    <Pressable onPress={openSearch} style={styles.searchLauncher}>
     <Text style={styles.searchGlass}>⌕</Text>
     <Text style={styles.searchPlaceholder}>Para onde?</Text>
     <Text style={styles.searchGlass}>→</Text>
    </Pressable>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={styles.chips}>
     <Tag onPress={()=>setPanel('favorites')}>☆ Favoritos</Tag>
     <Tag onPress={()=>setPanel('recent')}>◷ Recentes</Tag>
     <Tag onPress={()=>setPanel('account')}>♙ Minha conta</Tag>
    </ScrollView>
    <Text style={styles.sectionTitle}>Locais recentes</Text>
    <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">
     {recent.length?renderList(recent.slice(0,3)):<Text style={styles.empty}>Seus destinos pesquisados aparecerão aqui durante a sessão.</Text>}
    </ScrollView>
   </View>}

   {panel==='search'&&<View style={styles.sheetBody}>
    <View style={styles.panelHeader}>
     <Pressable onPress={()=>setPanel('home')}><Text style={styles.back}>‹</Text></Pressable>
     <Text style={styles.sheetTitle}>Buscar um lugar</Text>
    </View>
    <View style={styles.searchInputRow}>
     <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search"
      style={styles.input} placeholder="Restaurante, shopping ou endereço" placeholderTextColor="#82909f"
      accessibilityLabel="Pesquisar estabelecimentos" autoCorrect={false}/>
     <Tap variant="primary" onPress={search} disabled={busy}>Buscar</Tap>
    </View>
    <Text style={styles.caption}>{googleReady?'Busca Google Places • Distrito Federal':'Busca OpenStreetMap temporária • Distrito Federal'}</Text>
    <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">
     {busy?<ActivityIndicator color={COLORS.blue} style={{marginTop:15}}/>:
     results.length?<><Text style={styles.resultCount}>{results.length} resultado(s) · confira o endereço</Text>{renderList(results)}</>:
     renderList(recent.slice(0,4))}
    </ScrollView>
   </View>}

   {panel==='place'&&place&&<View style={styles.sheetBody}>
    <View style={styles.panelHeader}>
     <Pressable onPress={openSearch}><Text style={styles.back}>‹</Text></Pressable>
     <View style={{flex:1}}><Text style={styles.sheetTitle} numberOfLines={1}>{place.name}</Text><Text style={styles.secondary} numberOfLines={2}>{place.label}</Text></View>
     <Pressable onPress={toggleFav} accessibilityLabel="Adicionar ou remover favorito"><Text style={styles.fav}>{selectedSaved?'★':'☆'}</Text></Pressable>
    </View>
    <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">
     <View style={styles.votePanel}>
      <View style={styles.voteHeader}><View style={[styles.dot,{backgroundColor:badgeColor}]}/><Text style={styles.voteTitle}>Classificação da comunidade: {category}</Text></View>
      <Text style={styles.voteCount}>{score?.total||0} votos · {score?.verdes||0} verdes · {score?.vermelhos||0} vermelhos</Text>
      <Text style={styles.caption}>Opiniões de usuários, não posição oficial do estabelecimento. Classificação pública após 20 votos e maioria de 60%.</Text>
      <View style={styles.voteActions}>
       <Tap onPress={()=>vote('verde')} style={styles.greenButton} disabled={busy}>Votar verde</Tap>
       <Tap onPress={()=>vote('vermelho')} style={styles.redButton} disabled={busy}>Votar vermelho</Tap>
      </View>
     </View>
     {route&&<Text style={styles.routeSummary}>Rota: {distanciaFormatada(route.distancia)} · {Math.round(route.duracao/60)} min estimados</Text>}
     <Tap variant="primary" onPress={startNavigation} disabled={busy} style={{alignSelf:'stretch',paddingVertical:14}}>▶ Iniciar navegação</Tap>
     <View style={styles.voteActions}>
      <Tap variant="quiet" onPress={goPreview} disabled={busy}>◫ Ver rota</Tap>
      <Tap variant="quiet" onPress={()=>Linking.openURL(urlGoogleMaps(place))}>↗ Google Maps</Tap>
      <Tap variant="quiet" onPress={()=>Linking.openURL(urlWaze(place))}>↗ Waze</Tap>
     </View>
    </ScrollView>
   </View>}

   {panel==='recent'&&<View style={styles.sheetBody}>
    <View style={styles.panelHeader}><Pressable onPress={()=>setPanel('home')}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.sheetTitle}>Destinos recentes</Text></View>
    <ScrollView style={{flex:1}}>{recent.length?renderList(recent):<Text style={styles.empty}>Você ainda não pesquisou nenhum lugar nesta sessão.</Text>}</ScrollView>
   </View>}
   {panel==='favorites'&&<View style={styles.sheetBody}>
    <View style={styles.panelHeader}><Pressable onPress={()=>setPanel('home')}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.sheetTitle}>Favoritos da sessão</Text></View>
    <ScrollView style={{flex:1}}>{favorites.length?renderList(favorites):<Text style={styles.empty}>Abra um estabelecimento e toque na estrela para salvar durante a sessão.</Text>}</ScrollView>
   </View>}
   {panel==='menu'&&<View style={styles.sheetBody}>
    <Text style={styles.sheetTitle}>Mapa Eleitoral Brasil</Text>
    <Text style={styles.secondary}>Navegação e avaliações colaborativas</Text>
    <View style={{height:12}}/>
    <Tap variant="quiet" style={styles.menuItem} onPress={openSearch}>⌕  Buscar estabelecimentos</Tap>
    <Tap variant="quiet" style={styles.menuItem} onPress={()=>setPanel('account')}>♙  Conta e participação</Tap>
    <Tap variant="quiet" style={styles.menuItem} onPress={()=>setPanel('favorites')}>☆  Favoritos</Tap>
    <Tap variant="quiet" style={styles.menuItem} onPress={gps}>◎  Atualizar GPS</Tap>
    <Text style={styles.caption}>Versão de testes. A classificação reflete apenas os votos da comunidade, e não a posição política do estabelecimento.</Text>
   </View>}
   {panel==='account'&&<View style={styles.sheetBody}>
    <View style={styles.panelHeader}><Pressable onPress={()=>setPanel('home')}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.sheetTitle}>Conta e participação</Text></View>
    {session?<View style={{gap:12}}>
     <Text style={styles.secondary}>Conectado como</Text>
     <Text style={styles.placeName}>{session.user.email}</Text>
     <Tap variant="quiet" onPress={logout} style={{alignSelf:'flex-start'}}>Sair da conta</Tap>
    </View>:!configurado?<Text style={styles.empty}>Autenticação indisponível até configurar o Supabase.</Text>:
    <View style={{gap:10}}>
     <TextInput value={email} onChangeText={setEmail} style={styles.authInput} placeholder="Seu e-mail"
      placeholderTextColor="#82909f" autoCapitalize="none" keyboardType="email-address"/>
     <TextInput value={password} onChangeText={setPassword} style={styles.authInput} placeholder="Senha"
      placeholderTextColor="#82909f" secureTextEntry autoCapitalize="none"/>
     <View style={styles.voteActions}><Tap variant="primary" onPress={()=>login(false)} disabled={busy}>Entrar</Tap><Tap variant="quiet" onPress={()=>login(true)} disabled={busy}>Criar conta</Tap></View>
     <Text style={styles.caption}>A confirmação por e-mail pode ser necessária para ativar a conta.</Text>
    </View>}
   </View>}
   {!!message&&<Pressable onPress={()=>setMessage('')} style={styles.message}><Text style={styles.messageText}>{message}  ✕</Text></Pressable>}
  </View>
  <NavegacaoAtiva visible={navegando} destino={place} origem={origem||DF_CENTRO} rota={route}
   onFechar={()=>setNavegando(false)} onRotaAtualizada={setRoute}/>
 </SafeAreaView>;
}

const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#151a22',minHeight:380,overflow:'hidden'},
 mapCanvas:{position:'absolute',top:0,bottom:0,left:0,right:0},
 topControls:{position:'absolute',top:15,left:16,right:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
 floatButton:{width:54,height:54,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'#14171c',borderColor:'#363c45',borderWidth:1,
  shadowColor:'#000',shadowOpacity:.35,shadowRadius:8,elevation:6},
 floatIcon:{fontSize:27,color:'#fff',fontWeight:'800'},
 titlePill:{paddingHorizontal:15,paddingVertical:9,backgroundColor:'rgba(20,23,28,.92)',borderRadius:20,alignItems:'center',flex:1},
 titlePillText:{color:'#fff',fontSize:12,fontWeight:'900',letterSpacing:.8},
 titlePillSub:{color:'#aebcc9',fontSize:10,marginTop:2},
 avatar:{backgroundColor:'#14171c',height:54,width:54,borderRadius:27,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#363c45'},
 avatarText:{fontSize:26,color:'#fff',fontWeight:'800'},
 rightTools:{position:'absolute',top:88,right:16,gap:10},
 gpsPill:{position:'absolute',paddingHorizontal:13,paddingVertical:8,backgroundColor:'rgba(19,26,34,.93)',borderRadius:18,shadowColor:'#000',shadowOpacity:.3,shadowRadius:6},
 gpsText:{color:'#e8eef5',fontSize:12,fontWeight:'700'},
 sheet:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#1f232b',borderTopLeftRadius:29,borderTopRightRadius:29,
  shadowColor:'#000',shadowOffset:{width:0,height:-5},shadowOpacity:.35,shadowRadius:18,elevation:12,
  borderTopWidth:1,borderColor:'#343a45',overflow:'hidden'},
 handleContainer:{height:27,alignItems:'center',justifyContent:'center'},
 handle:{width:51,height:5,backgroundColor:'#666e77',borderRadius:6},
 sheetBody:{flex:1,paddingHorizontal:20,paddingBottom:19,gap:12},
 searchLauncher:{height:56,borderRadius:28,backgroundColor:'#393f46',flexDirection:'row',alignItems:'center',paddingHorizontal:18,gap:13},
 searchGlass:{fontSize:24,color:'#d1d5db'},
 searchPlaceholder:{flex:1,fontSize:19,color:'#a5adb8'},
 chips:{gap:10,paddingVertical:5,paddingRight:10,alignItems:'center'},
 tag:{borderWidth:1,borderColor:'#4c5460',borderRadius:16,paddingHorizontal:14,paddingVertical:12,backgroundColor:'#22262d'},
 tagText:{color:'#f0f3f6',fontWeight:'700',fontSize:13},
 sectionTitle:{color:'#d6dce5',fontWeight:'800',fontSize:14,marginTop:1},
 empty:{color:'#98a4b1',lineHeight:20,fontSize:13,paddingVertical:12},
 placeItem:{flexDirection:'row',gap:10,paddingVertical:12,borderBottomWidth:1,borderColor:'#363e4a',alignItems:'center'},
 placeIcon:{width:42,height:42,borderRadius:22,backgroundColor:'#333a44',alignItems:'center',justifyContent:'center'},
 placeName:{fontSize:16,fontWeight:'800',color:'#f3f6fb'},
 secondary:{fontSize:12,color:'#a9b5c2',lineHeight:17},
 distance:{fontSize:12,color:'#69d5f4',fontWeight:'700'},
 chevron:{fontSize:26,color:'#8e9baa'},
 panelHeader:{flexDirection:'row',alignItems:'center',gap:13,minHeight:35},
 back:{color:'#cdd5df',fontSize:34,marginTop:-3},
 sheetTitle:{color:'#fff',fontSize:20,fontWeight:'900',flexShrink:1},
 searchInputRow:{flexDirection:'row',alignItems:'center',gap:8},
 input:{backgroundColor:'#343a44',borderRadius:13,color:'#fff',fontSize:14,paddingVertical:12,paddingHorizontal:13,flex:1,minWidth:0},
 caption:{fontSize:11,color:'#9aa7b5',lineHeight:16},
 resultCount:{fontSize:12,color:'#8ea0ad',paddingTop:4,paddingBottom:6},
 tap:{borderRadius:12,paddingVertical:11,paddingHorizontal:14,justifyContent:'center',alignItems:'center',backgroundColor:'#343b45',alignSelf:'flex-start'},
 tapText:{fontSize:13,fontWeight:'800',color:'#f0f4f8'},
 primary:{backgroundColor:'#4fc9ef'},
 quiet:{backgroundColor:'#3a414c'},
 fav:{fontSize:29,color:'#ffc65e'},
 votePanel:{borderRadius:16,padding:12,backgroundColor:'#2a303a',gap:9,marginBottom:12},
 voteHeader:{flexDirection:'row',alignItems:'center',gap:8},
 dot:{height:11,width:11,borderRadius:6},
 voteTitle:{color:'#f0f4f8',fontSize:13,fontWeight:'800',flexShrink:1},
 voteCount:{color:'#fff',fontSize:13,fontWeight:'700'},
 voteActions:{flexDirection:'row',gap:8,flexWrap:'wrap'},
 greenButton:{backgroundColor:'#136c4a'},redButton:{backgroundColor:'#902c31'},
 routeSummary:{color:'#f0f4f8',fontSize:14,fontWeight:'800',paddingBottom:10},
 menuItem:{alignSelf:'stretch',alignItems:'flex-start',marginBottom:4},
 authInput:{backgroundColor:'#333942',borderRadius:12,color:'#fff',padding:12,fontSize:14},
 message:{paddingVertical:9,paddingHorizontal:16,backgroundColor:'#654a2c',marginHorizontal:16,marginBottom:12,borderRadius:12},
 messageText:{color:'#fff0d0',fontSize:12,fontWeight:'600',lineHeight:17}
});
