// Triage: classification, scoring, sorting.

export const CAT = { urgent: ['Urgent', 100], scheduling: ['Scheduling', 70], existing: ['Existing client', 50], enquiry: ['New enquiry', 30], other: ['Other', 10] };
export const PRI = { high: 90, normal: 50, low: 5 };

export function classify(S, sid, text) {
  const s = S.students.find((x) => x.id === sid);
  if (/reschedul|cancel|move (my|the)|change (my|the) (lesson|meeting|session|appointment|call)|time slot|postpone/i.test(text)) return 'scheduling';
  if (!s) return 'other';
  if (s.isNew || /trial|new (client|project)|interested in|your rates|quote|pricing|price/i.test(text)) return 'enquiry';
  return 'existing';
}

export const tier = (m) => (m.urgent ? 'urgent' : m.cat);
export function score(m) { const base = m.pri && m.pri !== 'auto' ? PRI[m.pri] : CAT[tier(m)][1]; return base + Math.min(9, (Date.now() - m.at) / 72e5); }
export const openMsgs = (S) => S.messages.filter((m) => ['queued', 'awaiting'].includes(m.status));
export const byTriage = (a) => [...a].sort((x, y) => score(y) - score(x));
