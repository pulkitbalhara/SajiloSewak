// ============================================================================
// Body Condition Score (1–9) helper — spec §16. WSAVA-style assessment.
// Target for a growing puppy is a lean 4–5/9.
// ============================================================================

export interface BcsQuestion {
  id: string;
  q: string;
  // answer maps toward a score direction
  options: { label: string; weight: number }[];
}

export const BCS_QUESTIONS: BcsQuestion[] = [
  {
    id: 'ribs',
    q: 'Can you feel the ribs?',
    options: [
      { label: 'Very easily — they feel sharp/prominent', weight: 2 },
      { label: 'Easily, with a thin fat cover', weight: 4.5 },
      { label: 'With a firm press', weight: 6 },
      { label: 'Hard to feel — thick cover', weight: 8 },
    ],
  },
  {
    id: 'waist',
    q: 'Looking from above, is there a waist?',
    options: [
      { label: 'Very obvious, tucked-in waist', weight: 3 },
      { label: 'Clear waist behind the ribs', weight: 4.5 },
      { label: 'Slight waist', weight: 6 },
      { label: 'No waist / oval or round back', weight: 8 },
    ],
  },
  {
    id: 'tuck',
    q: 'From the side, is there an abdominal tuck?',
    options: [
      { label: 'Very pronounced tuck', weight: 3 },
      { label: 'Clear upward tuck', weight: 4.5 },
      { label: 'Slight tuck', weight: 6 },
      { label: 'Belly level or sagging', weight: 8 },
    ],
  },
];

export function estimateBcs(weights: number[]): { score: number; band: string; note: string } {
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const score = Math.round(avg);
  let band: string, note: string;
  if (score <= 3) { band = 'Under ideal (lean/thin)'; note = 'On the thin side. If ribs, spine and hips are very prominent, discuss with your vet.'; }
  else if (score <= 5) { band = 'Ideal (lean & healthy)'; note = 'A lean 4–5/9 is the target for a growing large-breed puppy.'; }
  else if (score <= 6) { band = 'Slightly over ideal'; note = 'Trending heavy. Trim treats/toppers and re-check food grams.'; }
  else { band = 'Over ideal'; note = 'Carrying excess weight adds strain to growing joints. Review portions with your vet.'; }
  return { score: +avg.toFixed(1) === score ? score : Math.round(avg), band, note };
}
