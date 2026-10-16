import { Parada, Viagem } from '@prisma/client';
import { paraIso } from '../common/datas';

export type ViagemComParadas = Viagem & { paradas: Parada[] };

/** Include padrão para trazer as paradas em ordem */
export const COM_PARADAS = { paradas: { orderBy: { ordem: 'asc' as const } } };

/** Viagem sem destino ou sem datas ainda precisa passar pelo onboarding */
export function viagemConfigurada(v: ViagemComParadas) {
  return v.paradas.length > 0 && Boolean(v.dataIda && v.dataVolta);
}

/** NACIONAL se todas as paradas são no Brasil; null se ainda não há paradas */
export function tipoDaViagem(v: ViagemComParadas): 'NACIONAL' | 'INTERNACIONAL' | null {
  if (v.paradas.length === 0) return null;
  return v.paradas.every((p) => p.codigoPais?.toUpperCase() === 'BR') ? 'NACIONAL' : 'INTERNACIONAL';
}

export function formatarParada(p: Parada) {
  return {
    id: p.id,
    ordem: p.ordem,
    nome: p.nome,
    regiao: p.regiao,
    pais: p.pais,
    codigoPais: p.codigoPais,
    lat: p.lat,
    lng: p.lng,
    chegada: p.chegada ? paraIso(p.chegada) : null,
    saida: p.saida ? paraIso(p.saida) : null,
  };
}

/** Formato público de uma viagem (datas como "AAAA-MM-DD") */
export function resumirViagem(v: ViagemComParadas) {
  return {
    id: v.id,
    nome: v.nome,
    paradas: v.paradas.map(formatarParada),
    tipo: tipoDaViagem(v),
    origem:
      v.origemNome && v.origemLat !== null && v.origemLng !== null
        ? { nome: v.origemNome, lat: v.origemLat, lng: v.origemLng }
        : null,
    dataIda: v.dataIda ? paraIso(v.dataIda) : null,
    dataVolta: v.dataVolta ? paraIso(v.dataVolta) : null,
    metaCentavos: v.metaCentavos,
    transporte: v.transporte,
    estimativa: v.estimativa,
    configurada: viagemConfigurada(v),
  };
}
