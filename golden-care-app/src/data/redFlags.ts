// ============================================================================
// Red-flag / "Should I call the vet?" system — spec §26.
// Educational triage ONLY. This never diagnoses a disease.
// ============================================================================

export type Triage = 'emergency' | 'prompt' | 'monitor';

export interface RedFlag {
  id: string;
  symptom: string;
  triage: Triage;
  note: string;
}

export const RED_FLAGS: RedFlag[] = [
  { id: 'collapse', symptom: 'Collapse or unable to stand', triage: 'emergency',
    note: 'Seek emergency veterinary care immediately.' },
  { id: 'breathing', symptom: 'Difficulty breathing / choking', triage: 'emergency',
    note: 'Emergency. Go to the nearest vet now.' },
  { id: 'seizure', symptom: 'Seizure / fitting', triage: 'emergency',
    note: 'Keep them safe from injury and contact an emergency vet.' },
  { id: 'bloat', symptom: 'Swollen, hard, distended belly', triage: 'emergency',
    note: 'A distended abdomen (especially with retching) can be a life-threatening emergency — go now.' },
  { id: 'no-urine', symptom: 'Straining but unable to urinate', triage: 'emergency',
    note: 'Inability to pass urine is an emergency.' },
  { id: 'toxin', symptom: 'Ate something toxic (grapes, onion, chocolate, xylitol…)', triage: 'emergency',
    note: 'Call a vet or poison line right away with the item and amount. Do not wait for symptoms.' },
  { id: 'severe-pain', symptom: 'Sudden severe pain / crying out', triage: 'emergency',
    note: 'Seek urgent veterinary assessment.' },

  { id: 'repeat-vomit', symptom: 'Repeated vomiting', triage: 'prompt',
    note: 'More than a couple of times, or with lethargy — contact your vet promptly, especially in a young puppy.' },
  { id: 'diarrhea', symptom: 'Persistent diarrhea', triage: 'prompt',
    note: 'Puppies dehydrate quickly. If it persists beyond a day or is severe, contact your vet.' },
  { id: 'blood-stool', symptom: 'Blood in stool or vomit', triage: 'prompt',
    note: 'Contact your vet promptly.' },
  { id: 'lethargy', symptom: 'Severe lethargy / very weak', triage: 'prompt',
    note: 'A markedly flat, unresponsive puppy needs prompt veterinary attention.' },
  { id: 'no-eat', symptom: 'Repeated refusal to eat', triage: 'prompt',
    note: 'A puppy skipping multiple meals can drop blood sugar. Contact your vet.' },
  { id: 'drink-change', symptom: 'Marked change in drinking or urination', triage: 'prompt',
    note: 'Sudden big changes are worth a prompt call.' },

  { id: 'mild-off', symptom: 'Slightly off / one soft stool, still bright & eating', triage: 'monitor',
    note: 'Watch closely, keep to plain food, ensure water. If it worsens or continues, call your vet.' },
  { id: 'itch', symptom: 'Occasional scratching', triage: 'monitor',
    note: 'Monitor for hair loss, redness or worsening; mention at the next vet visit.' },
];

export const TRIAGE_META: Record<Triage, { label: string; className: string; ring: string }> = {
  emergency: { label: 'Emergency — go now', className: 'bg-red-100 text-red-700 border-red-200', ring: 'text-red-500' },
  prompt: { label: 'Contact vet promptly', className: 'bg-orange-100 text-orange-700 border-orange-200', ring: 'text-orange-500' },
  monitor: { label: 'Monitor at home', className: 'bg-gold-100 text-gold-700 border-gold-200', ring: 'text-gold-500' },
};
