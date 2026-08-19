// ============================================================================
// Sources & assumptions — spec §32. We reference real, well-known veterinary
// nutrition authorities. We do NOT fabricate specific citations, page numbers
// or DOIs; entries describe the *basis* of a recommendation in the app.
// ============================================================================

export interface Source {
  key: string;
  org: string;
  summary: string;
}

export const SOURCES: Record<string, Source> = {
  merckEnergy: {
    key: 'merckEnergy',
    org: 'Merck Veterinary Manual',
    summary:
      'Provides starting-point daily energy factors as multiples of Resting Energy Requirement (RER). Healthy puppies under ~4 months are commonly estimated near 3× RER, tapering toward ~2× RER as they approach adult size. These are starting estimates only and must be adjusted to the individual by weight trend and body condition.',
  },
  merckMonitoring: {
    key: 'merckMonitoring',
    org: 'Merck Veterinary Manual',
    summary:
      'Recommends regular (ideally weekly) monitoring of weight gain in growing large-breed puppies, adjusting feeding so the puppy grows steadily rather than rapidly. Notes supplementation beyond a complete growth diet is rarely necessary and may be contraindicated.',
  },
  aahaLargeBreed: {
    key: 'aahaLargeBreed',
    org: 'AAHA (American Animal Hospital Association)',
    summary:
      'Life-stage guidelines emphasise that large/giant-breed puppies need a growth diet supporting appropriate skeletal development, maintaining a lean body condition, avoiding excess calcium and overfeeding. Life stage depends on age, size, breed and development — not age alone.',
  },
  aahaFeeding: {
    key: 'aahaFeeding',
    org: 'AAHA (American Animal Hospital Association)',
    summary:
      'Recommends measured meal feeding rather than free-choice feeding, with ongoing monitoring of growth and body-condition score.',
  },
  wsavaBcs: {
    key: 'wsavaBcs',
    org: 'WSAVA (World Small Animal Veterinary Association)',
    summary:
      'Provides body-condition score (1–9) and muscle-condition assessment tools as part of a standardised nutritional assessment. A BCS of 4–5/9 reflects an ideal lean condition for a growing puppy.',
  },
  aafco: {
    key: 'aafco',
    org: 'AAFCO nutrient profiles',
    summary:
      'Defines nutrient profiles a diet must meet to be labelled "complete and balanced" for a life stage (e.g. "growth" or "all life stages including growth of large-size dogs"). Meeting calorie needs does not imply meeting these nutrient profiles.',
  },
  fediaf: {
    key: 'fediaf',
    org: 'FEDIAF (European pet food nutrition guidelines)',
    summary:
      'European equivalent of AAFCO nutrient recommendations, including specific calcium ranges and calcium:phosphorus ratios for large-breed puppy growth.',
  },
  rerFormula: {
    key: 'rerFormula',
    org: 'Veterinary nutrition — RER',
    summary:
      'Resting Energy Requirement is estimated as RER = 70 × (body weight in kg)^0.75. Daily energy is then estimated by multiplying RER by a life-stage factor.',
  },
  treatGuidance: {
    key: 'treatGuidance',
    org: 'Veterinary nutrition — the 10% rule',
    summary:
      'Treats and toppers should generally provide no more than ~10% of daily calories so the complete-and-balanced diet is not diluted below adequacy.',
  },
  manufacturer: {
    key: 'manufacturer',
    org: 'Manufacturer feeding guide',
    summary:
      'Pet-food labels list calorie density (kcal/kg) and feeding amounts. The label value is the most reliable input for calculating daily grams.',
  },
  positiveTraining: {
    key: 'positiveTraining',
    org: 'AVSAB (American Veterinary Society of Animal Behavior)',
    summary:
      'Position statements support reward-based (positive-reinforcement) training and advise against aversive, fear- or pain-based methods, which can worsen behaviour and welfare.',
  },
};

export function sourceLine(key: string): string {
  const s = SOURCES[key];
  return s ? s.org : '';
}
