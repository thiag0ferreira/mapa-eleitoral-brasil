# Mapa Eleitoral Brasil 2.0 — Fase 1 (DF)

Aplicativo Expo com busca de lugares OSM, rota experimental, GPS com permissão, cadastro/login Supabase e votos de classificação **colaborativa** verde/vermelho. Não apresenta a preferência política real de qualquer estabelecimento; é uma votação de percepção dos participantes.

## Executar
```bash
npm install
npm run web
```
No celular: `npm start` e Expo Go.

## Ativar autenticação e votação
1. Crie um projeto gratuito em https://supabase.com/dashboard.
2. No Supabase, abra **SQL Editor** e execute `supabase/migrations/202610270001_initial.sql`.
3. Configure **Authentication → Providers → Email** e escolha se exige confirmação por e-mail.
4. Em desenvolvimento local, copie `.env.example` para `.env`, preenchendo a **Project URL** e a **publishable/anon key** do Supabase (NUNCA a service_role).
5. No GitHub, abra **Settings → Secrets and variables → Actions → Variables** e crie **EXPO_PUBLIC_SUPABASE_URL** e **EXPO_PUBLIC_SUPABASE_ANON_KEY**. São configurações públicas de cliente, não segredos. Faça novo deploy pelo workflow Pages.
6. Configure Authentication → URL Configuration com a URL real do GitHub Pages, caso utilize links de confirmação por email. Ajustes adicionais de deep link serão necessários para nativo.

## Regras de votação
- Uma escolha por usuário/estabelecimento, alterável.
- Classificação verde/vermelho somente a partir de **20 votos** e **60%** de predominância; caso contrário, sem classificação.
- Autorização no banco via JWT e RLS. Nunca publicar chaves de administrador.
- A API de gravação aceita metadados OSM do cliente; **a existência do local ainda não é validada por backend próprio**. Antes de lançamento público, verificar IDs OSM no servidor, aplicar rate limits, antifraude, denúncias e políticas LGPD.

## Limites do protótipo
- Busca manual via Nominatim **não atende uso em massa**. Limite de 1 req/s vale para todos os usuários somados. Não use autocomplete.
- Busca restrita a uma caixa geográfica que inclui Brasília e DF; regiões na borda podem variar.
- Rota via OSRM demonstrativo, sem SLA ou tráfego. Não é um Waze completo.
- O cadastro ainda não tem painel de moderação, denúncia, exclusão de conta nem sistema de avaliação por estrelas. Não divulgar amplamente até implementá-los.
- Google Places não foi conectado: OpenStreetMap é a fonte inicial aprovada.
- O GitHub Pages hospeda só o frontend. A persistência depende de configurar Supabase.

## Licença e créditos
Mapa © OpenStreetMap contributors. Respeitar as políticas de uso dos tiles e geocodificação antes de escalar.

## Evolução da busca (0.3.1)

- Busca de nomes de locais nas categorias comerciais do OpenStreetMap por Overpass; fallback no Nominatim.
- Resultados múltiplos com nome, endereço, tipo, identificador OSM e distância **em linha reta**.
- Ordenação pela distância desde a origem selecionada (GPS, quando autorizado).
- Clicando em um resultado, abre-se o estabelecimento exato; votos ficam vinculados ao identificador `osm_type + osm_id` e não apenas ao nome.
- APIs comunitárias podem ficar lentas ou indisponíveis e não são apropriadas para alta demanda. São necessárias limitações de taxa globais e cache no backend antes do lançamento.
- A busca de pontos OSM não garante que todos os estabelecimentos comerciais existentes estejam mapeados ou tenham nome/endereço completos.


## Google Maps + Google Places (Opção A)
A versão **web** usa Google Maps JavaScript API e Places API (New), mas só se `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` estiver configurada. Enquanto não estiver, a busca OSM provisória permanece.
1. No Google Cloud, habilite faturamento, **Maps JavaScript API** e **Places API (New)**.
2. Crie uma **chave de navegador** com restrição de aplicativo por **HTTP referrers** para `https://thiag0ferreira.github.io/mapa-eleitoral-brasil/*` e, se necessário, `https://thiag0ferreira.github.io/*`. Para teste local inclua apenas os domínios localhost indispensáveis.
3. Restrinja a chave pelas APIs **Maps JavaScript API** e **Places API (New)**. A chave do navegador é pública; jamais publique chaves secretas.
4. Em GitHub → Settings → Secrets and variables → Actions → Variables, crie `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` com a chave de navegador e execute de novo o workflow de Pages.
5. No Supabase SQL Editor execute `supabase/migrations/202610270002_google_places.sql`. A migração preserva os votos OSM existentes, que não são automaticamente transferidos para Google Place IDs.
6. Habilite cotas e alertas de cobrança no Google Cloud e monitore o consumo: busca textual com nome e endereço pode incorrer no SKU Pro. Evite consultas automáticas.
7. **Ainda pendente:** substituir rota OSRM pela Routes API do Google, configurar SDK nativo Android/iOS com chaves específicas, implementar painel de administração, defesa contra fraude, termos e política de privacidade antes do lançamento público.
As respostas do Places são usadas apenas durante a sessão. No Supabase persistimos exclusivamente o Place ID (permitido pela política do Google), não fotos, notas, endereços ou conteúdo comercial.

