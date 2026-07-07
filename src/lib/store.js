// Persistence layer. Shapes mirror the Supabase tables in §7 exactly, so the
// swap to a real backend is: replace the localStorage read/write bodies with
// Supabase queries (RLS already enforces user_id). Nothing above this file
// knows where data lives.
//
// Grain is daily per §7: baby_daily_logs / mother_daily_logs keyed by
// (subject, log_date) and idempotent — saving the same day edits it.

import { dayKey } from "./dates.js";

const KEY = "olfah-db-v2";

const EMPTY = {
  profile: {
    baby: { name: "", dob: null, sex: "", gestational_age_weeks: 40, birth_weight_g: null, feeding_method: "mixed", known_conditions: [] },
    mother: { first_baby: null, delivery_type: "", delivery_date: null, breastfeeding_goal: "", support_at_home: [], work_return_date: null, language_pref: "ar", dialect_pref: "auto" },
  },
  babyLogs: {},        // { 'YYYY-MM-DD': {...} }
  motherLogs: {},      // { 'YYYY-MM-DD': {...} }
  journalEntries: [],  // [{ id, log_date, text, source, ai_summary, safety_class, created_at }]
  screenings: [],      // [{ id, tool, total_score, item10_flag, taken_at }]
  insights: [],        // [{ id, rule_id, payload, surfaced_at, dismissed }]
  escalationEvents: [],// [{ id, trigger_id, severity, payload, surfaced_at, acknowledged }]
};

function hasLS() {
  try { return typeof localStorage !== "undefined"; } catch { return false; }
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function read() {
  if (!hasLS()) return clone(EMPTY);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(EMPTY);
    const parsed = JSON.parse(raw);
    // shallow-merge so new fields in EMPTY appear for older saved dbs
    return {
      ...clone(EMPTY),
      ...parsed,
      profile: {
        baby: { ...EMPTY.profile.baby, ...(parsed.profile?.baby || {}) },
        mother: { ...EMPTY.profile.mother, ...(parsed.profile?.mother || {}) },
      },
    };
  } catch {
    return clone(EMPTY);
  }
}

function write(db) {
  if (!hasLS()) return db;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
  return db;
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "id" + Date.now() + Math.random().toString(16).slice(2));

// ── profile ────────────────────────────────────────────────────────────────
export function getProfile() { return read().profile; }

export function saveProfile(patch) {
  const db = read();
  db.profile = {
    baby: { ...db.profile.baby, ...(patch.baby || {}) },
    mother: { ...db.profile.mother, ...(patch.mother || {}) },
  };
  // delivery_date defaults to baby dob (§6.1) when unset
  if (!db.profile.mother.delivery_date && db.profile.baby.dob) {
    db.profile.mother.delivery_date = db.profile.baby.dob;
  }
  write(db);
  return db.profile;
}

export function hasProfile() {
  return !!read().profile.baby.dob;
}

// ── daily logs (idempotent per day) ─────────────────────────────────────────
export function saveBabyLog(data, date = new Date()) {
  const db = read();
  const k = dayKey(date);
  db.babyLogs[k] = { ...(db.babyLogs[k] || {}), ...data, log_date: k };
  write(db);
  return db.babyLogs[k];
}

export function getBabyLog(date = new Date()) { return read().babyLogs[dayKey(date)] || null; }

export function saveMotherLog(data, date = new Date()) {
  const db = read();
  const k = dayKey(date);
  db.motherLogs[k] = { ...(db.motherLogs[k] || {}), ...data, log_date: k };
  write(db);
  return db.motherLogs[k];
}

export function getMotherLog(date = new Date()) { return read().motherLogs[dayKey(date)] || null; }

// last N days of logs, oldest→newest, only days that exist.
function recent(map, n) {
  return Object.keys(map).sort().slice(-n).map((k) => map[k]);
}
export function recentBabyLogs(n = 14) { return recent(read().babyLogs, n); }
export function recentMotherLogs(n = 14) { return recent(read().motherLogs, n); }

export function loggedDayCount() {
  const db = read();
  return new Set([...Object.keys(db.babyLogs), ...Object.keys(db.motherLogs)]).size;
}

// ── journal free-text ────────────────────────────────────────────────────────
export function addJournalEntry(entry) {
  const db = read();
  const row = { id: uid(), log_date: dayKey(), source: "text", ai_summary: null, safety_class: null, created_at: new Date().toISOString(), ...entry };
  db.journalEntries.push(row);
  write(db);
  return row;
}
export function recentJournalEntries(n = 3) { return read().journalEntries.slice(-n); }

// ── screenings / insights / escalations ─────────────────────────────────────
export function addScreening(s) {
  const db = read();
  const row = { id: uid(), taken_at: new Date().toISOString(), ...s };
  db.screenings.push(row); write(db); return row;
}
export function recentScreenings(n = 5) { return read().screenings.slice(-n); }

export function addInsight(i) {
  const db = read();
  const row = { id: uid(), surfaced_at: new Date().toISOString(), dismissed: false, ...i };
  db.insights.push(row); write(db); return row;
}
export function activeInsights() { return read().insights.filter((i) => !i.dismissed); }

export function addEscalationEvent(e) {
  const db = read();
  const row = { id: uid(), surfaced_at: new Date().toISOString(), acknowledged: false, ...e };
  db.escalationEvents.push(row); write(db); return row;
}
export function recentEscalations(n = 20) { return read().escalationEvents.slice(-n); }

// ── §9 privacy: one-tap export + hard delete ────────────────────────────────
export function exportAll() { return read(); }

export function deleteAll() {
  if (hasLS()) {
    try {
      localStorage.removeItem(KEY);
      // purge legacy prototype keys + any cached context
      ["olfah-journal", "olfah-jdone", "olfah-chat", "olfah-age", "olfah-posts", "olfah-liked"].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
  return clone(EMPTY);
}
