// Plural/inflection mapping for common cooking ingredients in EN and DE.
// Maps plurals and variants to a canonical singular form.
const pluralMap: Record<string, string> = {
  // English
  eggs: 'egg',
  tomatoes: 'tomato',
  potatoes: 'potato',
  carrots: 'carrot',
  onions: 'onion',
  peppers: 'pepper',
  mushrooms: 'mushroom',
  cloves: 'clove',
  lemons: 'lemon',
  limes: 'lime',
  oranges: 'orange',
  apples: 'apple',
  bananas: 'banana',
  berries: 'berry',
  strawberries: 'strawberry',
  blueberries: 'blueberry',
  raspberries: 'raspberry',
  cherries: 'cherry',
  peaches: 'peach',
  avocados: 'avocado',
  zucchinis: 'zucchini',
  cucumbers: 'cucumber',
  beans: 'bean',
  peas: 'pea',
  lentils: 'lentil',
  chickpeas: 'chickpea',
  shallots: 'shallot',
  garlic: 'garlic',
  herbs: 'herb',
  noodles: 'noodle',
  tortillas: 'tortilla',
  breasts: 'breast',
  thighs: 'thigh',
  drumsticks: 'drumstick',
  wings: 'wing',
  steaks: 'steak',
  chops: 'chop',
  sausages: 'sausage',
  shrimps: 'shrimp',
  prawns: 'prawn',
  anchovies: 'anchovy',
  sardines: 'sardine',
  olives: 'olive',
  capers: 'caper',
  artichokes: 'artichoke',
  asparagus: 'asparagus',
  broccoli: 'broccoli',
  spinach: 'spinach',

  // German
  eier: 'ei',
  tomaten: 'tomate',
  kartoffeln: 'kartoffel',
  karotten: 'karotte',
  moehren: 'moehre',
  zwiebeln: 'zwiebel',
  paprika: 'paprika',
  pilze: 'pilz',
  champignons: 'champignon',
  zitronen: 'zitrone',
  limetten: 'limette',
  orangen: 'orange',
  aepfel: 'apfel',
  bananen: 'banane',
  erdbeeren: 'erdbeere',
  heidelbeeren: 'heidelbeere',
  himbeeren: 'himbeere',
  kirschen: 'kirsche',
  pfirsiche: 'pfirsich',
  zucchini: 'zucchini',
  gurken: 'gurke',
  bohnen: 'bohne',
  erbsen: 'erbse',
  linsen: 'linse',
  kichererbsen: 'kichererbse',
  schalotten: 'schalotte',
  knoblauch: 'knoblauch',
  nudeln: 'nudel',
  wuerstchen: 'wuerstchen',
  garnelen: 'garnele',
  sardinen: 'sardine',
  oliven: 'olive',
  kapern: 'kaper',
  artischocken: 'artischocke',
  spargel: 'spargel',
  brokkoli: 'brokkoli',
  spinat: 'spinat',
};

export function normalizeIngredient(ingredient: string): string {
  const lower = ingredient.trim().toLowerCase();
  return pluralMap[lower] ?? lower;
}

export function normalizeIngredients(ingredients: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ing of ingredients) {
    const normalized = normalizeIngredient(ing);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result.sort();
}
