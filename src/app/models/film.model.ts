export interface Film {
  id: string;
  tmdbId: number;
  titolo: string;
  overview?: string;
  posterPath?: string;
  formato: 'uhdbd' | 'bd' | 'dvd' | 'vhs' | 'altro';
  custodia: 'standard' | 'steelbook' | 'slipcase' | 'sJewelBox' | 'cofanetto' | 'snapper' | 'altro';
  provenienza: 'collezione' | 'lista-desideri';
  generi?: string[];
  regista?: string;
  attori?: string[];
  anno: number;
}
