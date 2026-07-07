// M6 rotating daily well-being item bank (§6.3) + biweekly screen scaffolding.
//
// ⚠️ These daily items are ADAPTED from postpartum-screening constructs and are
// NOT diagnostic. The biweekly full screen (§6.6) must use a VALIDATED Arabic
// EPDS translation with attribution — do not ship a homemade full scale. This
// file only defines the daily one-item rotation and the response scoring.

// reverse: higher "often" = better (so we invert for a distress score).
export const CHECKIN_BANK = [
  { id: "C1", reverse: false, en: "I blamed myself unnecessarily when things went wrong", ar: "لمتُ نفسي دون داعٍ عندما ساءت الأمور" },
  { id: "C2", reverse: false, en: "I felt anxious or worried for no clear reason", ar: "شعرتُ بالقلق أو التوتر دون سبب واضح" },
  { id: "C3", reverse: false, en: "I felt scared or panicky without good reason", ar: "شعرتُ بالخوف أو الذعر دون سبب وجيه" },
  { id: "C4", reverse: true, en: "I was able to laugh and see the funny side of things", ar: "استطعتُ أن أضحك وأرى الجانب المرح من الأمور" },
  { id: "C5", reverse: false, en: "I felt overwhelmed by everything I had to do", ar: "شعرتُ أن الأمور أكبر من طاقتي" },
  { id: "C6", reverse: true, en: "I looked forward to things with enjoyment", ar: "تطلعتُ إلى الأشياء بشعور من المتعة" },
];

// Response chips → 0/1/2 (never/sometimes/often).
export const CHECKIN_RESPONSES = [
  { value: 0, en: "Never", ar: "أبداً" },
  { value: 1, en: "Sometimes", ar: "أحياناً" },
  { value: 2, en: "Often", ar: "غالباً" },
];

// Deterministic day-of-year rotation so the item is stable within a day but
// cycles across days.
export function checkinForDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - start) / 86400000);
  return CHECKIN_BANK[doy % CHECKIN_BANK.length];
}

export function getCheckinById(id) {
  return CHECKIN_BANK.find((c) => c.id === id) || null;
}

// Distress score for one response: reverse items invert (often-enjoyment = low
// distress). Returns 0 (low) … 2 (high). Feeds T2a's "high-frequency negative".
export function checkinDistress(itemId, responseValue) {
  const item = getCheckinById(itemId);
  if (!item || responseValue == null) return null;
  return item.reverse ? 2 - responseValue : responseValue;
}
