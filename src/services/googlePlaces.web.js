// Google Maps JavaScript API + Places (New), somente Web.
// Solicita exclusivamente os campos necessários, sob demanda.
let loading;
export const GOOGLE_KEY=process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY||'';
export const googleReady=Boolean(GOOGLE_KEY);
export function carregarGoogle(){
 if(!googleReady)return Promise.reject(new Error('Google Maps ainda não configurado.'));
 if(typeof window==='undefined')return Promise.reject(new Error('Disponível na versão web.'));
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const callback='__mapaEleitoralMapsInit';
  const timeout=setTimeout(()=>{cleanup();reject(new Error('Tempo esgotado ao carregar Google Maps.'))},20000);
  function cleanup(){clearTimeout(timeout);delete window[callback];}
  window[callback]=()=>{cleanup();resolve(window.google.maps)};
  const script=document.createElement('script');
  script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(GOOGLE_KEY)+'&v=weekly&loading=async&language=pt-BR&region=BR&callback='+callback;
  script.async=true;script.onerror=()=>{cleanup();reject(new Error('Falha ao carregar Google Maps. Verifique chave, domínio e faturamento.'))};
  document.head.appendChild(script);
 }).catch(e=>{loading=null;throw e});
 return loading;
}
export async function buscarGooglePlaces(query,origem){
 const maps=await carregarGoogle();
 const {Place}=await maps.importLibrary('places');
 const req={textQuery:query+', Distrito Federal, Brasil',fields:['id','displayName','formattedAddress','location','primaryType'],region:'br',language:'pt-BR',maxResultCount:12};
 if(origem?.latitude&&origem?.longitude)req.locationBias={center:{lat:origem.latitude,lng:origem.longitude},radius:45000};
 const {places}=await Place.searchByText(req);
 return (places||[]).filter(x=>x.id&&x.location).map(x=>({
  id:'google:'+x.id,google_place_id:x.id,name:x.displayName||'Estabelecimento',label:x.formattedAddress||'Endereço não informado',
  category:x.primaryType||'estabelecimento',latitude:x.location.lat(),longitude:x.location.lng(),fonte:'Google Places'
 }));
}
