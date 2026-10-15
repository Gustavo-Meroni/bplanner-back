import { Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * Busca JSON de uma API pública com timeout e cache em memória.
 * Todas as integrações do onboarding passam por aqui: se uma API cair,
 * o erro é claro e as outras continuam funcionando.
 */
export class FonteExterna {
  private readonly logger: Logger;
  private readonly cache = new Map<string, { expira: number; dados: unknown }>();

  constructor(
    private readonly nome: string,
    private readonly duracaoCacheMs: number,
    private readonly maxItens = 500,
  ) {
    this.logger = new Logger(`Fonte:${nome}`);
  }

  async buscar<T>(url: string, opcoes: { aceitar404?: boolean } = {}): Promise<T | null> {
    const emCache = this.cache.get(url);
    if (emCache && emCache.expira > Date.now()) return emCache.dados as T;

    let dados: T | null;
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
      if ((resposta.status === 404 || resposta.status === 204) && opcoes.aceitar404) {
        dados = null;
      } else if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      } else {
        dados = (await resposta.json()) as T;
      }
    } catch (erro) {
      this.logger.warn(`Falha em ${url}: ${(erro as Error).message}`);
      throw new ServiceUnavailableException(`Não foi possível consultar ${this.nome} agora. Tente de novo em instantes.`);
    }

    if (this.cache.size >= this.maxItens) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(url, { expira: Date.now() + this.duracaoCacheMs, dados });
    return dados;
  }
}
