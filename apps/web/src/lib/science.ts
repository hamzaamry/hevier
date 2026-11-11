export interface Source {
  id: string;
  cite: string;
  journal: string;
  pmid: string;
  note: string;
}

const pubmed = (pmid: string): string => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

export const sourceUrl = (source: Source): string => pubmed(source.pmid);

export const SOURCES: Source[] = [
  {
    id: 'robinson',
    cite: 'Robinson et al. 2024',
    journal: 'Sports Med',
    pmid: '38970765',
    note: 'Growth rises as sets end closer to failure.',
  },
  {
    id: 'pelland',
    cite: 'Pelland et al. 2026',
    journal: 'Sports Med (preprint 2024)',
    pmid: '41343037',
    note: 'Helper muscles count half a set. 4 sets a week is the smallest dose that grew muscle.',
  },
  {
    id: 'bickel',
    cite: 'Bickel et al. 2011',
    journal: 'Med Sci Sports Exerc',
    pmid: '21131862',
    note: 'In young adults, 3 quad sets a week kept muscle size for 32 weeks.',
  },
  {
    id: 'moran',
    cite: 'Morán-Navarro et al. 2017',
    journal: 'Eur J Appl Physiol',
    pmid: '28965198',
    note: 'Sets to failure took 24 to 48 h longer to recover from.',
  },
  {
    id: 'pareja',
    cite: 'Pareja-Blanco et al. 2017',
    journal: 'Clin Physiol Funct Imaging',
    pmid: '26970332',
    note: 'Jump height stayed down for up to 48 h after sets to failure.',
  },
  {
    id: 'belcher',
    cite: 'Belcher et al. 2019',
    journal: 'Appl Physiol Nutr Metab',
    pmid: '30779596',
    note: 'Squat speed still 8.6% down after 72 h following 4 sets to failure.',
  },
  {
    id: 'goulart',
    cite: 'Goulart et al. 2021',
    journal: 'Eur J Sport Sci',
    pmid: '32594858',
    note: 'After 10 sets to failure, at least 48 h to recover.',
  },
  {
    id: 'mangine',
    cite: 'Mangine et al. 2022',
    journal: 'J Strength Cond Res',
    pmid: '34941608',
    note: 'Counter-evidence: no difference at 24 to 72 h between sets to failure and sets stopped 3 reps short.',
  },
];

export const sourceById = (id: string): Source => {
  const found = SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`unknown source ${id}`);
  return found;
};
