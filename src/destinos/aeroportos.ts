import aeroportosBrutos from './data/aeroportos.json';

/**
 * Aeroportos com voo comercial e código IATA, extraídos da base pública OurAirports
 * (https://ourairports.com/data/, domínio público).
 * Formato compacto: [iata, nome, cidade, país, lat, lng, grande(1/0)]
 */
type Linha = [string, string, string, string, number, number, number];
const AEROPORTOS = aeroportosBrutos as Linha[];

export interface Aeroporto {
  iata: string;
  nome: string;
  cidade: string;
  codigoPais: string;
  distanciaKm: number;
}

const RAIO_MAXIMO_KM = 150;

/**
 * Aeroporto que melhor atende uma cidade. Não é só o mais próximo:
 * aeroportos grandes e internacionais levam vantagem, para que
 * São Paulo vire GRU (e não Congonhas) e Buenos Aires vire EZE.
 */
export function aeroportoParaCidade(lat: number, lng: number): Aeroporto | null {
  let melhor: { linha: Linha; distancia: number; pontuacao: number } | null = null;

  for (const linha of AEROPORTOS) {
    const distancia = distanciaKm(lat, lng, linha[4], linha[5]);
    if (distancia > RAIO_MAXIMO_KM) continue;
    const internacional = /international|internacional|intl/i.test(linha[1]);
    const pontuacao = distancia - (linha[6] ? 30 : 0) - (internacional ? 25 : 0);
    if (!melhor || pontuacao < melhor.pontuacao) melhor = { linha, distancia, pontuacao };
  }

  if (!melhor) return null;
  const [iata, nome, cidade, codigoPais] = melhor.linha;
  return { iata, nome, cidade, codigoPais, distanciaKm: Math.round(melhor.distancia) };
}

function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
