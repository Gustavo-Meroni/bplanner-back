import { Transform } from 'class-transformer';

/** Remove espaços e coloca em minúsculas antes de validar (ex.: email colado com espaço) */
export const NormalizarEmail = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
