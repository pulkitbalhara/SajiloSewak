import type { TrainingSkill } from '@/types';

// ============================================================================
// Training curriculum — spec §19. Positive-reinforcement only (§19 forbids
// aversive methods; basis: AVSAB). minWeeks gates what the coach introduces.
// ============================================================================

export const TRAINING_SKILLS: TrainingSkill[] = [
  // Foundation
  { id: 'name', name: 'Name / attention', category: 'foundation', minWeeks: 8,
    description: 'Puppy looks at you when you say their name.',
    method: 'Say the name once; the instant they look, mark ("yes!") and reward. Never repeat or scold.' },
  { id: 'eye', name: 'Eye contact', category: 'foundation', minWeeks: 8,
    description: 'Voluntary check-ins and focus.',
    method: 'Reward any offered eye contact. Builds engagement before any other cue.' },
  { id: 'sit', name: 'Sit', category: 'foundation', minWeeks: 8,
    description: 'Sit on cue.',
    method: 'Lure the nose up and back with a treat; mark as the bottom touches down. Add the word once reliable.' },
  { id: 'down', name: 'Down', category: 'foundation', minWeeks: 9,
    description: 'Lie down on cue.',
    method: 'From sit, lure the treat to the floor between the paws; reward the elbows touching down.' },
  { id: 'come', name: 'Come / recall', category: 'foundation', minWeeks: 8,
    description: 'Comes running when called.',
    method: 'Happy voice, run backwards, huge reward every time. Never call to punish. Keep it the best game ever.' },
  { id: 'wait', name: 'Wait', category: 'foundation', minWeeks: 10,
    description: 'Pauses briefly (at doors, bowls).',
    method: 'Ask for a short pause before releasing to the reward; build duration by 1 second at a time.' },
  { id: 'leave', name: 'Leave it', category: 'foundation', minWeeks: 10,
    description: 'Ignores a tempting item on cue.',
    method: 'Reward turning away from a covered treat; trade up so leaving pays better than taking.' },
  { id: 'drop', name: 'Drop it', category: 'foundation', minWeeks: 10,
    description: 'Releases an object from the mouth.',
    method: 'Offer a tasty trade for whatever they hold; make giving up items always rewarding.' },

  // Household manners
  { id: 'no-jump', name: 'Four paws (no jumping)', category: 'manners', minWeeks: 9,
    description: 'Greets without jumping up.',
    method: 'Reward all four paws on the floor; ignore/turn away from jumping. Everyone must be consistent.' },
  { id: 'no-counter', name: 'Off counters', category: 'manners', minWeeks: 12,
    description: 'Stays off kitchen counters/tables.',
    method: 'Manage the environment (no food left out) and reward keeping paws on the floor.' },
  { id: 'no-grab', name: 'Gentle taking / no food grabbing', category: 'manners', minWeeks: 9,
    description: 'Takes food softly, waits for release.',
    method: 'Only open your hand when the mouth is soft; reward calm waiting near food.' },
  { id: 'handling', name: 'Gentle handling', category: 'manners', minWeeks: 8,
    description: 'Accepts paws, ears, mouth being touched.',
    method: 'Pair brief touches with treats. Foundation for grooming and vet visits.' },

  // Puppy behaviour
  { id: 'bite-inhib', name: 'Bite inhibition', category: 'behaviour', minWeeks: 8,
    description: 'Learns to soften the mouth with people.',
    method: 'Redirect the mouth to a toy; if teeth touch skin, calmly end the game for a moment. Never smack the muzzle.' },
  { id: 'chew', name: 'Appropriate chewing', category: 'behaviour', minWeeks: 8,
    description: 'Chews toys, not furniture/hands.',
    method: 'Always have an approved chew handy; reward choosing it. Manage teething with safe cold chews.' },
  { id: 'settle', name: 'Settle / calmness', category: 'behaviour', minWeeks: 8,
    description: 'Relaxes on a mat on cue.',
    method: 'Reward lying calmly on a mat; slowly grow the duration. Calmness is a trained skill, not just tiredness.' },
  { id: 'crate', name: 'Crate / rest area', category: 'behaviour', minWeeks: 8,
    description: 'Rests happily in a crate or pen.',
    method: 'Feed and give chews in the crate; keep it positive. A rested puppy bites and barks far less.' },

  // Socialization (spec §19)
  { id: 'soc-people', name: 'People', category: 'socialization', minWeeks: 8,
    description: 'Calm, positive greetings with different people.',
    method: 'Let the puppy approach at their own pace; pair new people with treats. Never force interactions.' },
  { id: 'soc-sounds', name: 'Sounds', category: 'socialization', minWeeks: 8,
    description: 'Comfortable with household & street sounds.',
    method: 'Play sounds quietly, pair with food, increase gradually (pressure cooker, doorbell, traffic).' },
  { id: 'soc-vehicles', name: 'Vehicles & traffic', category: 'socialization', minWeeks: 9,
    description: 'Calm around cars, bikes, autos.',
    method: 'Watch from a safe distance, reward calm observation, move closer over days.' },
  { id: 'soc-surfaces', name: 'Surfaces', category: 'socialization', minWeeks: 8,
    description: 'Confident on grass, tiles, metal, stairs.',
    method: 'Reward exploring new textures; keep it low and safe.' },
  { id: 'soc-grooming', name: 'Grooming', category: 'socialization', minWeeks: 8,
    description: 'Accepts brushing, nail handling, baths.',
    method: 'Short sessions paired with treats; stop before they get worried.' },
  { id: 'soc-vet', name: 'Vet handling', category: 'socialization', minWeeks: 8,
    description: 'Comfortable being examined.',
    method: 'Practise "vet" touches (paws, ears, standing still) at home with rewards.' },
  { id: 'soc-env', name: 'New environments', category: 'socialization', minWeeks: 9,
    description: 'Confident in new places (once vaccination allows).',
    method: 'Short, positive outings after your vet clears it; let the puppy set the pace.' },
];

export function skillsForAge(weeks: number): TrainingSkill[] {
  return TRAINING_SKILLS.filter((s) => weeks >= s.minWeeks);
}
