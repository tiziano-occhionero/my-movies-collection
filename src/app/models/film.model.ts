export interface Film {
  id: string;
  tmdbId: number | null;
  titolo: string;
  overview?: string;
  posterPath?: string | null;
  posterUrl?: string;
  formato: 'uhdbd' | 'bd' | 'dvd' | 'vhs' | 'altro';
  custodia: 'standard' | 'steelbook' | 'slipcase' | 'sJewelBox' | 'cofanetto' | 'snapper' | 'altro';
  provenienza: 'collezione' | 'lista-desideri' | 'wishlist';
  generi?: string[];
  regista?: string;
  attori?: string[];
  anno: number;
  numeroDischi?: number;
  note?: string;
  dataInserimento?: string;

  // Proprietà per dettagli caricati da TMDB
  dettagliCaricati?: boolean;
  genre_names?: string[];
}
