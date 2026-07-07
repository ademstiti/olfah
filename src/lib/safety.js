// Deterministic safety & escalation engine (§6.9 — LAUNCH BLOCKER).
//
// This layer is intentionally NOT the LLM. Every trigger is a hardcoded rule
// evaluated in code so behavior is testable and cannot be talked out of by the
// model. The chat model's own judgment is a *second* net, never the only one.
//
// T1 self-harm detection here is a deterministic lexical classifier: high
// recall, deliberately liberal. It is designed to run alongside (and be
// backstopped by) an async model classifier (§6.4) — a missed keyword must
// never be the only thing standing between a mother and help. Tune with care;
// prefer false positives over false negatives for this trigger.

import { ageDays, postpartumWeek } from "./dates.js";
import { getTemplate, SEVERITY_RANK } from "./safetyTemplates.js";

// ── T1: self-harm / suicidal ideation lexicon ──────────────────────────────
// Phrases, not bare words, to cut false positives ("kill time", "dying to
// sleep"). Matched case-insensitively as substrings on normalized text.
const SELF_HARM_EN = [
  "kill myself", "killing myself", "end my life", "ending my life",
  "want to die", "wanna die", "better off dead", "better off without me",
  "don't want to be here", "dont want to be here", "no reason to live",
  "can't go on", "cant go on", "hurt myself", "harm myself", "harming myself",
  "take my own life", "end it all", "not worth living", "disappear forever",
  "everyone would be better without me", "baby would be better without me",
  "want to hurt my baby", "hurt the baby", "harm my baby",
];
const SELF_HARM_AR = [
  "أبي أموت", "ابي اموت", "أريد أن أموت", "اريد ان اموت", "ودي أموت", "ودي اموت",
  "أقتل نفسي", "اقتل نفسي", "أنهي حياتي", "انهي حياتي", "أؤذي نفسي", "اؤذي نفسي",
  "ما لي خلق العيش", "ما أبي أعيش", "ما ابي اعيش", "أفضل لو ما كنت موجودة",
  "الكل أحسن بدوني", "أطفالي أحسن بدوني", "طفلي أحسن بدوني", "ما في فايدة من حياتي",
  "أبي أختفي", "ابي اختفي", "تعبت من الحياة", "أبي أأذي طفلي", "ابي اذي طفلي",
];

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    // strip Arabic diacritics + tatweel so matches are robust
    .replace(/[ً-ْـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Returns { flag: boolean, matched: string|null }.
export function classifySelfHarm(text, lang) {
  const norm = normalize(text);
  if (!norm) return { flag: false, matched: null };
  const lists = lang === "ar" ? [SELF_HARM_AR] : lang === "en" ? [SELF_HARM_EN] : [SELF_HARM_EN, SELF_HARM_AR];
  for (const list of lists) {
    for (const phrase of list) {
      if (norm.includes(normalize(phrase))) return { flag: true, matched: phrase };
    }
  }
  return { flag: false, matched: null };
}

function esc(triggerId, lang, extra = {}) {
  const tpl = getTemplate(triggerId, lang);
  return tpl ? { ...tpl, ...extra } : null;
}

// ── T1: free text or chat message ──────────────────────────────────────────
export function evaluateText(text, lang) {
  const { flag, matched } = classifySelfHarm(text, lang);
  if (flag) return [esc("T1", lang, { reason: `self-harm phrase: ${matched}` })];
  return [];
}

// ── Baby daily log → T3, T4, T6 ─────────────────────────────────────────────
// log: normalized baby-log shape. profile: { baby: { dob } }.
export function evaluateBabyLog(log, profile, lang) {
  const out = [];
  if (!log) return out;
  const babyDays = profile?.baby?.dob != null ? ageDays(profile.baby.dob) : null;

  // T3 hydration: ≤4 wet beyond day 5, or ≤2 any day.
  if (log.wet_diapers != null) {
    const beyondDay5 = babyDays == null || babyDays > 5;
    if (log.wet_diapers <= 2 || (beyondDay5 && log.wet_diapers <= 4)) {
      out.push(esc("T3", lang, { reason: `wet_diapers=${log.wet_diapers}` }));
    }
  }

  // T4 fever in baby <12 weeks (≈ <84 days). Absence of DOB → be cautious and
  // still flag a fever, since a young-baby fever is an emergency.
  const hasFever = Array.isArray(log.health_flags) && log.health_flags.includes("fever");
  if (hasFever && (babyDays == null || babyDays < 84)) {
    out.push(esc("T4", lang, { reason: `fever, age_days=${babyDays ?? "unknown"}` }));
  }

  // T6 stool color red/white/black after the meconium window (day >3).
  const afterMeconium = babyDays == null || babyDays > 3;
  if (afterMeconium && ["red", "white", "black"].includes(log.stool_color)) {
    out.push(esc("T6", lang, { reason: `stool_color=${log.stool_color}` }));
  }

  return out.filter(Boolean);
}

// ── Mother daily log → T2a, T5 ──────────────────────────────────────────────
// motherHistory: array of recent mother logs (incl. today), newest last, each
// with { log_date, mood }. profile: { mother: { delivery_date } }.
export function evaluateMotherLog(log, motherHistory, profile, lang) {
  const out = [];
  if (!log) return out;

  // T5 bleeding: heavy any time, or any bleeding after postpartum week 6.
  const ppWeek = profile?.mother?.delivery_date != null ? postpartumWeek(profile.mother.delivery_date) : null;
  if (log.bleeding === "heavy") {
    out.push(esc("T5", lang, { reason: "bleeding=heavy" }));
  } else if (["light", "heavy"].includes(log.bleeding) && ppWeek != null && ppWeek > 6) {
    out.push(esc("T5", lang, { reason: `bleeding=${log.bleeding} @ pp_week ${ppWeek}` }));
  }

  // T2a mood ≤2 for 3 consecutive days (mood is 1–5; log stores 0–4 index,
  // callers pass a normalized 1–5 `mood`). We treat the 3 most recent
  // available days.
  if (Array.isArray(motherHistory) && motherHistory.length >= 3) {
    const last3 = motherHistory.slice(-3);
    const allLow = last3.length === 3 && last3.every((d) => d && d.mood != null && d.mood <= 2);
    if (allLow) out.push(esc("T2a", lang, { reason: "mood ≤2 ×3 days" }));
  }

  return out.filter(Boolean);
}

// ── T2b: biweekly screening result ──────────────────────────────────────────
// screen: { tool, total_score, item10_flag, threshold }.
export function evaluateScreening(screen, lang) {
  if (!screen) return [];
  const threshold = screen.threshold ?? 13; // EPDS common cutoff
  if (screen.item10_flag || (screen.total_score != null && screen.total_score >= threshold)) {
    return [esc("T2b", lang, { reason: `screen ${screen.total_score}/item10=${!!screen.item10_flag}` })];
  }
  return [];
}

// Pick the single most severe escalation from a set (for UI that shows one).
export function highestSeverity(escalations) {
  const list = (escalations || []).filter(Boolean);
  if (!list.length) return null;
  return list.reduce((a, b) =>
    (SEVERITY_RANK[b.severity] || 0) > (SEVERITY_RANK[a.severity] || 0) ? b : a
  );
}

// Convenience: does this set demand suppressing the normal AI answer?
export function mustSuppressAI(escalations) {
  return (escalations || []).some((e) => e && e.suppressAI);
}
