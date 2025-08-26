import { HttpInterceptorFn } from '@angular/common/http';

// === SCEGLI QUA IL TUO METODO DI AUTH TMDB ===
// Opzione A (più comune): API key v3 come query string
const TMDB_API_KEY_V3 = 'deebc21b32b0927766f6ec8dc6fa4b72';

// Opzione B (alternativa): Token v4 Bearer (se usi v4)
// const TMDB_BEARER_V4 = 'INSERISCI_IL_TUO_TOKEN_V4';

export const tmdbInterceptorFn: HttpInterceptorFn = (req, next) => {
  // intercetta SOLO le chiamate a TMDB
  const isTmdb = req.url.includes('api.themoviedb.org');
  if (!isTmdb) return next(req);

  // A) API key v3 come query param
  if (TMDB_API_KEY_V3 && TMDB_API_KEY_V3 !== 'deebc21b32b0927766f6ec8dc6fa4b72') {
    const params = req.params.set('api_key', TMDB_API_KEY_V3);
    return next(req.clone({ params }));
  }

  // B) In alternativa, usare Bearer v4 in header
  // if (TMDB_BEARER_V4 && TMDB_BEARER_V4 !== 'INSERISCI_IL_TUO_TOKEN_V4') {
  //   return next(req.clone({ setHeaders: { Authorization: `Bearer ${TMDB_BEARER_V4}` } }));
  // }

  // fallback senza credenziali (non funzionerà con TMDB)
  return next(req);
};
