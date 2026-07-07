// Hardcoded escalation copy (§6.9). These are the ONLY responses served for a
// trigger — they bypass/override AI generation. Copy rules: never diagnose,
// never minimize, never guilt, always one clear next action.
//
// ⚠️ LAUNCH BLOCKERS before any public user:
//   1. Every Arabic string below must be reviewed by a native speaker + a
//      clinician (§6.9, §8). The Arabic here is a first draft for build only.
//   2. CRISIS_RESOURCES must be replaced with VERIFIED Qatar/GCC numbers
//      (§13 Q2). Do not ship the placeholders.

// Single source of truth for emergency contacts. Referenced by T1 / T2b copy.
export const CRISIS_RESOURCES = {
  ar: [
    "خدمة الطوارئ في قطر: 999",
    "الخط الساخن للدعم النفسي: [بديل — تحقّق قبل الإطلاق]",
    "خط مساندة (حمد الطبية): [بديل — تحقّق قبل الإطلاق]",
  ],
  en: [
    "Qatar emergency services: 999",
    "Mental-health support line: [PLACEHOLDER — verify before launch]",
    "Sidra / Hamad maternal support: [PLACEHOLDER — verify before launch]",
  ],
  verified: false, // flip to true only after §13 Q2 is resolved
};

function resourceBlock(lang) {
  return CRISIS_RESOURCES[lang].map((r) => `• ${r}`).join("\n");
}

// severity ranks — higher wins when several triggers fire at once.
export const SEVERITY_RANK = {
  critical: 5,
  emergency: 4,
  urgent: 3,
  high: 2,
  info: 1,
};

// Each template: { title, body, action, tone }. `suppressAI` templates mean
// the normal answer must not be shown at all.
export const TEMPLATES = {
  T1: {
    severity: "critical",
    suppressAI: true,
    en: {
      title: "You deserve support right now",
      body:
        "What you're feeling matters, and you don't have to carry it alone. Please reach out to someone you trust today, and to a professional who can help. If you might act on these thoughts, contact emergency help now:\n\n" +
        resourceBlock("en"),
      action: "I'm here — tell me what's going on",
    },
    ar: {
      title: "أنتِ تستحقين الدعم الآن",
      body:
        "ما تشعرين به مهم، ولستِ مضطرة لتحمّله وحدك. تواصلي اليوم مع شخص تثقين به، ومع مختص يقدر يساعدك. وإذا كنتِ تخافين أن تؤذي نفسك، اطلبي المساعدة الطارئة الآن:\n\n" +
        resourceBlock("ar"),
      action: "أنا معكِ — احكيلي وش اللي يصير",
    },
  },
  T2a: {
    severity: "high",
    suppressAI: false,
    en: {
      title: "Checking in on you",
      body:
        "The last few days have looked heavy. That's worth paying attention to — not something to push through alone. A short well-being check-in can help, and talking to your doctor about how you're feeling is always okay.",
      action: "Take the 2-minute check-in",
    },
    ar: {
      title: "نطمّن عليكِ",
      body:
        "الأيام الأخيرة كانت ثقيلة عليكِ. هذا شيء يستاهل الانتباه، مو شيء تتحمّلينه لحالك. في فحص قصير للحالة النفسية يقدر يساعد، ومو عيب تكلمين طبيبتك عن اللي تحسّين فيه.",
      action: "خذي الفحص (دقيقتان)",
    },
  },
  T2b: {
    severity: "critical",
    suppressAI: true,
    en: {
      title: "Please reach out today",
      body:
        "Your check-in points to a level of distress that deserves real support now. This is common and treatable, and reaching out is a sign of strength. Please contact a professional today:\n\n" +
        resourceBlock("en"),
      action: "See support options",
    },
    ar: {
      title: "تواصلي اليوم من فضلك",
      body:
        "نتيجة فحصك تشير إلى ضيق يستاهل دعم حقيقي الآن. هذا شيء شائع وقابل للعلاج، وطلب المساعدة دليل قوة. تواصلي اليوم مع مختص:\n\n" +
        resourceBlock("ar"),
      action: "خيارات الدعم",
    },
  },
  T3: {
    severity: "urgent",
    suppressAI: false,
    en: {
      title: "Contact your pediatrician today",
      body:
        "Wet diapers are one of the clearest signs a baby is getting enough milk. Fewer than expected can mean low intake or dehydration, so it's worth a same-day call to your pediatrician to be safe.",
      action: "Connect to a pediatrician",
    },
    ar: {
      title: "تواصلي مع طبيب الأطفال اليوم",
      body:
        "عدد الحفاضات المبللة من أوضح علامات إن الطفل ياخذ حليب كافٍ. لو أقل من المتوقع، ممكن يعني قلة في الرضاعة أو جفاف، فالأفضل تكلمين طبيب الأطفال اليوم للاطمئنان.",
      action: "تواصلي مع طبيب أطفال",
    },
  },
  T4: {
    severity: "emergency",
    suppressAI: true,
    en: {
      title: "A fever in a baby this young needs care now",
      body:
        "In a baby under about 3 months, any fever needs to be checked by a doctor right away — please don't wait. Go to the nearest emergency department or call your pediatrician now.",
      action: "Get emergency care",
    },
    ar: {
      title: "الحرارة في طفل بهذا العمر تحتاج تقييم فوري",
      body:
        "في طفل عمره أقل من 3 أشهر تقريباً، أي ارتفاع في الحرارة لازم يتقيّم من طبيب فوراً، لا تنتظرين من فضلك. توجّهي لأقرب طوارئ أو اتصلي بطبيب الأطفال الآن.",
      action: "اطلبي رعاية طارئة",
    },
  },
  T5: {
    severity: "urgent",
    suppressAI: false,
    en: {
      title: "Contact your doctor today",
      body:
        "The bleeding you logged is worth a same-day call to your OB or doctor. Heavy bleeding, or bleeding returning after it had settled, should always be checked to keep you safe.",
      action: "Connect to a doctor",
    },
    ar: {
      title: "تواصلي مع طبيبتك اليوم",
      body:
        "النزيف اللي سجّلتيه يستاهل اتصال اليوم مع طبيبة النساء. النزيف الغزير، أو رجوعه بعد ما توقف، لازم يتفحّص دائماً حفاظاً على سلامتك.",
      action: "تواصلي مع طبيبة",
    },
  },
  T6: {
    severity: "urgent",
    suppressAI: false,
    en: {
      title: "Show this stool color to your pediatrician today",
      body:
        "Red, white, or black stool (after the first newborn days) can point to something that needs a doctor's eye. It's often nothing, but it's worth a same-day check to rule out anything important.",
      action: "Connect to a pediatrician",
    },
    ar: {
      title: "اعرضي لون البراز على طبيب الأطفال اليوم",
      body:
        "البراز الأحمر أو الأبيض أو الأسود (بعد أيام الولادة الأولى) ممكن يشير لشيء يحتاج نظر الطبيب. غالباً ما يكون شيء بسيط، لكن الأفضل فحص اليوم للاطمئنان.",
      action: "تواصلي مع طبيب أطفال",
    },
  },
};

export function getTemplate(triggerId, lang = "en") {
  const t = TEMPLATES[triggerId];
  if (!t) return null;
  const copy = t[lang] || t.en;
  return {
    triggerId,
    severity: t.severity,
    suppressAI: t.suppressAI,
    title: copy.title,
    body: copy.body,
    action: copy.action,
  };
}
