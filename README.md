# Mapa Eleitoral Brasil 🇧🇷

Protótipo **Expo + React Native + web** com mapa dos estados do Brasil.

> **DADOS FICTÍCIOS:** os votos demonstrados não são resultados do TSE. A integração oficial será uma etapa posterior.

## Rodar em computador

Requer Node.js 22 e npm.

```bash
npm install
npm run web
```

## Rodar no celular

```bash
npm install
npm start
```

Leia o QR code com o Expo Go. O modo nativo utiliza `react-native-maps` e a versão web utiliza Leaflet/OpenStreetMap.

## Hospedar grátis no GitHub Pages

Um workflow em `.github/workflows/pages.yml` publica a pasta `dist` em cada push para `main`.

1. Entre em **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Acesse **Actions → Publicar web no GitHub Pages** para acompanhar ou executar o workflow.
4. Depois que o deploy estiver concluído com sucesso, abra https://thiag0ferreira.github.io/mapa-eleitoral-brasil/.

O endereço não estará disponível até a primeira publicação bem-sucedida.

## Organização

- `App.js`: interface, legenda, painel e aviso de simulação.
- `src/screens/MapScreen.web.js`: mapa web Leaflet.
- `src/screens/MapScreen.native.js`: mapa nativo React Native Maps.
- `src/data/demo.js`: simulação de votos em 27 UFs.
- `src/services/geometria.js`: carregamento externo de malha GeoJSON.

## Limitações atuais

- Somente estados, ainda sem municípios.
- Geometria depende de fonte comunitária externa e conexão com a internet.
- Ainda não há dados oficiais nem atualizações em tempo real.
- Não há testes de aparelho/browser confirmados.
- Para tráfego elevado, adotar provedor de mapas adequado à política de utilização de tiles.
