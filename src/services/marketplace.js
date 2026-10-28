import {supabase,configurado} from './supabase';

const table=(name)=>{if(!supabase)throw Error('Supabase não está configurado.');return supabase.from(name)};
const unwrap=({data,error})=>{if(error)throw error;return data};
export const backendReady=configurado;

export async function listBusinesses(){
 const data=unwrap(await table('marketplace_businesses')
  .select('id,name,business_type,category_id,region_id,neighborhood,description,whatsapp,service_mode,public_address,image_url,community_opt_in,status,created_at')
  .eq('status','published').order('created_at',{ascending:false}).limit(200));
 return data||[];
}
export async function myBusinesses(){
 const {data:{user},error:userError}=await supabase.auth.getUser();
 if(userError)throw userError;
 if(!user)throw Error('Faça login para gerenciar seus anúncios.');
 return unwrap(await table('marketplace_businesses').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}));
}
export async function businessProducts(businessId){
 return unwrap(await table('marketplace_products').select('*').eq('business_id',businessId).order('created_at',{ascending:false}).limit(100));
}
export async function businessReviews(businessId){
 return unwrap(await table('marketplace_reviews').select('id,rating,comment,created_at,status').eq('business_id',businessId).eq('status','published').order('created_at',{ascending:false}).limit(40));
}
function normalizePhone(phone){
 let digits=String(phone||'').replace(/\D/g,'');
 if(digits.length===10||digits.length===11)digits='55'+digits;
 if(digits.length<12||digits.length>13)throw Error('Informe um WhatsApp com DDD brasileiro válido.');
 return digits;
}
function businessPayload(form){
 const name=String(form.name||'').trim();
 if(name.length<3)throw Error('O nome do negócio precisa de pelo menos 3 caracteres.');
 if(!form.category_id||!form.region_id)throw Error('Selecione categoria e região administrativa.');
 if(!form.community_opt_in)throw Error('Confirme que deseja participar voluntariamente do diretório.');
 return {
  name,category_id:form.category_id,region_id:form.region_id,
  business_type:form.business_type||'autonomo',neighborhood:String(form.neighborhood||'').trim().slice(0,90),
  description:String(form.description||'').trim().slice(0,1500),
  whatsapp:normalizePhone(form.whatsapp),
  service_mode:form.service_mode||'delivery',
  // O endereço exato é opcional; não exibir residência de quem trabalha em casa.
  public_address:form.show_address?String(form.public_address||'').trim().slice(0,200):'',
  community_opt_in:true,status:'pending',updated_at:new Date().toISOString()
 };
}
export async function saveBusiness(form,existingId){
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError)throw authError;
 if(!user)throw Error('Entre na sua conta para cadastrar um negócio.');
 const payload=businessPayload(form);
 const response=existingId?
  await table('marketplace_businesses').update(payload).eq('id',existingId).eq('owner_id',user.id).select('*').single():
  await table('marketplace_businesses').insert({...payload,owner_id:user.id}).select('*').single();
 return unwrap(response);
}
export async function saveProduct(form,businessId,existingId){
 if(!businessId)throw Error('Negócio não selecionado.');
 const name=String(form.name||'').trim();
 if(name.length<3)throw Error('Informe o nome do produto/serviço.');
 let price=null;
 if(String(form.price||'').trim()){
  const n=Number(String(form.price).replace(/\./g,'').replace(',','.'));
  if(!Number.isFinite(n)||n<0||n>99999999.99)throw Error('Preço inválido.');
  price=Math.round(n*100)/100;
 }
 const payload={name,description:String(form.description||'').trim().slice(0,900),price,business_id:businessId,status:'pending',updated_at:new Date().toISOString()};
 const response=existingId?
  await table('marketplace_products').update(payload).eq('id',existingId).select('*').single():
  await table('marketplace_products').insert(payload).select('*').single();
 return unwrap(response);
}
export async function updateBusinessPhoto(id,url){
 return unwrap(await table('marketplace_businesses').update({image_url:url,status:'pending',updated_at:new Date().toISOString()}).eq('id',id).select('*').single());
}
export async function updateProductPhoto(id,url){
 return unwrap(await table('marketplace_products').update({image_url:url,status:'pending',updated_at:new Date().toISOString()}).eq('id',id).select('*').single());
}
export async function uploadPhoto(file,businessId){
 if(!file)return null;
 const {data:{user},error}=await supabase.auth.getUser();
 if(error)throw error;
 if(!user)throw Error('Entre na sua conta para enviar fotos.');
 if(!businessId)throw Error('Salve o anúncio antes de enviar a foto.');
 const allowed={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 const ext=allowed[file.type];
 if(!ext)throw Error('Envie uma foto JPG, PNG ou WEBP.');
 if(file.size>3145728)throw Error('A foto deve ter no máximo 3 MB.');
 const fileName=user.id+'/'+businessId+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext;
 const bytes=new Uint8Array(await file.arrayBuffer());
 const uploaded=await supabase.storage.from('marketplace-images').upload(fileName,bytes,{contentType:file.type,upsert:false});
 if(uploaded.error)throw uploaded.error;
 const {data}=supabase.storage.from('marketplace-images').getPublicUrl(fileName);
 return data.publicUrl;
}
export async function submitReview(business,rating,comment){
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError)throw authError;
 if(!user)throw Error('Faça login para avaliar.');
 if(!business||business.demo||business.status!=='published')throw Error('Este anúncio não está disponível para avaliação.');
 const score=Number(rating);
 if(!Number.isInteger(score)||score<1||score>5)throw Error('Selecione de 1 a 5 estrelas.');
 const body=String(comment||'').trim().slice(0,1000);
 const payload={business_id:business.id,author_id:user.id,rating:score,comment:body,status:'pending',updated_at:new Date().toISOString()};
 return unwrap(await table('marketplace_reviews').upsert(payload,{onConflict:'business_id,author_id'}).select('id').single());
}
export async function checkAdmin(){
 if(!supabase)return false;
 const {data,error}=await supabase.rpc('marketplace_is_admin');
 if(error)throw error;
 return Boolean(data);
}
export async function pendingQueue(){
 const [businesses,products,reviews]=await Promise.all([
  table('marketplace_businesses').select('*').eq('status','pending').order('created_at',{ascending:true}).limit(100),
  table('marketplace_products').select('*').eq('status','pending').order('created_at',{ascending:true}).limit(100),
  table('marketplace_reviews').select('*').eq('status','pending').order('created_at',{ascending:true}).limit(100)
 ]);
 return {businesses:unwrap(businesses)||[],products:unwrap(products)||[],reviews:unwrap(reviews)||[]};
}
export async function moderate(type,id,approve){
 const mapping={businesses:'marketplace_businesses',products:'marketplace_products',reviews:'marketplace_reviews'};
 const dest=mapping[type];
 if(!dest)throw Error('Tipo de moderação inválido.');
 return unwrap(await table(dest).update({status:approve?'published':'rejected',updated_at:new Date().toISOString()}).eq('id',id).select('id').single());
}
export function whatsappUrl(business){
 const phone=String(business?.whatsapp||'').replace(/\D/g,'');
 if(!phone)return '';
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent('Olá! Encontrei '+business.name+' no Direita Negócios DF e gostaria de saber mais.');
}
