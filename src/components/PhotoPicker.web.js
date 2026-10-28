import React,{useRef} from 'react';
import {View,Text,Pressable} from 'react-native';
export default function PhotoPicker({value,onChange}){
 const ref=useRef(null);
 return <View style={{gap:7}}>
  <Pressable onPress={()=>ref.current?.click()} accessibilityRole="button"
   style={{padding:13,borderWidth:1,borderColor:'#cbd5e1',borderRadius:12,backgroundColor:'#fff'}}>
   <Text style={{color:'#34455b',fontWeight:'700'}}>📷 {value?.name||'Escolher uma foto (JPG, PNG, WEBP)'}</Text>
  </Pressable>
  <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
   onChange={e=>onChange(e.target.files?.[0]||null)}
   style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}}/>
  <Text style={{color:'#64748b',fontSize:11}}>Máximo: 3 MB. A imagem será pública somente quando associada ao anúncio.</Text>
 </View>;
}
