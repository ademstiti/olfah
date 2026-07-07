// Safety trigger test suite (§6.9 / §12). 100% pass required to ship.
// Run: node --test
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  classifySelfHarm, evaluateText, evaluateBabyLog, evaluateMotherLog,
  evaluateScreening, highestSeverity, mustSuppressAI,
} from "./safety.js";
import { assembleContext } from "./context.js";
import { checkinDistress, checkinForDay } from "./checkins.js";
import { stageForAge, correctedAgeWeeks, postpartumWeek } from "./dates.js";

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const isoDaysAgo = (n) => daysAgo(n).toISOString().slice(0, 10);

// ── T1 self-harm classifier ────────────────────────────────────────────────
test("T1 EN: suicidal ideation fires", () => {
  for (const s of ["I want to die", "I can't go on anymore", "everyone would be better without me"]) {
    assert.equal(classifySelfHarm(s, "en").flag, true, s);
    const e = evaluateText(s, "en");
    assert.equal(e[0].triggerId, "T1");
    assert.equal(e[0].suppressAI, true);
  }
});

test("T1 AR: suicidal ideation fires", () => {
  for (const s of ["أبي أموت", "ما لي خلق العيش", "أطفالي أحسن بدوني"]) {
    assert.equal(classifySelfHarm(s, "ar").flag, true, s);
    assert.equal(evaluateText(s, "ar")[0].triggerId, "T1");
  }
});

test("T1: harm-to-baby phrases fire", () => {
  assert.equal(classifySelfHarm("sometimes I want to hurt my baby", "en").flag, true);
  assert.equal(classifySelfHarm("أبي أأذي طفلي", "ar").flag, true);
});

test("T1: benign phrases do NOT fire (false-positive guard)", () => {
  for (const s of ["I'm dying to get some sleep", "this teething is killing me", "kill time until the nap"]) {
    assert.equal(classifySelfHarm(s, "en").flag, false, s);
  }
  assert.equal(evaluateText("she slept 6 hours, so happy", "en").length, 0);
  assert.equal(evaluateText("الحمدلله نامت زين اليوم", "ar").length, 0);
});

test("T1: lang-agnostic scan catches either language", () => {
  assert.equal(classifySelfHarm("أبي أموت", null).flag, true);
  assert.equal(classifySelfHarm("I want to die", undefined).flag, true);
});

// ── T3 hydration ────────────────────────────────────────────────────────────
test("T3: low wet diapers beyond day 5 fires", () => {
  const profile = { baby: { dob: isoDaysAgo(30) } };
  assert.equal(evaluateBabyLog({ wet_diapers: 4 }, profile, "en")[0].triggerId, "T3");
  assert.equal(evaluateBabyLog({ wet_diapers: 6 }, profile, "en").length, 0);
});

test("T3: ≤2 wet any day fires even in first days", () => {
  const profile = { baby: { dob: isoDaysAgo(2) } };
  assert.equal(evaluateBabyLog({ wet_diapers: 2 }, profile, "ar")[0].triggerId, "T3");
});

// ── T4 young-baby fever ─────────────────────────────────────────────────────
test("T4: fever under 12 weeks is emergency + suppresses AI", () => {
  const profile = { baby: { dob: isoDaysAgo(40) } };
  const e = evaluateBabyLog({ health_flags: ["fever"] }, profile, "en");
  assert.equal(e[0].triggerId, "T4");
  assert.equal(e[0].severity, "emergency");
  assert.equal(mustSuppressAI(e), true);
});

test("T4: fever over 12 weeks does NOT fire T4", () => {
  const profile = { baby: { dob: isoDaysAgo(120) } };
  assert.equal(evaluateBabyLog({ health_flags: ["fever"] }, profile, "en").length, 0);
});

test("T4: fever with unknown DOB errs toward flagging", () => {
  assert.equal(evaluateBabyLog({ health_flags: ["fever"] }, {}, "en")[0].triggerId, "T4");
});

// ── T6 stool color ──────────────────────────────────────────────────────────
test("T6: red/white/black stool after meconium fires; normal does not", () => {
  const profile = { baby: { dob: isoDaysAgo(60) } };
  for (const c of ["red", "white", "black"]) {
    assert.equal(evaluateBabyLog({ stool_color: c }, profile, "ar")[0].triggerId, "T6");
  }
  assert.equal(evaluateBabyLog({ stool_color: "yellow" }, profile, "en").length, 0);
});

// ── T5 bleeding ─────────────────────────────────────────────────────────────
test("T5: heavy bleeding always fires", () => {
  assert.equal(evaluateMotherLog({ bleeding: "heavy" }, [], { mother: { delivery_date: isoDaysAgo(3) } }, "en")[0].triggerId, "T5");
});

