export type MigraineRow = {
  date: string;
  lumiere: boolean;
  son: boolean;
  pression: boolean;
  temperature: boolean;
  odeur: boolean;
  stress: boolean;
  alcool: boolean;
  saitPas: boolean;
  vision: boolean;
  odorat: boolean;
  nausee: boolean;
  vomissements: boolean;
  douleurOs: boolean;
  ouie: boolean;
  faiblesseMusc: boolean;
  brainFog: boolean;
  /** Durée en minutes (comme dans le tableur). */
  dureeMinutes: number | null;
  medicaments: string;
  intensiteMigr: number;
  intensiteOs: number;
};
