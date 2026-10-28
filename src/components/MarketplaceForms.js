import React,{useState} from 'react';
import {View,Text,TextInput,ScrollView,Pressable,Modal,StyleSheet} from 'react-native';
import PhotoPicker from './PhotoPicker';
import {CATEGORIES,REGIONS,labelOf} from '../data/marketplace';
import {COLOR,ui} from './marketplaceStyles';

export function Btn({children,onPress,secondary=false,disabled=false,style}){
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
  style={[ui.button,secondary&&ui.buttonOutline,disabled&&{opacity:.5},style]}>
  <Text style={[ui.buttonText,secondary&&ui.buttonOutlineText]}>{children}</Text>
 </Pressable>;
}
export function Field({label,value,onChangeText,placeholder,multiline=false,keyboardType,required=false,maxLength,secureTextEntry=false,autoCapitalize='sentences'}){
 return <View style={{gap:6}}>
  <Text style={ui.label}>{label}{required?' *':''}</Text>
  <TextInput style={[ui.input,multiline&&{height:94,textAlignVertical:'top'}]} value={value}
   onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8995a1"
   multiline={multiline} keyboardType={keyboardType} maxLength={maxLength} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize}/>
 </View>;
}
export function SelectModal({label,items,value,onChange,placeholder='Selecionar',disabled=false}){
 const [open,setOpen]=useState(false);
 const [filter,setFilter]=useState('');
 const shown=items.filter(p=>p.name.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR')));
 return <View style={{gap:6}}>
  {!!label&&<Text style={ui.label}>{label}</Text>}
  <Pressable accessibilityRole="button" disabled={disabled} onPress={()=>{setOpen(true);setFilter('')}}
   style={[ui.input,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
   <Text style={{color:value?COLOR.ink:'#7f8c9b',fontWeight:'600',flexShrink:1}}>{labelOf(items,value)||placeholder}</Text>
   <Text style={{color:COLOR.muted}}>⌄</Text>
  </Pressable>
  <Modal visible={open} transparent animationType="slide" onRequestClose={()=>setOpen(false)}>
   <View style={st.overlay}>
    <View style={st.sheet}>
     <View style={ui.sectionHeading}><Text style={ui.h3}>{label||'Selecionar'}</Text><Btn secondary onPress={()=>setOpen(false)}>Fechar</Btn></View>
     <TextInput value={filter} onChangeText={setFilter} placeholder="Filtrar opções" style={ui.input} placeholderTextColor="#718096"/>
     <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight:380}}>
      {shown.map(item=><Pressable key={item.id} onPress={()=>{onChange(item.id);setOpen(false)}}
       style={[st.option,item.id===value&&{backgroundColor:'#eef6f4'}]}>
       <Text style={{fontSize:14,color:COLOR.ink,fontWeight:item.id===value?'900':'600'}}>{item.emoji?item.emoji+' ':''}{item.name}</Text>
      </Pressable>)}
      {!shown.length&&<Text style={ui.muted}>Nenhuma opção encontrada.</Text>}
     </ScrollView>
    </View>
   </View>
  </Modal>
 </View>;
}
const TYPES=[{id:'autonomo',name:'Autônomo / negócio de casa',emoji:'🍰'},{id:'mei',name:'MEI / microempreendedor',emoji:'🛍️'},{id:'empresa',name:'Empresa',emoji:'🏢'}];
const MODES=[{id:'delivery',name:'Entrega / encomendas',emoji:'🛵'},{id:'appointment',name:'Atendimento com horário marcado',emoji:'📆'},
 {id:'local',name:'Local aberto ao público',emoji:'📍'},{id:'online',name:'Atendimento online',emoji:'💻'}];

export function BusinessForm({initial,onCancel,onSubmit,busy}){
 const [form,setForm]=useState({
  name:initial?.name||'',business_type:initial?.business_type||'autonomo',
  category_id:initial?.category_id||'alimentacao',region_id:initial?.region_id||'ceilandia',
  neighborhood:initial?.neighborhood||'',description:initial?.description||'',whatsapp:initial?.whatsapp||'',
  service_mode:initial?.service_mode||'delivery',public_address:initial?.public_address||'',
  show_address:!!initial?.public_address,community_opt_in:initial?.community_opt_in!==false
 });
 const [file,setFile]=useState(null);
 const set=(k,v)=>setForm(old=>({...old,[k]:v}));
 return <View style={{gap:14}}>
  <View style={ui.banner}><Text style={ui.info}>Todos os cadastros são gratuitos. Você não precisa ter CNPJ para anunciar atividades permitidas.</Text></View>
  <Field label="Nome do negócio" required value={form.name} onChangeText={v=>set('name',v)} maxLength={110} placeholder="Ex.: Doces da Dona Ana"/>
  <SelectModal label="Tipo de anunciante" items={TYPES} value={form.business_type} onChange={v=>set('business_type',v)}/>
  <SelectModal label="Categoria principal" items={CATEGORIES} value={form.category_id} onChange={v=>set('category_id',v)}/>
  <SelectModal label="Região administrativa do DF" items={REGIONS} value={form.region_id} onChange={v=>set('region_id',v)}/>
  <Field label="Bairro ou setor (opcional)" value={form.neighborhood} onChangeText={v=>set('neighborhood',v)} maxLength={90} placeholder="Ex.: Ceilândia Norte"/>
  <SelectModal label="Como você atende?" items={MODES} value={form.service_mode} onChange={v=>set('service_mode',v)}/>
  <Field label="Descrição do seu negócio" multiline value={form.description} onChangeText={v=>set('description',v)} maxLength={1500} placeholder="Explique o que você vende ou oferece."/>
  <Field label="WhatsApp com DDD" required value={form.whatsapp} onChangeText={v=>set('whatsapp',v)} keyboardType="phone-pad" placeholder="61 99999-9999"/>
  <Pressable onPress={()=>set('show_address',!form.show_address)} style={st.checkbox}>
   <Text style={st.check}>{form.show_address?'☑':'☐'}</Text>
   <View style={{flex:1}}><Text style={ui.label}>Divulgar endereço do ponto comercial</Text>
    <Text style={ui.muted}>Não marque se trabalha em casa e prefere divulgar só a região.</Text></View>
  </Pressable>
  {form.show_address&&<Field label="Endereço comercial público" value={form.public_address} onChangeText={v=>set('public_address',v)} maxLength={200} placeholder="Rua, lote, número..."/>}
  <View style={{gap:7}}><Text style={ui.label}>Foto de capa (opcional)</Text><PhotoPicker value={file} onChange={setFile}/></View>
  <Pressable onPress={()=>set('community_opt_in',!form.community_opt_in)} style={st.checkbox}>
   <Text style={st.check}>{form.community_opt_in?'☑':'☐'}</Text>
   <View style={{flex:1}}>
    <Text style={ui.label}>Quero participar voluntariamente deste diretório de negócios.</Text>
    <Text style={ui.muted}>A adesão é do anunciante. Não representa as opiniões de funcionários, clientes ou familiares.</Text>
   </View>
  </Pressable>
  <View style={ui.warning}><Text style={ui.warningText}>Após salvar, o anúncio será enviado para análise. Produtos e avaliações também passam por moderação. Não cobramos nada nesta fase.</Text></View>
  <View style={ui.row}><Btn disabled={busy} onPress={()=>onSubmit(form,file)}>{busy?'Salvando...':initial?'Salvar alterações':'Cadastrar gratuitamente'}</Btn>
   <Btn secondary onPress={onCancel}>Cancelar</Btn></View>
 </View>;
}

export function ProductForm({initial,onCancel,onSubmit,busy}){
 const [form,setForm]=useState({name:initial?.name||'',description:initial?.description||'',
  price:initial?.price!=null?String(initial.price).replace('.',','):''});
 const [file,setFile]=useState(null);
 return <View style={{gap:15}}>
  <Text style={ui.muted}>Cadastre produtos, encomendas ou serviços. Tudo grátis durante o piloto no DF.</Text>
  <Field required label="Produto ou serviço" value={form.name} onChangeText={v=>setForm(o=>({...o,name:v}))}
   placeholder="Ex.: cento de salgados" maxLength={100}/>
  <Field label="Descrição" multiline value={form.description} onChangeText={v=>setForm(o=>({...o,description:v}))}
   placeholder="Tamanho, quantidade, disponibilidade e detalhes..." maxLength={900}/>
  <Field label="Preço em R$ (opcional)" value={form.price} keyboardType="decimal-pad"
   onChangeText={v=>setForm(o=>({...o,price:v}))} placeholder="Ex.: 25,00 (deixe vazio para consultar)"/>
  <PhotoPicker value={file} onChange={setFile}/>
  <View style={ui.row}><Btn disabled={busy} onPress={()=>onSubmit(form,file)}>{busy?'Salvando...':initial?'Salvar produto':'Adicionar gratuitamente'}</Btn><Btn secondary onPress={onCancel}>Cancelar</Btn></View>
 </View>;
}
const st=StyleSheet.create({
 overlay:{flex:1,backgroundColor:'rgba(12,22,37,.55)',justifyContent:'flex-end'},
 sheet:{backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,padding:19,gap:13,maxHeight:'83%'},
 option:{paddingVertical:14,paddingHorizontal:8,borderBottomColor:'#e8edf2',borderBottomWidth:1},
 checkbox:{flexDirection:'row',gap:9,alignItems:'flex-start',padding:12,backgroundColor:'#f1f5f9',borderRadius:12},
 check:{fontSize:24,color:'#176344',marginTop:-3}
});
