import { PermutationResult } from '../types/osint';

export function generateEmailPermutations(firstName: string, lastName: string, domain: string): PermutationResult[] {
  const f = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const l = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const d = domain.trim().toLowerCase().replace(/^@+/, '');

  if (!f || !d) return [];

  const fi = f.charAt(0);
  const li = l ? l.charAt(0) : '';

  const patterns: Array<{ format: string; label: string }> = [
    { format: `${f}@${d}`, label: 'first' },
    { format: `${f}.${l}@${d}`, label: 'first.last' },
    { format: `${fi}${l}@${d}`, label: 'f.initial + last' },
    { format: `${f}${li}@${d}`, label: 'first + l.initial' },
    { format: `${fi}.${l}@${d}`, label: 'f.initial.last' },
    { format: `${f}_${l}@${d}`, label: 'first_last' },
    { format: `${f}-${l}@${d}`, label: 'first-last' },
    { format: `${l}.${f}@${d}`, label: 'last.first' },
    { format: `${l}${fi}@${d}`, label: 'last + f.initial' },
    { format: `${li}${f}@${d}`, label: 'l.initial + first' },
    { format: `${f}${l}@${d}`, label: 'firstlast' },
    { format: `${l}@${d}`, label: 'last' },
    { format: `${fi}@${d}`, label: 'f.initial' },
    { format: `${fi}_${l}@${d}`, label: 'f.initial_last' },
    { format: `${f}.${li}@${d}`, label: 'first.l.initial' },
    { format: `${l}_${f}@${d}`, label: 'last_first' },
    { format: `${l}-${f}@${d}`, label: 'last-first' },
  ];

  // If no last name, filter out ones needing 'l'
  const valid = l ? patterns : patterns.filter((p) => !p.label.includes('last') && !p.label.includes('l.'));

  return valid.map((item) => ({
    email: item.format,
    pattern: item.label,
    domain: d,
    status: 'unchecked',
  }));
}
