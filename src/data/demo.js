// IMPORTANTE: resultados fictícios para testes. NÃO são dados do TSE.
export const DEMO = [
 ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']
].map(([uf,nome],i)=>({uf,nome,esquerda:60000+(i*18913)%92000,direita:60000+(i*31117+42319)%92000}));
const estados = Object.fromEntries(DEMO.map(x=>[x.nome.toLowerCase(),x]));
export function buscarEstado(p={}) {
 const nome=String(p.name||p.nome||p.NM_UF||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const encontrado=Object.values(estados).find(e=>e.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===nome);
 return encontrado||DEMO.find(e=>e.uf===(p.sigla||p.UF))||null;
}
export function colorir(e) {if(!e)return '#94a3b8';return e.esquerda>e.direita?'#dc4545':e.direita>e.esquerda?'#239560':'#94a3b8';}
export function percentual(e,c){if(!e)return '—';const total=e.esquerda+e.direita;return total?(100*e[c]/total).toFixed(1).replace('.',',')+'%':'—';}
