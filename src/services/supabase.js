import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configurado=!!(url&&key&&url.startsWith('https://'));
export const supabase=configurado?createClient(url,key,{auth:{storage:AsyncStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
export async function resumo(place){
 if(!supabase)return null;
 const {data,error}=place.google_place_id?await supabase.rpc('google_place_vote_summary',{p_place_id:place.google_place_id}):await supabase.rpc('place_vote_summary',{p_osm_type:place.osm_type,p_osm_id:place.osm_id});
 if(error)throw error;return data?.[0]||null;
}
export async function votar(place,choice){
 if(!supabase)throw Error('Banco Supabase não configurado.');
 const {error}=place.google_place_id?await supabase.rpc('google_vote_for_place',{p_place_id:place.google_place_id,p_choice:choice}):await supabase.rpc('vote_for_place',{p_osm_type:place.osm_type,p_osm_id:place.osm_id,p_name:place.name,p_lat:place.latitude,p_lon:place.longitude,p_choice:choice});
 if(error)throw error;
}
