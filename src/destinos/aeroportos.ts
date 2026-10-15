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

/** Pontuação menor = melhor opção para a cidade (perto, grande e internacional) */
function pontuar(linha: Linha, distancia: number) {
  const internacional = /international|internacional|intl/i.test(linha[1]);
  return distancia - (linha[6] ? 30 : 0) - (internacional ? 25 : 0);
}

function montar(linha: Linha, distancia: number): Aeroporto {
  const [iata, nome, cidade, codigoPais] = linha;
  return { iata, nome, cidade, codigoPais, distanciaKm: Math.round(distancia) };
}

/**
 * Aeroportos que atendem uma coordenada, do mais indicado ao menos.
 * O primeiro é o palpite do app (grandes e internacionais levam vantagem),
 * mas a lista inteira é oferecida: quem sai de São Paulo pode querer Congonhas.
 */
export function aeroportosParaCidade(lat: number, lng: number, limite = 6): Aeroporto[] {
  const perto: Array<{ linha: Linha; distancia: number; pontuacao: number }> = [];

  for (const linha of AEROPORTOS) {
    const distancia = distanciaKm(lat, lng, linha[4], linha[5]);
    if (distancia > RAIO_MAXIMO_KM) continue;
    perto.push({ linha, distancia, pontuacao: pontuar(linha, distancia) });
  }

  return perto
    .sort((a, b) => a.pontuacao - b.pontuacao)
    .slice(0, limite)
    .map((item) => montar(item.linha, item.distancia));
}

/** Só o melhor palpite (usado para preencher o campo automaticamente) */
export function aeroportoParaCidade(lat: number, lng: number): Aeroporto | null {
  return aeroportosParaCidade(lat, lng, 1)[0] ?? null;
}

function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
