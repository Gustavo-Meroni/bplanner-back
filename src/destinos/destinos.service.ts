import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface Destino {
  nome: string;
  regiao: string | null;
  pais: string | null;
  codigoPais: string | null;
  lat: number;
  lng: number;
}

interface RespostaOpenMeteo {
  results?: Array<{
    name: string;
    admin1?: string;
    country?: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  }>;
}

const URL_BUSCA = 'https://geocoding-api.open-meteo.com/v1/search';
const DURACAO_CACHE_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 500;

/**
 * Busca de cidades para o onboarding, via API de geocoding do Open-Meteo
 * (gratuita e sem chave). O backend faz o papel de proxy e guarda as respostas
 * em memória por 24h, para não repetir chamadas iguais.
 */
@Injectable()
export class DestinosService {
  private readonly logger = new Logger(DestinosService.name);
  private readonly cache = new Map<string, { expira: number; dados: Destino[] }>();

  async buscar(termo: string): Promise<Destino[]> {
    const chave = termo.trim().toLowerCase();
    if (chave.length < 2) return [];

    const emCache = this.cache.get(chave);
    if (emCache && emCache.expira > Date.now()) return emCache.dados;

    const url = `${URL_BUSCA}?${new URLSearchParams({ name: termo.trim(), count: '8', language: 'pt', format: 'json' })}`;

    let resposta: RespostaOpenMeteo;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      resposta = (await r.json()) as RespostaOpenMeteo;
    } catch (erro) {
      this.logger.warn(`Falha ao buscar "${termo}": ${(erro as Error).message}`);
      throw new ServiceUnavailableException('Não foi possível buscar destinos agora. Tente de novo em instantes.');
    }

    const dados: Destino[] = (resposta.results ?? []).map((r) => ({
      nome: r.name,
      regiao: r.admin1 ?? null,
      pais: r.country ?? null,
      codigoPais: r.country_code ?? null,
      lat: r.latitude,
      lng: r.longitude,
    }));

    if (this.cache.size >= MAX_CACHE) {
      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(chave, { expira: Date.now() + DURACAO_CACHE_MS, dados });
    return dados;
  }
}
