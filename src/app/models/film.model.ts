export interface Film {
  id: string;
  tmdbId: number;
  titolo: string;
  overview?: string;
  posterPath?: string | null;
  formato: 'uhdbd' | 'bd' | 'dvd' | 'vhs' | 'altro';
  custodia: 'standard' | 'steelbook' | 'slipcase' | 'sJewelBox' | 'cofanetto' | 'snapper' | 'altro';
  provenienza: 'collezione' | 'lista-desideri' | 'wishlist';
  generi?: string[];
  regista?: string;
  attori?: string[];
  anno: number;
}
