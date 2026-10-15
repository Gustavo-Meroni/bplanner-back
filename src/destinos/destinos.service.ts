import { BadRequestException, Injectable } from '@nestjs/common';
import { FonteExterna } from './fonte-externa';
import { aeroportoParaCidade } from './aeroportos';
import paisesBrutos from './data/paises.json';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export interface Destino {
  nome: string;
  regiao: string | null;
  pais: string | null;
  codigoPais: string | null;
  lat: number;
  lng: number;
  aeroporto: string | null;
}

/**
 * Integrações gratuitas e sem chave usadas no onboarding:
 *  - Open-Meteo Geocoding: cidades com coordenadas
 *  - world-countries (arquivo local, mledoze/countries): bandeira, moeda e idioma
 *  - Open-Meteo Archive: clima típico do mês (média dos últimos anos)
 *  - Nager.Date: feriados nacionais
 *  - ExchangeRate-API (open access): câmbio diário
 *  - OurAirports (arquivo local): código do aeroporto
 */
@Injectable()
export class DestinosService {
  private readonly fonteGeocoding = new FonteExterna('a busca de cidades', DIA);
  private readonly fonteClima = new FonteExterna('o clima', 7 * DIA);
  private readonly fonteFeriados = new FonteExterna('os feriados', 7 * DIA);
  private readonly fonteCambio = new FonteExterna('o câmbio', 6 * HORA, 50);

  async buscar(termo: string): Promise<Destino[]> {
    const q = termo.trim();
    if (q.length < 2) return [];

    const params = new URLSearchParams({ name: q, count: '8', language: 'pt', format: 'json' });
    const resposta = await this.fonteGeocoding.buscar<{
      results?: Array<{ name: string; admin1?: string; country?: string; country_code?: string; latitude: number; longitude: number }>;
    }>(`https://geocoding-api.open-meteo.com/v1/search?${params}`);

    return (resposta?.results ?? []).map((r) => ({
      nome: r.name,
      regiao: r.admin1 ?? null,
      pais: r.country ?? null,
      codigoPais: r.country_code ?? null,
      lat: r.latitude,
      lng: r.longitude,
      aeroporto: aeroportoParaCidade(r.latitude, r.longitude)?.iata ?? null,
    }));
  }

  aeroporto(lat: number, lng: number) {
    return aeroportoParaCidade(lat, lng);
  }

  /** Dados do país vêm de um arquivo local: mudam raramente e não dependem de API externa */
  pais(codigo: string) {
    const cc = validarCodigoPais(codigo);
    const p = PAISES[cc];
    return p ? { codigo: cc, ...p } : null;
  }

  /**
   * Clima típico de um mês: média dos últimos 3 anos completos
   * (temperatura máxima, mínima e dias com chuva ≥ 1 mm).
   */
  async climaDoMes(lat: number, lng: number, mes: number) {
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new BadRequestException('Mês inválido (1 a 12).');

    const anoFinal = new Date().getUTCFullYear() - 1;
    const params = new URLSearchParams({
      latitude: lat.toFixed(2),
      longitude: lng.toFixed(2),
      start_date: `${anoFinal - 2}-01-01`,
      end_date: `${anoFinal}-12-31`,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      timezone: 'auto',
    });
    const resposta = await this.fonteClima.buscar<{
      daily?: { time: string[]; temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_sum: (number | null)[] };
    }>(`https://archive-api.open-meteo.com/v1/archive?${params}`);

    const d = resposta?.daily;
    if (!d) return null;

    const maximas: number[] = [];
    const minimas: number[] = [];
    let diasComChuva = 0;
    let diasNoMes = 0;
    d.time.forEach((dia, i) => {
      if (Number(dia.slice(5, 7)) !== mes) return;
      diasNoMes++;
      if (d.temperature_2m_max[i] != null) maximas.push(d.temperature_2m_max[i]!);
      if (d.temperature_2m_min[i] != null) minimas.push(d.temperature_2m_min[i]!);
      if ((d.precipitation_sum[i] ?? 0) >= 1) diasComChuva++;
    });
    if (!maximas.length) return null;

    const anos = Math.max(diasNoMes / 30.4, 1);
    return {
      mes,
      maximaMedia: Math.round(media(maximas)),
      minimaMedia: Math.round(media(minimas)),
      diasDeChuva: Math.round(diasComChuva / anos),
      fonte: 'Open-Meteo',
    };
  }

  /** Feriados nacionais de um país entre duas datas (AAAA-MM-DD) */
  async feriadosNoPeriodo(codigo: string, inicio: string, fim: string) {
    const cc = validarCodigoPais(codigo);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || fim < inicio) {
      throw new BadRequestException('Período inválido.');
    }

    const anos = new Set([Number(inicio.slice(0, 4)), Number(fim.slice(0, 4))]);
    const listas = await Promise.all(
      [...anos].map((ano) =>
        this.fonteFeriados.buscar<Array<{ date: string; localName: string; name: string; global: boolean }>>(
          `https://date.nager.at/api/v3/PublicHolidays/${ano}/${cc}`,
          { aceitar404: true },
        ),
      ),
    );

    return listas
      .flatMap((l) => l ?? [])
      .filter((f) => f.global && f.date >= inicio && f.date <= fim)
      .map((f) => ({ data: f.date, nome: f.localName, nomeIngles: f.name }));
  }

  /** Quanto vale 1 unidade de `de` em `para` (ex.: 1 BRL = 186,4 ARS) */
  async cambio(de: string, para: string) {
    const origem = validarMoeda(de);
    const destino = validarMoeda(para);
    const resposta = await this.fonteCambio.buscar<{ result: string; time_last_update_utc: string; rates: Record<string, number> }>(
      `https://open.er-api.com/v6/latest/${origem}`,
    );
    const taxa = resposta?.rates?.[destino];
    if (!taxa) throw new BadRequestException(`Sem cotação para ${destino}.`);

    return {
      de: origem,
      para: destino,
      taxa,
      atualizadoEm: resposta!.time_last_update_utc,
      fonte: { nome: 'Exchange Rate API', url: 'https://www.exchangerate-api.com' },
    };
  }
}

interface Pais {
  nome: string;
  bandeira: string | null;
  capital: string | null;
  regiao: string | null;
  moedas: Array<{ codigo: string; nome: string; simbolo: string | null }>;
  idiomas: string[];
}

const PAISES = paisesBrutos as Record<string, Pais>;

function validarCodigoPais(codigo: string) {
  const cc = (codigo ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) throw new BadRequestException('Código de país inválido (ex.: AR).');
  return cc;
}

function validarMoeda(codigo: string) {
  const c = (codigo ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) throw new BadRequestException('Código de moeda inválido (ex.: BRL).');
  return c;
}

function media(valores: number[]) {
  return valores.reduce((t, v) => t + v, 0) / valores.length;
}
