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