test("T5: light bleeding after week 6 fires; before does not", () => {
  const after = { mother: { delivery_date: isoDaysAgo(60) } };
  const before = { mother: { delivery_date: isoDaysAgo(10) } };
  assert.equal(evaluateMotherLog({ bleeding: "light" }, [], after, "en")[0].triggerId, "T5");
  assert.equal(evaluateMotherLog({ bleeding: "light" }, [], before, "en").length, 0);
});

// ── T2a mood ───────────────────────────────────────────────────────────────
test("T2a: mood ≤2 for 3 consecutive days fires", () => {
  const hist = [{ mood: 2 }, { mood: 1 }, { mood: 2 }];
  assert.equal(evaluateMotherLog({ mood: 2 }, hist, {}, "en")[0].triggerId, "T2a");
});

test("T2a: a single good day breaks the streak", () => {
  const hist = [{ mood: 2 }, { mood: 4 }, { mood: 2 }];
  assert.equal(evaluateMotherLog({ mood: 2 }, hist, {}, "en").length, 0);
});

// ── T2b screening ────────────────────────────────────────────────────────────
test("T2b: over-threshold or item-10 positive fires + suppresses AI", () => {
  assert.equal(evaluateScreening({ total_score: 14 }, "en")[0].triggerId, "T2b");
  assert.equal(evaluateScreening({ total_score: 3, item10_flag: true }, "en")[0].triggerId, "T2b");
  assert.equal(mustSuppressAI(evaluateScreening({ item10_flag: true }, "en")), true);
  assert.equal(evaluateScreening({ total_score: 5 }, "en").length, 0);
});

// ── severity ranking ─────────────────────────────────────────────────────────
test("highestSeverity picks the most severe", () => {
  const set = [
    evaluateBabyLog({ wet_diapers: 4 }, { baby: { dob: isoDaysAgo(30) } }, "en")[0], // T3 urgent
    evaluateBabyLog({ health_flags: ["fever"] }, { baby: { dob: isoDaysAgo(10) } }, "en")[0], // T4 emergency
  ];
  assert.equal(highestSeverity(set).triggerId, "T4");
});

// ── check-in scoring ─────────────────────────────────────────────────────────
test("check-in reverse scoring inverts", () => {
  assert.equal(checkinDistress("C2", 2), 2); // non-reverse: often = high distress
  assert.equal(checkinDistress("C6", 2), 0); // reverse: often enjoyment = low distress
  assert.ok(checkinForDay(new Date()).id);
});

// ── date math ────────────────────────────────────────────────────────────────
test("corrected age subtracts prematurity; stage keys off it", () => {
  const dob = isoDaysAgo(7 * 20); // chrono 20w
  assert.equal(correctedAgeWeeks(dob, 32), 12); // 20 - (40-32) = 12
  assert.equal(correctedAgeWeeks(dob, 40), 20); // term unchanged
  assert.equal(stageForAge(dob, 40), "C");
  assert.equal(postpartumWeek(isoDaysAgo(14)), 2);
});

// ── context assembler ────────────────────────────────────────────────────────
test("context: <3 days emits a data_note and no false familiarity", () => {
  const data = {
    profile: { baby: { name: "Sara", dob: isoDaysAgo(140), gestational_age_weeks: 40 }, mother: { first_baby: true, delivery_date: isoDaysAgo(140) } },
    babyLogs: [{ log_date: isoDaysAgo(0), feeds_count: 6, night_wakings: 4, wet_diapers: 5 }],
    motherLogs: [{ log_date: isoDaysAgo(0), mood: 2, sleep_hours: "3-5" }],
  };
  const r = assembleContext(data, "en", new Date());
  assert.equal(r.hasEnoughData, false);
  assert.match(r.xml, /data_note/);
  assert.match(r.xml, /name="Sara"/);
  assert.equal(r.grounded, true);
});

test("context: regression flag appears with enough history", () => {
  const babyLogs = [];
  for (let i = 13; i >= 3; i--) babyLogs.push({ log_date: isoDaysAgo(i), night_wakings: 1, feeds_count: 6 });
  for (let i = 2; i >= 0; i--) babyLogs.push({ log_date: isoDaysAgo(i), night_wakings: 4, feeds_count: 6 });
  const data = {
    profile: { baby: { dob: isoDaysAgo(7 * 17), gestational_age_weeks: 40 }, mother: {} },
    babyLogs, motherLogs: [],
  };
  const r = assembleContext(data, "en", new Date());
  assert.equal(r.hasEnoughData, true);
  assert.match(r.xml, /sleep regression/);
});
