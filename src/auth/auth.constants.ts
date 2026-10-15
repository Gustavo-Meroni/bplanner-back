export const JWT_SECRET = process.env.JWT_SECRET || 'bplanner-chave-secreta-em-desenvolvimento';

/** Mesmo prazo do cookie do front (7 dias), para a sessão não "morrer" pela metade */
export const JWT_EXPIRES_IN = '7d';
