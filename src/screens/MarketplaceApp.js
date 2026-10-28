import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,TextInput,ScrollView,Pressable,SafeAreaView,Image,ActivityIndicator,Linking,useWindowDimensions} from 'react-native';
import {supabase,configurado} from '../services/supabase';
import * as api from '../services/marketplace';
import {CATEGORIES,REGIONS,DEMO_BUSINESSES,labelOf} from '../data/marketplace';
import {Btn,Field,SelectModal,BusinessForm,ProductForm} from '../components/MarketplaceForms';
import {COLOR,ui} from '../components/marketplaceStyles';

const TYPES={autonomo:'Autônomo',mei:'MEI',empresa:'Empresa'};
const ICONS={alimentacao:'🍰',restaurantes:'🍽️',automotivo:'🔧',beleza:'💇',reformas:'🛠️',
 juridico:'⚖️',saude:'💚',moda:'👗',tecnologia:'💻',educacao:'📚',casa:'🏠',pets:'🐾',
 eventos:'🎉',servicos:'🧰',outros:'🛍️'};
const priceLabel=n=>n==null?'Preço sob consulta':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function Headline({children,small}){return <Text style={small?ui.h3:ui.h2}>{children}</Text>}
function IconBox({category,small=false}){return <View style={[ui.imagePlaceholder,small&&{height:74,width:74}]}>
 <Text style={{fontSize:small?30:50}}>{ICONS[category]||'🛍️'}</Text>
 </View>}