## Navegação em tela cheia — Protótipo de acompanhamento (2026-10-27)

Depois de escolher um lugar, clique em **▶ Iniciar navegação com GPS**. O aplicativo solicita sua localização novamente (sem usar a origem fixa em Brasília), consulta uma rota rodoviária aproximada no OSRM e abre a visualização de navegação em tela cheia. Enquanto a página estiver visível e o GPS autorizado, acompanha a posição com `watchPosition` no navegador, orienta a próxima manobra de forma textual, exibe quilômetros e minutos restantes estimados e indica possível saída da rota. **Não oferece voz, tráfego em tempo real, desvio automático ou assistência à condução de nível Waze**.

O usuário pode acionar **Seguir GPS**, **Ver rota**, **Recalcular** (manual) ou **Abrir Google Maps/Waze**. Os links externos usam o destino (Place ID do Google quando disponível) e deixam que o aplicativo de navegação instalado use o GPS atual para iniciar orientação guiada. Google Maps pode abrir prévia em vez de orientação em determinados dispositivos. Não é preciso configurar outra API para abrir os links externos.

**Segurança e privacidade:** a posição de GPS só é monitorada durante a tela de navegação e o acompanhamento se encerra ao fechar; não há gravação do histórico de localização no Supabase. A navegação própria depende de sinal GPS e da página em primeiro plano. Faça seus testes parado ou como passageiro. O servidor OSRM é experimental, não indicado para dirigir dependendo exclusivamente dele ou para uso em massa.

## Provedor gratuito principal: Geoapify

O Google Maps Platform foi desativado por decisão do responsável pelo projeto. A versão web **não importa Google Maps ou Google Places nem utiliza sua chave**; links opcionais para abrir Google Maps/Waze no celular continuam disponíveis e não usam a API comercial do Google.

A chave `EXPO_PUBLIC_GEOAPIFY_API_KEY` liga busca geocodificada e rotas de carro Geoapify. Sem chave, a versão de teste mantém busca OSM/Overpass e rotas OSRM. O mapa continua usando Leaflet/OpenStreetMap (não é o visual de navegação 3D do Waze). Geocoding não possui cobertura idêntica ao Google Places e algumas unidades comerciais podem faltar.

1. Crie um projeto no plano Free em https://myprojects.geoapify.com/ (sem cartão).
2. Vá a API Keys, use uma chave do projeto e configure **Allowed HTTP referrers / origins** para `https://thiag0ferreira.github.io` e a página do aplicativo. Chaves públicas ficam visíveis em apps web; nunca use chave sem restrições em produção.
3. No GitHub → Settings → Secrets and variables → Actions → Variables, adicione `EXPO_PUBLIC_GEOAPIFY_API_KEY` com a chave pública restrita. NÃO envie a chave no chat.
4. No Supabase → SQL Editor, execute `supabase/migrations/202610280001_geoapify_places.sql`, para permitir votação em estabelecimentos com ID Geoapify (votos antigos OSM permanecem).
5. Execute `Publicar web no GitHub Pages` ou faça um novo commit. A API só será usada depois do novo build com essa variável.

**Limites:** franquia Free de 3.000 créditos por dia compartilhados pelos serviços, não 3.000 usuários; respeite limites por segundo. Rotas geocodificadas não têm trânsito ao vivo. A identificação de negócios usa metadados OSM existentes na resposta Geoapify; endereços não identificados como estabelecimentos ficam sem votação. Recomendado antifraude e verificação server-side de IDs antes do lançamento público.

Atribuição obrigatória quando utilizarmos os dados Geoapify: exibir `Powered by Geoapify` com link e a atribuição às fontes cartográficas. No frontend há texto de atribuição no painel de busca; na interface pública completa, manter essas informações acessíveis.
