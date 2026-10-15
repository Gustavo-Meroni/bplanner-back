import { Viagem } from '@prisma/client';
import { paraIso } from '../common/datas';

/** Viagem sem destino ou sem datas ainda precisa passar pelo onboarding */
export function viagemConfigurada(v: Viagem) {
  return Boolean(v.destinoNome && v.destinoLat !== null && v.destinoLng !== null && v.dataIda && v.dataVolta);
}

/** Formato público de uma viagem (datas como "AAAA-MM-DD") */
export function resumirViagem(v: Viagem) {
  return {
    id: v.id,
    nome: v.nome,
    destino:
      v.destinoNome && v.destinoLat !== null && v.destinoLng !== null
        ? {
            nome: v.destinoNome,
            regiao: v.destinoRegiao,
            pais: v.destinoPais,
            codigoPais: v.destinoCodigoPais,
            lat: v.destinoLat,
            lng: v.destinoLng,
          }
        : null,
    origem:
      v.origemNome && v.origemLat !== null && v.origemLng !== null
        ? { nome: v.origemNome, lat: v.origemLat, lng: v.origemLng }
        : null,
    dataIda: v.dataIda ? paraIso(v.dataIda) : null,
    dataVolta: v.dataVolta ? paraIso(v.dataVolta) : null,
    metaCentavos: v.metaCentavos,
    estimativa: v.estimativa,
    configurada: viagemConfigurada(v),
  };
}