function Cover({uri,category,small=false}){
 return uri?<Image source={{uri}} resizeMode="cover" style={small?{width:74,height:74,borderRadius:12,backgroundColor:'#e8eef3'}:ui.image}/>:
 <IconBox category={category} small={small}/>;
}
function Banner({text,warning=false}){
 return <View style={warning?ui.warning:ui.banner}><Text style={warning?ui.warningText:ui.info}>{text}</Text></View>;
}
function DetailRow({label,value}){
 return <View style={[ui.row,{justifyContent:'space-between',alignItems:'flex-start'}]}>
  <Text style={ui.muted}>{label}</Text><Text style={[ui.paragraph,{textAlign:'right',flexShrink:1}]}>{value}</Text>
 </View>;
}
function SmallTag({children}){return <View style={ui.badge}><Text style={ui.badgeText}>{children}</Text></View>}
const ratingLabel=(arr)=>arr.length?(arr.reduce((s,x)=>s+x.rating,0)/arr.length).toFixed(1).replace('.',',')+' ★ · '+arr.length+' avaliação(ões)':'Sem avaliações publicadas';
export default function MarketplaceApp(){
 const {width}=useWindowDimensions();
 const wide=width>=760;
 const [page,setPage]=useState('home');
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('');
 const [region,setRegion]=useState('');
 const [published,setPublished]=useState([]);
 const [catalogState,setCatalogState]=useState('loading');
 const [session,setSession]=useState(null);
 const [admin,setAdmin]=useState(false);
 const [mine,setMine]=useState([]);
 const [selected,setSelected]=useState(null);
 const [products,setProducts]=useState([]);
 const [reviews,setReviews]=useState([]);
 const [editingBusiness,setEditingBusiness]=useState(null);
 const [editingProduct,setEditingProduct]=useState(null);
 const [productBusiness,setProductBusiness]=useState(null);
 const [formNonce,setFormNonce]=useState(0);
 const [queue,setQueue]=useState({businesses:[],products:[],reviews:[]});
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [feedback,setFeedback]=useState('');
 const [busy,setBusy]=useState(false);
 const [reviewRating,setReviewRating]=useState(5);
 const [reviewText,setReviewText]=useState('');

 useEffect(()=>{
  let mounted=true;
  if(!supabase){setCatalogState('offline');return}
  api.listBusinesses().then(items=>{if(mounted){setPublished(items);setCatalogState('loaded')}})
   .catch(()=>{if(mounted)setCatalogState('needs-migration')});
  return()=>{mounted=false};
 },[]);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)}).catch(()=>{});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,s)=>{if(active)setSession(s)});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  let mounted=true;
  if(!session){setAdmin(false);return}
  api.checkAdmin().then(isAdmin=>{if(mounted)setAdmin(isAdmin)}).catch(()=>{if(mounted)setAdmin(false)});
  return()=>{mounted=false};
 },[session?.user?.id]);
 async function run(fn){
  if(busy)return;
  setBusy(true);setFeedback('');
  try{await fn()}catch(e){setFeedback(e?.message||'Não foi possível concluir esta operação.')}
  finally{setBusy(false)}
 }
 async function refreshCatalog(){
  if(!api.backendReady)return;
  const items=await api.listBusinesses();setPublished(items);setCatalogState('loaded');
 }
 const catalog=published.length?published:DEMO_BUSINESSES;
 const showingDemo=!published.length;
 const visible=useMemo(()=>{
  const q=search.trim().toLocaleLowerCase('pt-BR');
  return catalog.filter(x=>
   (!category||x.category_id===category)&&(!region||x.region_id===region)&&
   (!q||[x.name,x.description,x.neighborhood,labelOf(CATEGORIES,x.category_id)].join(' ').toLocaleLowerCase('pt-BR').includes(q))
  );
 },[catalog,category,region,search]);
 const scrollTop=()=>{setFeedback('')};
 function go(to){scrollTop();setPage(to)}
 function advertise(){
  if(!session){setFeedback('Entre ou crie uma conta gratuita para anunciar.');setPage('account');return}
  setEditingBusiness(null);setFormNonce(x=>x+1);go('businessForm');
 }
 const loadMine=async()=>{
  if(!session){go('account');return}
  await run(async()=>{setMine(await api.myBusinesses());go('mine')});
 };
 const openBusiness=async(b)=>{
  setSelected(b);setProducts([]);setReviews([]);setReviewRating(5);setReviewText('');
  go('detail');
  if(b.demo)return;
  try{
   const [items,notes]=await Promise.all([api.businessProducts(b.id),api.businessReviews(b.id)]);
   setProducts(items);setReviews(notes);
  }catch(e){setFeedback('Não foi possível carregar o catálogo e as avaliações: '+e.message)}
 };
 const editBusiness=b=>{setEditingBusiness(b);setFormNonce(x=>x+1);go('businessForm')};
 const createProduct=b=>{setProductBusiness(b);setEditingProduct(null);setFormNonce(x=>x+1);go('productForm')};
 const editProduct=(b,item)=>{setProductBusiness(b);setEditingProduct(item);setFormNonce(x=>x+1);go('productForm')};
 const saveBusiness=(form,file)=>run(async()=>{
  const record=await api.saveBusiness(form,editingBusiness?.id);
  if(file){
   const image=await api.uploadPhoto(file,record.id);
   await api.updateBusinessPhoto(record.id,image);
  }
  setMine(await api.myBusinesses());
  setPage('mine');
  setFeedback('Cadastro salvo gratuitamente! A publicação depende de aprovação.');
 });
 const saveProduct=(form,file)=>run(async()=>{
  const record=await api.saveProduct(form,productBusiness.id,editingProduct?.id);
  if(file){
   const image=await api.uploadPhoto(file,productBusiness.id);
   await api.updateProductPhoto(record.id,image);
  }
  setMine(await api.myBusinesses());setPage('mine');
  setFeedback('Produto/serviço salvo gratuitamente e enviado para análise.');
 });
 const openWhatsApp=b=>{
  if(b.demo)return;
  const url=api.whatsappUrl(b);
  if(url)Linking.openURL(url).catch(()=>setFeedback('Não foi possível abrir o WhatsApp neste aparelho.'));
 };
 const login=(signUp)=>run(async()=>{
  if(!supabase)throw Error('Supabase não configurado.');
  if(password.length<8)throw Error('Use uma senha de pelo menos 8 caracteres.');
  if(!email.includes('@'))throw Error('Digite um e-mail válido.');
  const creds={email:email.trim(),password};
  const {error}=signUp?await supabase.auth.signUp(creds):await supabase.auth.signInWithPassword(creds);
  if(error)throw error;
  setFeedback(signUp?'Conta criada. Confira seu e-mail para confirmar o acesso.':'Login realizado.');
  if(!signUp)setPage('home');
 });
 const logout=()=>run(async()=>{
  const {error}=await supabase.auth.signOut();if(error)throw error;
  setMine([]);setPage('home');setFeedback('Você saiu da conta.');
 });
 const postReview=()=>run(async()=>{
  if(!session){setPage('account');throw Error('Faça login para enviar uma avaliação.')}
  await api.submitReview(selected,reviewRating,reviewText);
  setReviewText('');
  setFeedback('Avaliação enviada. Ela ficará visível depois de ser aprovada pela moderação.');
 });
 const openAdmin=()=>run(async()=>{
  if(!admin)throw Error('Acesso restrito aos administradores.');
  setQueue(await api.pendingQueue());go('admin');
 });
 const moderate=(type,id,approve)=>run(async()=>{
  await api.moderate(type,id,approve);
  setQueue(await api.pendingQueue());
  await refreshCatalog();
  setFeedback(approve?'Conteúdo aprovado.':'Conteúdo rejeitado.');
 });
 function AdCard({business}){
  return <Pressable onPress={()=>openBusiness(business)} style={[ui.card,{width:wide?'48.9%':'100%',padding:12,gap:9}]}>
   <Cover uri={business.image_url} category={business.category_id}/>
   <View style={ui.row}><SmallTag>{labelOf(CATEGORIES,business.category_id)}</SmallTag>
    {business.demo&&<SmallTag>Exemplo fictício</SmallTag>}</View>
   <Text style={ui.h3} numberOfLines={2}>{business.name}</Text>
   <Text style={ui.muted}>{labelOf(REGIONS,business.region_id)}{business.neighborhood?' · '+business.neighborhood:''}</Text>
   <Text numberOfLines={2} style={ui.paragraph}>{business.description||'Consulte os produtos e serviços disponíveis.'}</Text>
   <Text style={{color:COLOR.blue,fontSize:13,fontWeight:'900'}}>Ver perfil e catálogo  ›</Text>
  </Pressable>;
 }
 function ProductCard({item,business,canEdit=false}){
  const isPending=item.status!=='published';
  return <View key={item.id} style={[ui.card,{width:wide?'48%':'100%'}]}>
   <Cover uri={item.image_url} category={business.category_id}/>
   <Text style={ui.h3}>{item.name}</Text>
   <Text style={ui.paragraph}>{item.description||'Detalhes sob consulta.'}</Text>
   <Text style={{fontSize:16,fontWeight:'900',color:COLOR.success}}>{priceLabel(item.price)}</Text>
   {canEdit&&isPending&&<SmallTag>{item.status==='pending'?'Aguardando aprovação':'Rejeitado'}</SmallTag>}
   {canEdit&&<Btn secondary onPress={()=>editProduct(business,item)}>Editar produto</Btn>}
  </View>;
 }
 return <SafeAreaView style={ui.root}>
  <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">
   <View style={ui.header}>
    <View style={ui.headerInner}>
     <Pressable onPress={()=>go('home')} style={[ui.row,{gap:9}]}>
      <View style={ui.brandBadge}><Text style={{fontWeight:'900',color:'#fff',fontSize:15}}>DN</Text></View>
      <View><Text style={ui.brand}>Direita Negócios DF</Text><Text style={ui.brandSubtitle}>Marketplace local · 100% gratuito no piloto</Text></View>
     </Pressable>
     <View style={ui.headerActions}>
      <Pressable onPress={()=>go('home')}><Text style={ui.navText}>Explorar</Text></Pressable>
      <Pressable onPress={advertise}><Text style={ui.navText}>Anunciar</Text></Pressable>
      <Pressable onPress={session?loadMine:()=>go('account')}><Text style={ui.navText}>{session?'Meus anúncios':'Entrar'}</Text></Pressable>
      {admin&&<Pressable onPress={openAdmin}><Text style={ui.navText}>Moderar</Text></Pressable>}
     </View>
    </View>
   </View>
   <View style={ui.frame}>
    {!!feedback&&<Pressable onPress={()=>setFeedback('')} style={[ui.warning,{marginTop:12}]}><Text style={ui.warningText}>{feedback}   ✕</Text></Pressable>}

    {page==='home'&&<>
     <View style={ui.hero}>
      <Text style={ui.kicker}>EMPREENDEDORISMO LOCAL • DISTRITO FEDERAL</Text>
      <Text style={ui.h1}>Descubra negócios e profissionais perto de você.</Text>
      <Text style={ui.paragraph}>De quem vende doces em casa a lojas e prestadores de serviços. Encontre, conheça e converse diretamente com quem anuncia.</Text>
      <View style={ui.row}><Btn onPress={advertise}>+ Cadastre seu negócio grátis</Btn><SmallTag>Sem mensalidades · sem comissão</SmallTag></View>
     </View>
     <View style={ui.card}>
      <Text style={ui.h3}>Encontre o que você precisa</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Ex.: doces, mecânico, conserto, manicure"
       placeholderTextColor="#8190a0" style={ui.input} accessibilityLabel="Pesquisar negócios e serviços do DF"/>
      <SelectModal label="Localização: região administrativa" items={[{id:'',name:'Todo o Distrito Federal'},...REGIONS]}
       value={region} onChange={setRegion}/>
      <Text style={ui.label}>Categorias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}}>
       <View style={[ui.row,{paddingVertical:3,flexWrap:'nowrap'}]}>
        {[{id:'',name:'Todas',emoji:'🔎'},...CATEGORIES].map(c=><Pressable key={c.id||'all'} onPress={()=>setCategory(c.id)}
         style={[ui.chip,category===c.id&&ui.chipActive]}>
         <Text style={[ui.chipText,category===c.id&&ui.chipActiveText]}>{c.emoji||''} {c.name}</Text>
        </Pressable>)}
       </View>
      </ScrollView>
     </View>
     <View style={ui.sectionHeading}>
      <Headline>{showingDemo?'Veja como será o catálogo':'Negócios cadastrados'}</Headline>
      <Text style={ui.muted}>{visible.length} resultado(s)</Text>
     </View>
     {catalogState==='loading'&&<ActivityIndicator color={COLOR.accent}/>}
     {showingDemo&&<Banner warning text={catalogState==='needs-migration'?
      'A migração do banco ainda precisa ser executada no Supabase. Os perfis abaixo são demonstrações fictícias; nenhum negócio está publicado.':
      'Estes são apenas exemplos fictícios de perfis. Ainda não há negócios reais aprovados no marketplace.'}/>}
     {visible.length?
      <View style={[ui.row,{alignItems:'stretch',justifyContent:'space-between'}]}>{visible.map(b=><AdCard key={b.id} business={b}/>)}</View>:
      <View style={ui.empty}><Text style={ui.h3}>Nenhum resultado com esses filtros.</Text><Text style={ui.muted}>Experimente outra região ou categoria.</Text><Btn secondary onPress={()=>{setSearch('');setRegion('');setCategory('')}}>Limpar filtros</Btn></View>}
     <View style={[ui.card,{backgroundColor:'#ecf5ef'}]}>
      <Text style={ui.h3}>Você trabalha por conta própria?</Text>
      <Text style={ui.paragraph}>Divulgue seu trabalho mesmo sem loja física. Mostre a região, seus produtos e um WhatsApp para pedidos, sem expor seu endereço residencial.</Text>
      <Btn onPress={advertise}>Quero anunciar gratuitamente</Btn>
     </View>
    </>}

    {page==='detail'&&selected&&<>
     <View style={[ui.row,{marginTop:17}]}><Btn secondary onPress={()=>go('home')}>‹ Voltar à busca</Btn>{!selected.demo&&<SmallTag>{selected.status==='published'?'Cadastro aprovado':'Em análise'}</SmallTag>}</View>
     <View style={[ui.card,{padding:16}]}>
      <Cover uri={selected.image_url} category={selected.category_id}/>
      <Text style={ui.h2}>{selected.name}</Text>
      <View style={ui.row}><SmallTag>{labelOf(CATEGORIES,selected.category_id)}</SmallTag><SmallTag>{TYPES[selected.business_type]||'Negócio local'}</SmallTag></View>
      <DetailRow label="Localização" value={labelOf(REGIONS,selected.region_id)+(selected.neighborhood?' · '+selected.neighborhood:'')}/>
      {!!selected.public_address&&<DetailRow label="Endereço comercial divulgado" value={selected.public_address}/>}
      <Text style={ui.paragraph}>{selected.description||'Consulte os detalhes diretamente com o anunciante.'}</Text>
      {selected.demo?<Banner warning text="Este perfil é totalmente fictício e mostra apenas como funcionará o aplicativo. Não é um anúncio real."/>:
       <View style={ui.row}><Btn onPress={()=>openWhatsApp(selected)}>Conversar no WhatsApp</Btn>
        <SmallTag>Contato direto · sem taxas</SmallTag></View>}
      <Text style={ui.muted}>A participação no diretório é voluntária e não representa as opiniões pessoais dos funcionários ou clientes.</Text>
     </View>
     <View style={ui.sectionHeading}><Headline>Produtos e serviços</Headline>
      {session&&selected.owner_id===session.user.id&&<Btn secondary onPress={()=>createProduct(selected)}>+ Adicionar</Btn>}
     </View>
     {products.length?
      <View style={[ui.row,{alignItems:'stretch'}]}>{products.filter(p=>p.status==='published'||(session&&session.user.id===selected.owner_id)).map(p=>
       <ProductCard key={p.id} item={p} business={selected} canEdit={session?.user?.id===selected.owner_id}/>)}</View>:
      <View style={ui.empty}><Text style={ui.paragraph}>O catálogo ainda não possui produtos ou serviços publicados.</Text></View>}
     <Headline>Avaliações dos clientes</Headline>
     <View style={ui.card}>
      <Text style={ui.h3}>{ratingLabel(reviews)}</Text>
      <Text style={ui.muted}>Avaliações de atendimento e experiência comercial. Comentários passam por moderação.</Text>
      {reviews.map(r=><View key={r.id} style={{gap:4}}>
       <View style={ui.divider}/>
       <Text style={{color:COLOR.accent,fontWeight:'900'}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</Text>
       <Text style={ui.paragraph}>{r.comment||'Avaliação sem comentário.'}</Text>
      </View>)}
      {!selected.demo&&selected.status==='published'&&session?.user?.id!==selected.owner_id&&<>
       <Text style={ui.label}>Avalie sua experiência (1 a 5 estrelas)</Text>
       <View style={ui.row}>{[1,2,3,4,5].map(n=><Pressable key={n} onPress={()=>setReviewRating(n)}
        style={{paddingHorizontal:4,paddingVertical:5}}><Text style={{fontSize:28,color:n<=reviewRating?'#d87c34':'#b7c0ca'}}>★</Text></Pressable>)}</View>
       <Field label="Comentário opcional" value={reviewText} onChangeText={setReviewText} multiline maxLength={1000}
        placeholder="Conte sua experiência, com respeito."/>
       <Btn disabled={busy} onPress={postReview}>Enviar avaliação para análise</Btn>
      </>}
     </View>
    </>}

    {page==='account'&&<>
     <View style={{marginTop:19}}><Headline>Minha conta</Headline></View>
     <View style={[ui.card,{maxWidth:650,width:'100%',alignSelf:'center',gap:15}]}>
      {session?<><Banner text="Você está conectado ao Supabase."/><Text style={ui.h3}>{session.user.email}</Text>
       <View style={ui.row}><Btn onPress={loadMine}>Meus anúncios</Btn>
        <Btn secondary onPress={logout}>Sair da conta</Btn></View></>:
       <>
        <Text style={ui.h3}>Entrar ou criar conta grátis</Text>
        <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com"/>
        <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secureTextEntry autoCapitalize="none"/>
        
        <View style={ui.row}><Btn disabled={busy} onPress={()=>login(false)}>Entrar</Btn><Btn secondary disabled={busy} onPress={()=>login(true)}>Criar conta grátis</Btn></View>
        <Text style={ui.muted}>O Supabase pode enviar um e-mail de confirmação antes de liberar seu acesso.</Text>
       </>}
     </View>
    </>}

    {page==='mine'&&<>
     <View style={[ui.sectionHeading,{marginTop:19}]}><Headline>Meus negócios</Headline><Btn onPress={advertise}>+ Novo anúncio grátis</Btn></View>
     <Banner text="Nenhum anunciante paga para publicar. Cadastros e alterações passam por aprovação antes de aparecer nas buscas."/>
     {mine.length?mine.map(b=><View key={b.id} style={ui.card}>
      <View style={[ui.row,{alignItems:'flex-start'}]}>
       <Cover uri={b.image_url} category={b.category_id} small/>
       <View style={{flex:1,gap:5}}><Text style={ui.h3}>{b.name}</Text>
        <Text style={ui.muted}>{labelOf(REGIONS,b.region_id)} · {labelOf(CATEGORIES,b.category_id)}</Text>
        <SmallTag>{b.status==='published'?'Publicado':b.status==='pending'?'Aguardando aprovação':'Rejeitado'}</SmallTag>
       </View>
      </View>
      {!!b.status_note&&<Text style={ui.warningText}>{b.status_note}</Text>}
      <View style={ui.row}><Btn secondary onPress={()=>editBusiness(b)}>Editar negócio</Btn>
       <Btn secondary onPress={()=>createProduct(b)}>+ Produto/serviço</Btn>
       <Btn secondary onPress={()=>openBusiness(b)}>Ver catálogo</Btn></View>
     </View>):<View style={ui.empty}><Text style={ui.h3}>Você ainda não possui anúncios.</Text><Text style={ui.paragraph}>Comece com um perfil simples e um WhatsApp para receber pedidos.</Text><Btn onPress={advertise}>Cadastrar agora</Btn></View>}
    </>}

    {page==='businessForm'&&<>
     <View style={[ui.sectionHeading,{marginTop:19}]}><Headline>{editingBusiness?'Editar negócio':'Cadastrar negócio grátis'}</Headline><Btn secondary onPress={()=>go('mine')}>Voltar</Btn></View>
     <View style={[ui.card,{maxWidth:800,width:'100%',alignSelf:'center'}]}>
      <BusinessForm key={(editingBusiness?.id||'new')+'-'+formNonce} initial={editingBusiness}
       busy={busy} onSubmit={saveBusiness} onCancel={()=>go('mine')}/>
     </View>
    </>}

    {page==='productForm'&&<>
     <View style={[ui.sectionHeading,{marginTop:19}]}><Headline>{editingProduct?'Editar':'Adicionar'} produto/serviço</Headline><Btn secondary onPress={()=>go('mine')}>Voltar</Btn></View>
     <View style={[ui.card,{maxWidth:770,width:'100%',alignSelf:'center'}]}>
      <Text style={ui.muted}>Para: {productBusiness?.name}</Text>
      <ProductForm key={(editingProduct?.id||'new')+'-'+formNonce} initial={editingProduct}
       busy={busy} onSubmit={saveProduct} onCancel={()=>go('mine')}/>
     </View>
    </>}

    {page==='admin'&&admin&&<>
     <View style={[ui.sectionHeading,{marginTop:19}]}><Headline>Moderação do marketplace</Headline>
      <Btn secondary onPress={openAdmin}>Atualizar fila</Btn></View>
     <Banner warning text="A aprovação de um cadastro confirma apenas a revisão do anúncio, não a identidade jurídica, qualidade do serviço ou posição política de pessoas."/>
     {[['businesses','Cadastros de negócios'],['products','Produtos e serviços'],['reviews','Avaliações']].map(([type,title])=><View key={type} style={ui.card}>
      <Text style={ui.h3}>{title} · {(queue[type]||[]).length} pendente(s)</Text>
      {!queue[type]?.length&&<Text style={ui.muted}>Nenhum item aguardando aprovação.</Text>}
      {(queue[type]||[]).map(item=><View key={item.id} style={{gap:8,paddingVertical:9}}>
       <View style={ui.divider}/>
       <Text style={ui.h3}>{item.name||(type==='reviews'?'Avaliação '+item.rating+' estrelas':'Item '+item.id.slice(0,8))}</Text>
       {type==='businesses'&&<Text style={ui.muted}>{labelOf(REGIONS,item.region_id)} · {item.neighborhood} · {item.whatsapp}</Text>}
       {!!item.description&&<Text style={ui.paragraph}>{item.description}</Text>}
       {!!item.comment&&<Text style={ui.paragraph}>{item.comment}</Text>}
       {!!item.image_url&&<Cover uri={item.image_url} category={item.category_id}/>}
       <View style={ui.row}><Btn disabled={busy} onPress={()=>moderate(type,item.id,true)}>Aprovar</Btn>
        <Btn secondary disabled={busy} onPress={()=>moderate(type,item.id,false)}>Rejeitar</Btn></View>
      </View>)}
     </View>)}
    </>}
    <Text style={ui.footer}>Direita Negócios DF · Piloto comunitário gratuito · Sem cobrança e sem comissão. Pessoas consumidoras não precisam declarar opinião política. Conteúdos e anúncios são de responsabilidade de seus autores, sujeitos à moderação.</Text>
   </View>
  </ScrollView>
 </SafeAreaView>;
}
