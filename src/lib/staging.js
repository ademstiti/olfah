// Adaptive question staging (§6.5). Static, age-driven config (P0). Which
// journal fields are emphasized vs collapsed is a function of the baby's stage
// and postpartum week.

import { stageForAge, postpartumWeek } from "./dates.js";

// Per-stage field visibility. `show` = surfaced; anything not shown is
// collapsed/hidden. Field ids match the normalized log shapes.
const STAGE_CONFIG = {
  A: { show: ["feeds_count", "feed_types", "wet_diapers", "dirty_diapers", "stool_color", "fussiness", "health_flags", "mood", "sleep_hours", "pain_level", "bleeding", "bf", "received_help", "checkin"] },
  B: { show: ["feeds_count", "feed_types", "naps_count", "night_wakings", "longest_sleep", "fussiness", "health_flags", "mood", "sleep_hours", "bf", "received_help", "checkin"] },
  C: { show: ["feeds_count", "feed_types", "night_wakings", "longest_sleep", "fussiness", "health_flags", "solids_ready", "mood", "sleep_hours", "received_help", "checkin"] },
  D: { show: ["feed_types", "solids", "food_reactions", "night_wakings", "milestones", "fussiness", "health_flags", "mood", "sleep_hours", "work_return", "received_help", "checkin"] },
  E: { show: ["mood", "fussiness", "health_flags", "checkin"] },
};
// Postpartum-only fields collapse after their clinical window regardless of
// baby stage.
function ppOverride(fields, ppWeek) {
  if (ppWeek == null) return fields;
  let f = [...fields];
  if (ppWeek > 8) f = f.filter((x) => x !== "bleeding");
  if (ppWeek > 12) f = f.filter((x) => x !== "pain_level");
  return f;
}

export function stageConfig(profile, asOf = new Date()) {
  const dob = profile?.baby?.dob;
  const ga = profile?.baby?.gestational_age_weeks;
  const stage = stageForAge(dob, ga, asOf) || "B";
  const ppWeek = profile?.mother?.delivery_date != null ? postpartumWeek(profile.mother.delivery_date, asOf) : null;
  const show = ppOverride(STAGE_CONFIG[stage].show, ppWeek);
  return { stage, ppWeek, show, feedingMethod: profile?.baby?.feeding_method || "mixed" };
}

export function isShown(fieldId, profile, asOf = new Date()) {
  return stageConfig(profile, asOf).show.includes(fieldId);
}

// Stage transition copy for the gentle in-app announcement (§6.5).
export const STAGE_LABELS = {
  A: { en: "Newborn", ar: "حديث الولادة" },
  B: { en: "6 weeks – 4 months", ar: "6 أسابيع – 4 أشهر" },
  C: { en: "4 – 6 months", ar: "4 – 6 أشهر" },
  D: { en: "6 – 12 months", ar: "6 – 12 شهر" },
  E: { en: "12 months+", ar: "12 شهر فما فوق" },
};
