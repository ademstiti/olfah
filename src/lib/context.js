// AI Context Assembler (§6.7 — the core of the product). Renders profile +
// longitudinal logs + trends + free-text into the structured <mother_context>
// block injected into the chat system prompt. Pure function of its inputs so
// it is unit-testable and deterministic.

import { correctedAgeWeeks, ageWeeks, postpartumWeek, isPreterm, dayKey } from "./dates.js";
import { computeTrends, trendsSummary } from "./trends.js";

const MOOD_N = 5; // moods stored 1..5

function esc(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function attr(k, v) {
  if (v == null || v === "") return "";
  return ` ${k}="${esc(v)}"`;
}

function slash(v, max) {
  return v == null ? null : `${v}/${max}`;
}

// data: { profile, babyLogs[], motherLogs[], journalEntries[], insights[] }
// Returns { xml, grounded, hasEnoughData, dayCount, flags }.
export function assembleContext(data, lang = "en", asOf = new Date()) {
  const { profile, babyLogs = [], motherLogs = [], journalEntries = [], insights = [] } = data || {};
  const baby = profile?.baby || {};
  const mother = profile?.mother || {};

  const dayCount = new Set([
    ...babyLogs.map((l) => l.log_date),
    ...motherLogs.map((l) => l.log_date),
  ].filter(Boolean)).size;
  const hasEnoughData = dayCount >= 3;

  const corr = baby.dob ? correctedAgeWeeks(baby.dob, baby.gestational_age_weeks, asOf) : null;
  const chrono = baby.dob ? ageWeeks(baby.dob, asOf) : null;
  const ppWeek = mother.delivery_date ? postpartumWeek(mother.delivery_date, asOf) : null;

  const todayKey = dayKey(asOf);
  const todayBaby = babyLogs.find((l) => l.log_date === todayKey) || null;
  const todayMother = motherLogs.find((l) => l.log_date === todayKey) || null;

  const { flags, deltas } = computeTrends(profile, babyLogs, motherLogs, asOf);

  // ── build XML ──
  const lines = ["<mother_context>"];

  lines.push(
    "  <baby" +
      attr("name", baby.name) +
      attr("age_weeks", corr) +
      (isPreterm(baby.gestational_age_weeks) ? attr("chrono_weeks", chrono) : "") +
      attr("born", baby.dob) +
      attr("term", baby.gestational_age_weeks ? `${baby.gestational_age_weeks}w` : null) +
      attr("weight_birth", baby.birth_weight_g ? `${(baby.birth_weight_g / 1000).toFixed(1)}kg` : null) +
      attr("feeding", baby.feeding_method) +
      (baby.known_conditions?.length ? attr("conditions", baby.known_conditions.join(",")) : "") +
      "/>"
  );

  lines.push(
    "  <mother" +
      attr("first_baby", mother.first_baby) +
      attr("delivery", mother.delivery_type) +
      attr("postpartum_week", ppWeek) +
      (mother.support_at_home?.length ? attr("support", mother.support_at_home.join(",")) : "") +
      attr("lang", `${lang}-${mother.dialect_pref && mother.dialect_pref !== "auto" ? mother.dialect_pref : "gulf"}`) +
      "/>"
  );

  if (todayBaby || todayMother) {
    lines.push(
      "  <today" +
        attr("feeds", todayBaby?.feeds_count) +
        attr("naps", todayBaby?.naps_count) +
        attr("night_wakings", todayBaby?.night_wakings) +
        attr("wet", todayBaby?.wet_diapers) +
        attr("dirty", todayBaby?.dirty_diapers) +
        attr("stool", todayBaby?.stool_color) +
        attr("fussiness", slash(todayBaby?.fussiness, MOOD_N)) +
        attr("mood", slash(todayMother?.mood, MOOD_N)) +
        attr("mother_sleep", todayMother?.sleep_hours) +
        attr("help", todayMother?.received_help == null ? null : todayMother.received_help ? "yes" : "no") +
        "/>"
    );
  }

  if (hasEnoughData) {
    const summary = trendsSummary(deltas, "en");
    if (summary) lines.push(`  <trends window="7d">${esc(summary)}</trends>`);
  }

  const flagStrings = [
    ...flags.map((f) => f.en),
    ...insights.map((i) => i?.payload?.en).filter(Boolean),
  ];
  if (flagStrings.length) {
    lines.push(`  <active_flags>${esc(flagStrings.join("; "))}</active_flags>`);
  }

  const recentText = journalEntries.slice(-3).map((e) => e.ai_summary || e.text).filter(Boolean);
  if (recentText.length) {
    lines.push(`  <recent_journal>${esc(recentText.map((t) => `"${t}"`).join(" "))}</recent_journal>`);
  }

  if (!hasEnoughData) {
    lines.push(`  <data_note>only ${dayCount} day(s) of logs — do not imply deep familiarity; ask rather than assume</data_note>`);
  }

  lines.push("</mother_context>");

  const xml = lines.join("\n");
  const grounded = !!(todayBaby || todayMother || flagStrings.length || recentText.length);

  return { xml, grounded, hasEnoughData, dayCount, flags };
}
