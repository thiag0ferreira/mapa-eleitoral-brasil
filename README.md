# Direita Negócios DF — piloto 100% gratuito

Marketplace responsivo em **Expo / React Native Web + Supabase**, para divulgação voluntária de negócios e profissionais autônomos no Distrito Federal. **Não há cobrança de cadastro, comissão, mensalidade, checkout ou integração com pagamentos.**

O código do antigo **Mapa Eleitoral Brasil** foi preservado em `src/legacy/MapaEleitoralApp.js` e nos módulos de mapa. O novo aplicativo é iniciado por `App.js`, usando `src/screens/MarketplaceApp.js`. O endereço GitHub Pages permanece o mesmo por enquanto, evitando links quebrados.

## Funcionalidades do MVP

- Catálogo com busca por palavras-chave, **15 categorias** e **35 regiões administrativas do DF**.
- Cadastros de **autônomos (inclusive negócios em casa), MEIs e empresas**, sem exigência de CNPJ no piloto.
- Perfil com nome, categoria, região, bairro, descrição, WhatsApp, atendimento e foto opcional.
- **Endereço exato é opcional e fica oculto por padrão**, adequado a quem trabalha em casa.
- Produtos ou serviços com descrição, preço opcional e foto opcional.
- Contato direto por **WhatsApp**, sem intermediar pagamentos.
- Avaliações de atendimento de 1 a 5 estrelas e comentários, somente após aprovação.
- Moderação de novos negócios, produtos e avaliações, com painel para administrador.
- **Nenhuma necessidade de chave do Google Maps, Geoapify ou outra API paga de localização.**
- O marketplace não pede opinião política do consumidor; adesão do anunciante é voluntária e não representa funcionários ou clientes.

## 1. Ativar banco (obrigatório)

O projeto **Supabase existente continua sendo utilizado**. No Supabase Dashboard → **SQL Editor**, execute **uma única vez**:

[`supabase/migrations/202610280002_marketplace_df.sql`](./supabase/migrations/202610280002_marketplace_df.sql)

O SQL cria tabelas novas com prefixo `marketplace_` e regras RLS. **Não apaga nenhuma tabela nem voto anterior**.

Tabelas: `marketplace_categories`, `marketplace_regions`, `marketplace_admins`, `marketplace_businesses`, `marketplace_products`, `marketplace_reviews`. Cria o bucket público de fotos `marketplace-images` com limite de 3 MB (JPG, PNG, WEBP).

Enquanto a migração não for executada, a home mostra **três perfis explicitamente fictícios**, sem contato real, para testar o layout. **Anúncios reais não serão persistidos até executar o SQL.**

## 2. Habilitar administrador de moderação (obrigatório para publicar anúncios)

1. Entre no marketplace com uma conta Supabase que você controla e cujo e-mail já foi confirmado.
2. No Supabase → SQL Editor, rode este comando, **substituindo somente o e-mail pelo seu**:

```sql
insert into public.marketplace_admins (user_id)
select id from auth.users where email = 'SEU_EMAIL_AQUI'
on conflict (user_id) do nothing;
```

3. Atualize a página e entre em **Moderar** no cabeçalho. Usuários sem papel de administrador não veem essa tela.
4. Cadastros começam com status `pending`. Somente após aprovação um negócio aparece nas buscas públicas. Produtos e avaliações também começam pendentes.

**Não conceda privilégios de administrador a contas desconhecidas.** O cadastro autodeclarado não comprova identidade empresarial nem posicionamentos pessoais.

## 3. Testar o fluxo

1. Entre com sua conta, clique em **Anunciar** e crie um negócio fictício de teste (ou um negócio real com permissão do responsável).
2. Informe região administrativa, categoria, WhatsApp e descrição. Se trabalhar de casa, **não selecione publicar endereço comercial**.
3. Em **Meus anúncios**, confira o status **Aguardando aprovação**.
4. Com a conta admin, abra **Moderar**, revise o anúncio e aprove.
5. Em outra sessão ou navegador, confirme que o negócio ficou visível na busca. Clique em **WhatsApp**.
6. Como anunciante, adicione um produto/serviço; aprove o produto no painel. Teste também avaliações de outro usuário.
7. Fotos são opcionais e funcionam **no navegador**; upload nativo ficará para outra etapa.

## 4. Publicar gratuitamente

O GitHub Pages utiliza `.github/workflows/pages.yml`, com as variáveis já configuradas:

- `EXPO_PUBLIC_SUPABASE_URL`: URL do projeto.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: chave pública (anon/publishable).

Execute o workflow **Publicar web no GitHub Pages** no repositório. Endereço:
https://thiag0ferreira.github.io/mapa-eleitoral-brasil/

Para desenvolvimento local:

```bash
npm install
# copie .env.example para .env e configure somente as chaves PUBLICAS Supabase
npm run web
```

**Nunca publique `service_role` ou senhas de banco.** Fotos são visíveis publicamente quando o link é conhecido. Não publique fotos/documentos pessoais ou dados de terceiros.

## 5. Restrições do piloto

- Sem pagamentos, logística, entregas, comissão ou assinatura.
- Não inclui verificação de CNPJ, licenças profissionais ou identidade.
- O **administrador aprova manualmente** todos os anúncios, produtos e avaliações.
- O catálogo público não identifica nem classifica posicionamento político de pessoas.
- Cadastros e avaliações devem respeitar LGPD, direitos autorais, regras profissionais (incluindo OAB e serviços de saúde) e direitos dos consumidores.
- Before lançamento aberto: adicionar denúncias, bloqueio de spam, política de privacidade, termos de uso, exclusão de conta e controle antiabuso; testar limites de storage/DB do Supabase Free.
- Dados de região são **regiões administrativas do DF**, e não municípios diferentes. A lista é local.
- Em contas com Auth obrigatório de confirmação de e-mail, a pessoa precisa confirmar antes do login.
- O projeto usa GitHub Pages para frontend e Supabase para backend; plano gratuito tem limites de tráfego e armazenamento.

## Estrutura principal
- `src/screens/MarketplaceApp.js`: páginas do marketplace.
- `src/components/MarketplaceForms.js`: formulários de cadastro e produto.
- `src/components/PhotoPicker.web.js`: seleção de fotos na web.
- `src/services/marketplace.js`: operações de dados e moderação.
- `src/data/marketplace.js`: categorias, regiões e exemplos fictícios.
- `supabase/migrations/202610280002_marketplace_df.sql`: esquema PostgreSQL + RLS + storage.
