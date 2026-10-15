# Dados locais

| Arquivo | Origem | Licença |
| --- | --- | --- |
| `aeroportos.json` | [OurAirports](https://ourairports.com/data/): aeroportos médios e grandes com voo comercial e código IATA. Formato: `[iata, nome, cidade, país, lat, lng, grande]` | Domínio público |
| `paises.json` | [mledoze/countries](https://github.com/mledoze/countries) (pacote `world-countries`): nome em português, bandeira, moedas e idiomas | ODbL 1.0 |

Para atualizar, gere os arquivos de novo a partir das fontes; o formato é lido em `aeroportos.ts` e `destinos.service.ts`.
