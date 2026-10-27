# Mapa Eleitoral Brasil

Protótipo Expo/React Native com mapa interativo por estados do Brasil. **Todos os resultados são dados fictícios**, não são resultados do TSE.

## Executar

```bash
npm install
npm run web
```

No celular use `npm start` e leia o QR code pelo Expo Go.

## Publicar gratuitamente no GitHub Pages

Após integrar os arquivos, a ação de publicação em `.github/workflows/pages.yml` construirá a versão web no GitHub Actions. No repositório entre em **Settings → Pages → Build and deployment** e selecione **GitHub Actions** como fonte.

URL prevista após deploy concluído: https://thiag0ferreira.github.io/mapa-eleitoral-brasil/

## Avisos

A geometria depende de acesso público ao GeoJSON. Dados eleitorais em `src/data/demo.js` são exclusivamente simulados. A integração TSE está planejada, não implementada. Para maior volume de acessos, observe a política de tiles do OpenStreetMap.
