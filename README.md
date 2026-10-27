# Mapa Eleitoral Brasil — v0.2 (navegação experimental)

Aplicativo Expo (Android/iOS/web) com camada eleitoral **fictícia** e consulta de destinos por endereço.

**IMPORTANTE:** os resultados de voto exibidos NÃO são dados do TSE. Não é possível inferir a opinião política dos moradores ou a receptividade de pessoas em um endereço pelo resultado eleitoral.

## Funções

- Buscar destino brasileiro manualmente (sem autocomplete);
- Exibir marcador no mapa;
- Traçar rota estimada desde **Brasília, DF (origem fixa demonstrativa)**;
- Exibir distância e duração estimadas, sem tráfego ao vivo;
- Ligar/desligar a camada eleitoral fictícia por estado;
- Executar no navegador e em React Native.

## Executar

```bash
npm install
npm run web
```

Para Android/iOS, execute `npm start` e teste no Expo Go. Funcionalidade nativa ainda não validada em aparelhos.

## GitHub Pages

No repositório, abra **Settings → Pages**, selecione **GitHub Actions** e acompanhe o workflow `Publicar web no GitHub Pages`. Endereço: https://thiag0ferreira.github.io/mapa-eleitoral-brasil/

## Serviços externos e limites

- Geocodificação: Nominatim público, apenas buscas explicitamente acionadas pelo usuário; no máximo uma busca por segundo por instância, cache durante a sessão e nenhuma sugestão automática. **O limite oficial é global ao aplicativo, não por usuário**. Essa implementação somente serve para teste com pouquíssimos usuários, não para uso público em escala. Antes de lançar comercialmente, migrar a provedor próprio/contratado ou proxy com rate limiting central. Leia https://operations.osmfoundation.org/policies/nominatim/
- Rotas: servidor público demonstrativo OSRM, sem SLA e inadequado para distribuição massiva.
- Tiles: OpenStreetMap comunitário, sujeito a política e restrições de carga.
- Origem: Brasília, fixa apenas para demonstração. Ainda não há GPS, orientação vocal, atualizações de trânsito ou navegação curva a curva.

## Fonte eleitoral e granularidade

Atualmente a camada é inteiramente **simulada por UF** (`src/data/demo.js`). Futuro processamento **offline** dos dados abertos TSE e malhas IBGE para municípios e pontos georreferenciados dos locais de votação. Um ponto eleitoral não descreve uma área geográfica de influência e não deve pintar ruas ou residências arbitrariamente. Toda eleição exibirá ano, turno, fonte, status da apuração e definição dos candidatos comparados.

## Próximas etapas

1. Integração offline auditável TSE 2022;
2. GeoJSON municipal simplificado sob demanda;
3. Pontos reais de locais de votação com metadados agregados;
4. GPS com permissão e origem editável;
5. Serviço de geocodificação e rotas com capacidade e SLA para uso em massa.
