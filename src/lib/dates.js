// Age + postpartum math. Pure functions, no side effects, no DOM.
// Everything the spec keys off (staging, corrected age, نفاس framing,
// safety windows) flows from these.

const MS_DAY = 86400000;

export function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / MS_DAY);
}

// Chronological age in whole weeks.
export function ageWeeks(dob, asOf = new Date()) {
  const d = toDate(dob);
  if (!d) return null;
  return Math.max(0, Math.floor(daysBetween(d, toDate(asOf)) / 7));
}

export function ageDays(dob, asOf = new Date()) {
  const d = toDate(dob);
  if (!d) return null;
  return Math.max(0, daysBetween(d, toDate(asOf)));
}

// Corrected age for preterm babies: subtract weeks of prematurity from
// chronological age. Correction convention stops mattering after ~2y; we
// only apply it while the difference is clinically meaningful.
export function correctedAgeWeeks(dob, gestationalAgeWeeks, asOf = new Date()) {
  const chrono = ageWeeks(dob, asOf);
  if (chrono == null) return null;
  const ga = Number(gestationalAgeWeeks);
  if (!ga || ga >= 40) return chrono; // term (or unknown) → no correction
  const prematurity = 40 - ga;
  return Math.max(0, chrono - prematurity);
}

export function isPreterm(gestationalAgeWeeks) {
  const ga = Number(gestationalAgeWeeks);
  return !!ga && ga < 37;
}

// Whole weeks since delivery. Drives postpartum recovery fields + نفاس copy.
export function postpartumWeek(deliveryDate, asOf = new Date()) {
  const d = toDate(deliveryDate);
  if (!d) return null;
  return Math.max(0, Math.floor(daysBetween(d, toDate(asOf)) / 7));
}

export function postpartumDays(deliveryDate, asOf = new Date()) {
  const d = toDate(deliveryDate);
  if (!d) return null;
  return Math.max(0, daysBetween(d, toDate(asOf)));
}

// Still inside the نفاس / 40-day window.
export function inNifas(deliveryDate, asOf = new Date()) {
  const days = postpartumDays(deliveryDate, asOf);
  return days != null && days <= 40;
}

// Adaptive-question stage (§6.5). Uses corrected age when preterm.
export function stageForAge(dob, gestationalAgeWeeks, asOf = new Date()) {
  const w = correctedAgeWeeks(dob, gestationalAgeWeeks, asOf);
  if (w == null) return null;
  if (w <= 6) return "A";
  if (w < 17) return "B"; // 6wk–4mo
  if (w < 26) return "C"; // 4–6mo
  if (w < 52) return "D"; // 6–12mo
  return "E"; // 12mo+
}

// Human label for context/prompt.
export function ageLabel(dob, gestationalAgeWeeks, lang = "en", asOf = new Date()) {
  const w = correctedAgeWeeks(dob, gestationalAgeWeeks, asOf);
  if (w == null) return lang === "ar" ? "غير محدد" : "not specified";
  const corrected = isPreterm(gestationalAgeWeeks);
  const mo = Math.floor(w / 4.345);
  if (lang === "ar") {
    const base = w < 8 ? `${w} أسبوع` : `${mo} أشهر`;
    return corrected ? `${base} (عمر مصحّح)` : base;
  }
  const base = w < 8 ? `${w} weeks` : `${mo} months`;
  return corrected ? `${base} (corrected)` : base;
}

// Local YYYY-MM-DD key for a day (log grain is daily per §7).
export function dayKey(d = new Date()) {
  const dt = toDate(d) || new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
