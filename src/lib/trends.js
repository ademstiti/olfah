// Rules-based trend detection (§6.8). Deterministic, no ML. Runs on log save;
// emits insight cards + the human-readable strings that populate
// <active_flags> / <trends> in the AI context.

import { correctedAgeWeeks } from "./dates.js";

function avg(nums) {
  const v = nums.filter((n) => typeof n === "number" && !isNaN(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// baseline = trailing window EXCLUDING the most recent `recentDays`.
function split(logs, field, recentDays) {
  const vals = logs.map((l) => (l ? l[field] : null));
  const recent = vals.slice(-recentDays);
  const base = vals.slice(0, Math.max(0, vals.length - recentDays));
  return { recentAvg: avg(recent), baseAvg: avg(base) };
}

function pctDelta(recentAvg, baseAvg) {
  if (recentAvg == null || baseAvg == null || baseAvg === 0) return null;
  return Math.round(((recentAvg - baseAvg) / baseAvg) * 100);
}

// Returns { flags: [{rule_id, severity, en, ar}], deltas: {...} } for context.
export function computeTrends(profile, babyLogs, motherLogs, asOf = new Date()) {
  const flags = [];
  const ageW = profile?.baby?.dob != null
    ? correctedAgeWeeks(profile.baby.dob, profile?.baby?.gestational_age_weeks, asOf)
    : null;

  const wakings = split(babyLogs, "night_wakings", 3);
  const feeds = split(babyLogs, "feeds_count", 3);
  const wet = split(babyLogs, "wet_diapers", 1);
  const mood = split(motherLogs, "mood", 3);

  const wakeDelta = pctDelta(wakings.recentAvg, wakings.baseAvg);
  const feedDelta = pctDelta(feeds.recentAvg, feeds.baseAvg);
  const moodDelta = pctDelta(mood.recentAvg, mood.baseAvg);

  // R1 sleep regression: age 14–20w AND 3-day wakings ≥1.5× baseline
  if (ageW != null && ageW >= 14 && ageW <= 20 && wakings.baseAvg && wakings.recentAvg >= 1.5 * wakings.baseAvg) {
    flags.push({
      rule_id: "R1", severity: "info",
      en: `possible 4-month sleep regression (age ${ageW}w + waking spike)`,
      ar: `احتمال طفرة نوم الشهر الرابع (العمر ${ageW} أسبوع + زيادة الاستيقاظ)`,
    });
  }
  // R2 growth-spurt feeding: feeds ≥1.4× baseline for recent days, age <6mo
  if (ageW != null && ageW < 26 && feeds.baseAvg && feeds.recentAvg >= 1.4 * feeds.baseAvg) {
    flags.push({
      rule_id: "R2", severity: "info",
      en: "feeds up sharply — likely a growth spurt (normal, temporary)",
      ar: "زيادة واضحة في الرضعات، غالباً طفرة نمو (طبيعية ومؤقتة)",
    });
  }
  // R3 mood dip: mother mood ≤2 for 3 consecutive days
  const last3Mood = motherLogs.slice(-3);
  if (last3Mood.length === 3 && last3Mood.every((d) => d && d.mood != null && d.mood <= 2)) {
    flags.push({
      rule_id: "R3", severity: "high",
      en: "mother mood low 3 days running", ar: "مزاج الأم منخفض 3 أيام متتالية",
    });
  }
  // R4 isolation: received_help=false 5 of last 7 AND mood declining
  const last7 = motherLogs.slice(-7);
  const noHelp = last7.filter((d) => d && d.received_help === false).length;
  if (last7.length >= 5 && noHelp >= 5 && moodDelta != null && moodDelta < 0) {
    flags.push({
      rule_id: "R4", severity: "high",
      en: "little support at home + mood declining", ar: "دعم قليل في البيت + مزاج ينخفض",
    });
  }

  const deltas = {
    night_wakings: wakeDelta, feeds: feedDelta, mood: moodDelta,
    wet_recent: wet.recentAvg,
  };
  return { flags, deltas };
}

// Short human string for <trends>.
export function trendsSummary(deltas, lang) {
  const bits = [];
  const d = deltas || {};
  if (d.night_wakings != null && Math.abs(d.night_wakings) >= 20)
    bits.push(lang === "ar" ? `الاستيقاظ الليلي ${d.night_wakings > 0 ? "+" : ""}${d.night_wakings}%` : `night_wakings ${d.night_wakings > 0 ? "+" : ""}${d.night_wakings}%`);
  if (d.feeds != null && Math.abs(d.feeds) >= 20)
    bits.push(lang === "ar" ? `الرضعات ${d.feeds > 0 ? "+" : ""}${d.feeds}%` : `feeds ${d.feeds > 0 ? "+" : ""}${d.feeds}%`);
  else bits.push(lang === "ar" ? "الرضعات مستقرة" : "feeds stable");
  if (d.mood != null && d.mood < -10)
    bits.push(lang === "ar" ? "المزاج ينخفض" : "mood declining");
  return bits.join("; ");
}
