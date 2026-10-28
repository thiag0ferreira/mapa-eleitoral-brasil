// Listas estáticas sincronizadas com a migração SQL do marketplace.
// O piloto é exclusivo do Distrito Federal. Sem APIs de mapas pagas.
export const CATEGORIES = [
  {
    "id": "alimentacao",
    "name": "Alimentação",
    "emoji": "🍰"
  },
  {
    "id": "restaurantes",
    "name": "Restaurantes",
    "emoji": "🍽️"
  },
  {
    "id": "automotivo",
    "name": "Automotivo",
    "emoji": "🔧"
  },
  {
    "id": "beleza",
    "name": "Beleza e estética",
    "emoji": "💇"
  },
  {
    "id": "reformas",
    "name": "Construção e reformas",
    "emoji": "🛠️"
  },
  {
    "id": "juridico",
    "name": "Serviços jurídicos",
    "emoji": "⚖️"
  },
  {
    "id": "saude",
    "name": "Saúde e bem-estar",
    "emoji": "💚"
  },
  {
    "id": "moda",
    "name": "Moda e acessórios",
    "emoji": "👗"
  },
  {
    "id": "tecnologia",
    "name": "Tecnologia",
    "emoji": "💻"
  },
  {
    "id": "educacao",
    "name": "Aulas e educação",
    "emoji": "📚"
  },
  {
    "id": "casa",
    "name": "Casa e decoração",
    "emoji": "🏠"
  },
  {
    "id": "pets",
    "name": "Animais e pet",
    "emoji": "🐾"
  },
  {
    "id": "eventos",
    "name": "Eventos e festas",
    "emoji": "🎉"
  },
  {
    "id": "servicos",
    "name": "Serviços gerais",
    "emoji": "🧰"
  },
  {
    "id": "outros",
    "name": "Outros",
    "emoji": "🛍️"
  }
];
export const REGIONS = [
  {
    "id": "plano-piloto",
    "name": "Plano Piloto"
  },
  {
    "id": "gama",
    "name": "Gama"
  },
  {
    "id": "taguatinga",
    "name": "Taguatinga"
  },
  {
    "id": "brazlandia",
    "name": "Brazlândia"
  },
  {
    "id": "sobradinho",
    "name": "Sobradinho"
  },
  {
    "id": "planaltina",
    "name": "Planaltina"
  },
  {
    "id": "paranoa",
    "name": "Paranoá"
  },
  {
    "id": "nucleo-bandeirante",
    "name": "Núcleo Bandeirante"
  },
  {
    "id": "ceilandia",
    "name": "Ceilândia"
  },
  {
    "id": "guara",
    "name": "Guará"
  },
  {
    "id": "cruzeiro",
    "name": "Cruzeiro"
  },
  {
    "id": "samambaia",
    "name": "Samambaia"
  },
  {
    "id": "santa-maria",
    "name": "Santa Maria"
  },
  {
    "id": "sao-sebastiao",
    "name": "São Sebastião"
  },
  {
    "id": "recanto-das-emas",
    "name": "Recanto das Emas"
  },
  {
    "id": "lago-sul",
    "name": "Lago Sul"
  },
  {
    "id": "riacho-fundo",
    "name": "Riacho Fundo"
  },
  {
    "id": "lago-norte",
    "name": "Lago Norte"
  },
  {
    "id": "candangolandia",
    "name": "Candangolândia"
  },
  {
    "id": "aguas-claras",
    "name": "Águas Claras"
  },
  {
    "id": "riacho-fundo-ii",
    "name": "Riacho Fundo II"
  },
  {
    "id": "sudoeste-octogonal",
    "name": "Sudoeste/Octogonal"
  },
  {
    "id": "varjao",
    "name": "Varjão"
  },
  {
    "id": "park-way",
    "name": "Park Way"
  },
  {
    "id": "scia-estrutural",
    "name": "SCIA/Estrutural"
  },
  {
    "id": "sobradinho-ii",
    "name": "Sobradinho II"
  },
  {
    "id": "jardim-botanico",
    "name": "Jardim Botânico"
  },
  {
    "id": "itapoa",
    "name": "Itapoã"
  },
  {
    "id": "sia",
    "name": "Setor de Indústria e Abastecimento"
  },
  {
    "id": "vicente-pires",
    "name": "Vicente Pires"
  },
  {
    "id": "fercal",
    "name": "Fercal"
  },
  {
    "id": "sol-nascente-por-do-sol",
    "name": "Sol Nascente/Pôr do Sol"
  },
  {
    "id": "arniqueira",
    "name": "Arniqueira"
  },
  {
    "id": "arapoanga",
    "name": "Arapoanga"
  },
  {
    "id": "agua-quente",
    "name": "Água Quente"
  }
];
export const labelOf = (items,id) => items.find(item=>item.id===id)?.name||id||'';
export const DEMO_BUSINESSES = [
 {id:'demo-doces',name:'Doces da Dona Ana — exemplo',business_type:'autonomo',category_id:'alimentacao',region_id:'ceilandia',neighborhood:'Ceilândia Norte',description:'Exemplo de catálogo de bolos, brigadeiros e salgados feitos sob encomenda.',status:'demo',demo:true,community_opt_in:false,service_mode:'delivery'},
 {id:'demo-oficina',name:'Oficina do Bairro — exemplo',business_type:'mei',category_id:'automotivo',region_id:'taguatinga',neighborhood:'Taguatinga Norte',description:'Exemplo de serviços de mecânica e manutenção de veículos.',status:'demo',demo:true,community_opt_in:false,service_mode:'local'},
 {id:'demo-manicure',name:'Studio Beleza — exemplo',business_type:'autonomo',category_id:'beleza',region_id:'aguas-claras',neighborhood:'Águas Claras',description:'Exemplo de manicure, pedicure e serviços de beleza.',status:'demo',demo:true,community_opt_in:false,service_mode:'appointment'}
];
