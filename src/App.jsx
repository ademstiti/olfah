import { useState, useEffect, useRef } from "react";

const P = "#5BA4CF", PD = "#3D8AB8", PL = "#E8F4FA";
const PG = "linear-gradient(135deg,#5BA4CF,#7BB8D9)";
const BG = "#F8FBFD", OK = "#4CAF50", WARN = "#E65100";

function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function load(k, fb) { try { const r = localStorage.getItem(k); return r !== null ? JSON.parse(r) : fb; } catch { return fb; } }

function getGreeting(lang) {
  const h = new Date().getHours();
  if (lang === "ar") return h < 12 ? "صباح الخير" : h < 17 ? "مساء الخير" : "مساء النور";
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function computeInsight(jData, lang) {
  const { mood, sleep, nightWakes, bmood, feeds, feedType, feedIssues, symptoms, support } = jData;
  const hasFever = symptoms?.includes(0);
  const hasSevereFuss = symptoms?.includes(1);
  const hasLatching = feedIssues?.includes(0);

  if (lang === "ar") {
    if (hasFever) return "لاحظتِ حرارة, راقبيها باستمرار. لو حسّيتِ بأي شيء غير طبيعي، تواصلي مع طبيب.";
    if (hasSevereFuss && sleep <= 4) return "يوم صعب مع قلة نوم وطفل متضايق, ضعيه في مكان آمن وخذي 5 دقائق لنفسك. ما تقدرين تعطين من كوب فاضي.";
    if (sleep <= 3) return "نمتِ أقل من 4 ساعات, حاولي تنامين مع طفلك في القيلولة القادمة، حتى 20 دقيقة تفرق.";
    if (nightWakes >= 3) return "5 إيقاظات أو أكثر صعب, لو صار متكرر، ممكن يكون regression نوم. يستمر عادةً 2-4 أسابيع ثم يختفي.";
    if (mood === 0 && support === 2) return "مرهقة ولحالك, اطلبي مساعدة أحد اليوم. هذا صعب جداً بدون دعم.";
    if (feeds >= 10) return `${feeds} رضعات, يبدو رضاعة متقاربة. مرهقة بس طبيعية جداً خصوصاً وقت طفرات النمو.`;
    if (feedType === "رضاعة طبيعية" && hasLatching) return "صعوبة اللحظة محبطة جداً. أخصائية رضاعة تقدر تفرق كثير, حتى جلسة واحدة تغير الأمور.";
    if (mood >= 3) return "يبدو إنك بخير اليوم ✨ الأم المرتاحة والسعيدة هي أهم شيء لطفلها.";
    if (bmood >= 3) return "طفلك سعيد اليوم 🥰 استمتعي باللحظة، تستاهلين.";
    return "سجّلتِ يومك, هذه العادة الصغيرة تساعدك تكتشفين أنماط طفلك مع الوقت.";
  }
  if (hasFever) return "You flagged a fever, keep monitoring and trust your instincts. If anything feels off, reach out to a pediatrician.";
  if (hasSevereFuss && sleep <= 4) return "Rough day, little sleep and a fussy baby. Put them somewhere safe and take 5 minutes for yourself. You can't pour from an empty cup.";
  if (sleep <= 3) return "Under 4 hours sleep, nap when baby naps. Even 20 minutes makes a real difference.";
  if (nightWakes >= 3) return "5+ wake-ups is a lot. If this is a pattern, it might be a sleep regression, usually lasts 2–4 weeks then passes on its own.";
  if (mood === 0 && support === 2) return "Exhausted and on your own today, please reach out to someone. This is too hard to carry alone.";
  if (feeds >= 10) return `${feeds} feeds sounds like cluster feeding. Exhausting but completely normal, especially during growth spurts.`;
  if (feedType === "Breastfed" && hasLatching) return "Latching issues are so frustrating. A lactation consultant can make a huge difference, even just one session.";
  if (mood >= 3) return "You're having a good day ✨ A grounded mom is the most important thing for your baby right now.";
  if (bmood >= 3) return "Happy baby today 🥰 Take a moment to soak that in, you made that happen.";
  return "You logged your day, this small habit helps you spot your baby's patterns over time.";
}

function getSuggestions(aiText, lang) {
  if (!aiText) return [];
  const t = aiText.toLowerCase();
  if (lang === "en") {
    if (t.includes("sleep") || t.includes("nap")) return ["How long should each nap be?", "What if they won't settle?", "Is this a sleep regression?"];
    if (t.includes("feed") || t.includes("milk") || t.includes("nursing") || t.includes("formula")) return ["How do I know they're full?", "How often should I feed?", "Can I mix breast and formula?"];
    if (t.includes("cry") || t.includes("colic") || t.includes("fuss")) return ["How do I soothe them?", "Could it be colic?", "When does this get better?"];
    if (t.includes("poop") || t.includes("diaper") || t.includes("stool")) return ["What color is normal?", "How often is normal?"];
    if (t.includes("fever") || t.includes("temperature")) return ["When should I be worried?", "How to take temp correctly?"];
    if (t.includes("rash") || t.includes("skin")) return ["What cream should I use?", "Is it contagious?"];
    return ["Tell me more", "What should I watch for?"];
  }
  if (t.includes("نوم") || t.includes("ينام")) return ["كم ساعة النوم الطبيعي؟", "ماذا لو رفض النوم؟"];
  if (t.includes("رضاعة") || t.includes("حليب")) return ["كيف أعرف إنه شبع؟", "هل الحليب الصناعي جيد؟"];
  if (t.includes("بكاء") || t.includes("يبكي") || t.includes("مغص")) return ["كيف أهدئه؟", "هل هذا مغص؟", "متى يتحسن؟"];
  if (t.includes("حرارة") || t.includes("حمى")) return ["متى أقلق؟", "كيف أقيس الحرارة صح؟"];
  return ["أخبريني أكثر", "هل هذا طبيعي؟"];
}

function buildJournalContext(jData, lang) {
  const t = T[lang];
  const parts = [];
  if (jData.mood >= 0) parts.push(`mom mood: ${t.jMoodL[jData.mood]}`);
  if (jData.sleep > 0) parts.push(`sleep: ${jData.sleep}h`);
  if (jData.nightWakes >= 0) parts.push(`night wakes: ${["none", "1-2x", "3-4x", "5+"][jData.nightWakes]}`);
  if (jData.feedType) parts.push(`feeding: ${jData.feedType}`);
  if (jData.feeds > 0) parts.push(`${jData.feeds} feeds`);
  if (jData.feedIssues?.length) parts.push(`feed concerns: ${jData.feedIssues.map(i => t.jFeedIssueItems[i]).join(", ")}`);
  if (jData.bmood >= 0) parts.push(`baby mood: ${t.jBMoodL[jData.bmood]}`);
  if (jData.symptoms?.length) parts.push(`baby flags: ${jData.symptoms.map(i => t.jSymptomItems[i]).join(", ")}`);
  if (jData.support >= 0) parts.push(`support at home: ${t.jSupportOpts[jData.support]}`);
  if (jData.notes) parts.push(`mom's note: "${jData.notes}"`);
  return parts.join(" | ");
}

async function askAI(msgs, age, lang, jContext) {
  const sys = `You are Olfah (ألفة), a warm motherhood assistant for moms in Qatar and the Gulf.

Tone: Like a knowledgeable friend, warm, direct, never preachy or over-cautious. Never say "it's important to note", "as always", or add boilerplate disclaimers. Get to the answer first.
Baby's age: ${age || "not specified"}.
Language: ${lang === "ar" ? "Gulf Arabic dialect, natural, conversational, warm. Not formal MSA." : "English"}.
${jContext ? `Today's check-in: ${jContext}` : ""}

Topics: feeding (breast/formula/pumping/solids), sleep, diapers, milestones, postpartum recovery, crying, colic, bathing, baby skin, common illnesses, growth spurts, teething.
Format: 2–3 short paragraphs. Lead with the direct answer. End with warmth, not warnings. No bullet lists.

ESCALATE, add [ESCALATE] alone on the last line, only for real red flags:
• Fever in any baby under 3 months (any temperature)
• Fever >38.5°C in baby under 6 months
• Difficulty breathing, fast breathing, grunting
• Refusing all feeds for 6+ hours
• Unusual lethargy or very hard to wake
• Blood in stool or vomit
• Jaundice spreading to belly/legs after day 5
• Seizures, dehydration signs (no wet diaper 6+ hrs)
• Parent says symptoms are "getting worse"

Do NOT escalate for: normal fussiness, cluster feeding, hiccups, mild spit-up, development questions.
Never say "I'm just an AI". Never end with disclaimers.`;

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: sys,
        messages: msgs.map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
      }),
    });
    const d = await r.json();
    const txt = d.content?.[0]?.text || "Sorry, please try again.";
    const esc = txt.includes("[ESCALATE]");
    return { text: txt.replace(/\[ESCALATE\]/g, "").trim(), escalate: esc };
  } catch {
    return { text: "Connection error. Please try again.", escalate: false };
  }
}

const T = {
  ar: {
    appName: "ألفة", splash: "اسألي. اعرفي. تواصلي.",
    onboardTitle: "مرحباً بك في ألفة", onboardSub: "أخبرينا عن طفلك", onboardHelp: "هذا يساعدنا في تقديم النصيحة المناسبة",
    ageLabel: "عمر الطفل", ages: ["حديث الولادة (0-4 أسابيع)", "1-3 أشهر", "3-6 أشهر", "6-12 شهر"],
    langLabel: "اللغة المفضلة", start: "ابدأي الآن",
    howHelp: "كيف تقدر ألفة تساعدك؟",
    askTitle: "اسألي ألفة", askSub: "إجابات فورية لأي سؤال عن طفلك",
    home: "الرئيسية", chat: "اسألي", community: "المجتمع", journal: "التسجيل", profile: "حسابي",
    findDoc: "طبيب أطفال", docSub: "تواصلي الآن", comLabel: "مجتمع الأمهات", comSub: "انضمي للمجموعات",
    trackerLabel: "التسجيل اليومي", trackerSub: "سجّلي يومك", nearLabel: "أمهات قريبات", nearSub: "3 بالقرب منك",
    todayLog: "سجل اليوم", noLog: "لم يتم التسجيل بعد, سجّلي يومك", logDone: "تم تسجيل اليوم ✓",
    feeds: "رضعات", diapers: "حفاضات", sleepH: "ساعات نوم", yourMood: "مزاجك",
    aiName: "ألفة AI", online: "متصلة",
    aiWelcome: "مرحباً! أنا ألفة. اسأليني أي شيء عن طفلك, رضاعة، نوم، نمو، أي شيء. أجاوب من الفور وأوصلك بطبيب إذا احتجتِ.",
    typePH: "اكتبي سؤالك...", thinking: "ألفة تفكر",
    escalateMsg: "⚠️ هذا يحتاج تقييم طبيب أطفال.",
    connectDoc: "تواصلي مع طبيب أطفال الآن",
    docTitle: "الاتصال بطبيب أطفال", finding: "نبحث عن طبيب متاح...", sharing: "مشاركة سجل محادثتك",
    drName: "د. سارة المحمود", drSpec: "طبيبة أطفال · سدرة للطب", drAvail: "متاحة الآن", drConnected: "تم الاتصال",
    drHas: "د. سارة استلمت ملخص محادثتك مع ألفة",
    drMsg: "مرحباً، أنا د. سارة. شفت اللي شاركتيه مع ألفة. كيف أقدر أساعدك؟",
    drSees: "د. سارة تقدر تشوف سجلات الرضاعة والنوم من ألفة",
    replyDoc: "ردي على د. سارة...", avgTime: "متوسط وقت الاتصال: أقل من 3 دقائق",
    bookAppt: "احجزي موعد", bookConfirm: "تم حجز الموعد ✓", bookSub: "غداً الساعة 10:00 صباحاً مع د. سارة",
    jTitle: "التسجيل اليومي", jSub: "كيف كان يومك أنتِ وطفلك؟", jSave: "حفظ التسجيل", jSkip: "تخطي",
    jMood: "كيف مزاجك اليوم؟", jMoods: ["😫", "😔", "😐", "🙂", "😊"], jMoodL: ["مرهقة", "متعبة", "عادي", "جيدة", "ممتازة"],
    jSleep: "كم ساعة نمتِ؟", jSleepU: "ساعات",
    jNightWakes: "كم مرة أيقظك الطفل الليلة؟",
    jWakeOpts: ["نام بدون إيقاظ 😴", "1-2 مرات 🌙", "3-4 مرات 🌒", "5+ مرات 😵"],
    jFeedType: "كيف يرتضع طفلك؟",
    jFeedTypes: ["رضاعة طبيعية", "حليب صناعي", "الاثنين", "مشفوط"],
    jFeedIcons: ["🤱", "🍼", "🔄", "🥛"],
    jFeeds: "كم رضعة اليوم؟", jFeedsU: "رضعات",
    jFeedIssueLabel: "أي مشكلة في الرضاعة؟",
    jFeedIssueItems: ["صعوبة اللحظة", "رفض الرضاعة", "رضاعة متقاربة", "غازات كثيرة", "مشكلة في الشفط"],
    jBabyMood: "مزاج طفلك اليوم؟", jBMoods: ["😭", "😣", "😐", "😄", "😴"], jBMoodL: ["كثير بكاء", "منزعج", "عادي", "سعيد", "هادئ"],
    jSymptomLabel: "أي شيء تلاحظينه؟",
    jSymptomItems: ["حرارة", "بكاء شديد +3 ساعات", "طفح جلدي", "براز غير طبيعي", "نعاس شديد", "قيء", "لا يأكل كافي"],
    jSupportLabel: "عندك مساعدة في البيت اليوم؟",
    jSupportOpts: ["نعم، في من يساعد", "أحياناً", "لحالي اليوم"],
    jWellbeingPH: "قلق، لحظة جميلة، أو بس كيف تحسين...",
    jStepNames: ["كيف حالك؟", "نومك", "الرضاعة", "طفلك اليوم", "أنتِ"],
    jStepSubs: ["كوني صريحة مع نفسك", "نومك مهم بقدر نوم طفلك", "سجّلي ما تيسّر", "كيف كان طفلك؟", "هل في شيء على بالك؟"],
    jStepIcons: ["🌸", "🌙", "🍼", "👶", "💙"],
    jContinue: "التالي", jBack: "السابق",
    jSaved: "تم حفظ تسجيلك اليومي", jStreak: "5 أيام متتالية! 🔥",
    comTitle: "مجتمع الأمهات", comTabs: ["الكل", "مرحلتي", "النوم", "الرضاعة", "قريبات"],
    writePost: "شاركي تجربتك أو اسألي سؤال...", postBtn: "نشر", replies: "ردود", like: "إعجاب",
    replyPH: "اكتبي رد...", replyBtn: "رد",
    s1: "طفلي ينام كثير هل هذا طبيعي؟", s2: "كم مرة لازم أرضع طفلي حديث الولادة؟",
    s3: "طفلي عنده طفح أحمر وحرارة خفيفة", s4: "طفلي يبكي كثير بالليل ما أعرف السبب",
    s1L: "النوم", s2L: "الرضاعة", s3L: "طفح+حرارة", s4L: "البكاء",
  },
  en: {
    appName: "Olfah", splash: "Ask. Know. Connect.",
    onboardTitle: "Welcome to Olfah", onboardSub: "Tell us about your little one", onboardHelp: "This helps us give the right advice",
    ageLabel: "Baby's age", ages: ["Newborn (0-4 weeks)", "1-3 months", "3-6 months", "6-12 months"],
    langLabel: "Language", start: "Get Started",
    howHelp: "What's on your mind?",
    askTitle: "Ask Olfah", askSub: "Instant answers to any baby care question",
    home: "Home", chat: "Ask", community: "Community", journal: "Journal", profile: "Profile",
    findDoc: "Pediatrician", docSub: "Connect now", comLabel: "Mom Community", comSub: "Join groups",
    trackerLabel: "Daily Check-in", trackerSub: "Log your day", nearLabel: "Nearby Moms", nearSub: "3 near you",
    todayLog: "Today's Log", noLog: "No check-in yet, log your day", logDone: "Today's check-in done ✓",
    feeds: "feeds", diapers: "diapers", sleepH: "hrs sleep", yourMood: "Mood",
    aiName: "Olfah AI", online: "Online",
    aiWelcome: "Hi! I'm Olfah. Ask me anything about your baby, feeding, sleep, development, whatever's worrying you. I'll give you a straight answer, and connect you to a pediatrician when it matters.",
    typePH: "Type your question...", thinking: "Olfah is thinking",
    escalateMsg: "⚠️ This may need a pediatrician's evaluation.",
    connectDoc: "Connect to Pediatrician Now",
    docTitle: "Pediatrician Connect", finding: "Finding an available pediatrician...", sharing: "Sharing your conversation with Olfah",
    drName: "Dr. Sara Al-Mahmoud", drSpec: "Pediatrician · Sidra Medicine", drAvail: "Available now", drConnected: "Connected",
    drHas: "Dr. Sara has received your conversation summary",
    drMsg: "Hi, I'm Dr. Sara. I've reviewed what you shared with Olfah. What would you like to talk through?",
    drSees: "Dr. Sara can see your baby's feeding and sleep logs from Olfah",
    replyDoc: "Reply to Dr. Sara...", avgTime: "Average connection time: under 3 minutes",
    bookAppt: "Book Appointment", bookConfirm: "Appointment Booked ✓", bookSub: "Tomorrow at 10:00 AM with Dr. Sara",
    jTitle: "Daily Check-in", jSub: "How are you and your baby today?", jSave: "Save Check-in", jSkip: "Skip",
    jMood: "How are you feeling today?", jMoods: ["😫", "😔", "😐", "🙂", "😊"], jMoodL: ["Exhausted", "Tired", "Okay", "Good", "Great"],
    jSleep: "How much did you sleep?", jSleepU: "hours",
    jNightWakes: "How often did baby wake you?",
    jWakeOpts: ["Slept through 😴", "1–2 times 🌙", "3–4 times 🌒", "5+ times 😵"],
    jFeedType: "How is your baby feeding?",
    jFeedTypes: ["Breastfed", "Formula", "Both", "Pumped"],
    jFeedIcons: ["🤱", "🍼", "🔄", "🥛"],
    jFeeds: "How many feeds today?", jFeedsU: "feeds",
    jFeedIssueLabel: "Any feeding concerns?",
    jFeedIssueItems: ["Latching issues", "Refusing feeds", "Cluster feeding", "Very gassy", "Pumping issues"],
    jBabyMood: "How is your baby today?", jBMoods: ["😭", "😣", "😐", "😄", "😴"], jBMoodL: ["Very fussy", "Unsettled", "Normal", "Happy", "Calm"],
    jSymptomLabel: "Anything to flag today?",
    jSymptomItems: ["Fever", "Fussy 3h+", "Skin rash", "Unusual stool", "Very sleepy", "Vomiting", "Not eating well"],
    jSupportLabel: "Do you have support at home today?",
    jSupportOpts: ["Yes, someone's helping", "Sometimes", "On my own today"],
    jWellbeingPH: "A worry, a win, or just how you're feeling...",
    jStepNames: ["How are you?", "Your sleep", "Feeding", "Baby today", "Just you"],
    jStepSubs: ["Be honest with yourself", "Your rest matters too", "Log what you can", "How was your little one?", "Anything on your mind?"],
    jStepIcons: ["🌸", "🌙", "🍼", "👶", "💙"],
    jContinue: "Continue", jBack: "Back",
    jSaved: "Your daily check-in is saved", jStreak: "5-day streak! 🔥",
    comTitle: "Mom Community", comTabs: ["All", "My Stage", "Sleep", "Feeding", "Nearby"],
    writePost: "Share your experience or ask a question...", postBtn: "Post", replies: "replies", like: "Like",
    replyPH: "Write a reply...", replyBtn: "Reply",
    s1: "My baby sleeps a lot, is this normal?", s2: "How often should I feed my newborn?",
    s3: "My baby has a red rash and mild fever", s4: "My baby cries a lot at night, I don't know why",
    s1L: "Sleep", s2L: "Feeding", s3L: "Rash+Fever", s4L: "Crying",
  },
};

const DEFAULT_POSTS = {
  ar: [
    {
      id: "d1", name: "نورة المنصور", badge: "1-3 أشهر", time: "منذ 14 دقيقة",
      text: "الساعة 3 الفجر وطفلتي ما تنام إلا وأنا ماسكتها. لحظة ما أحطها تبكي. جربت كل شيء. قوليلي هذا يخلص 😭",
      likes: 23,
      replies: [
        { name: "فاطمة ع.", text: "والله مريت بنفس الشيء. عمرها 4 أشهر الحين وبدأت تنام لحالها. صبري قليل بعد 💙", time: "منذ 8 دقائق" },
        { name: "سارة م.", text: "جربي الـ swaddle محكم وصوت أبيض, غيّرت حياتي تماماً", time: "منذ 5 دقائق" },
      ],
    },
    {
      id: "d2", name: "هنا الأحمد", badge: "حديث الولادة", time: "منذ ساعتين",
      text: "اليوم الثاني عشر بعد الولادة. أحب طفلي بس بكيت ساعتين ما أدري ليش. هل هذا طبيعي ولا أحتاج أكلم أحد؟",
      likes: 47,
      replies: [
        { name: "مريم ت.", text: "طبيعي جداً، اسمه baby blues. بس لو استمر أكثر من أسبوعين كلمي دكتورتك, ما في ضعف في هذا 💙", time: "منذ ساعة" },
      ],
    },
    {
      id: "d3", name: "مريم التميمي", badge: "3-6 أشهر", time: "منذ 3 ساعات",
      text: "طفلتي ضحكت اليوم لأول مرة وهي تشوف المروحة تدور. بكيت من الفرحة 🥹 هذه اللحظات تنسيك كل الإرهاق",
      likes: 89,
      replies: [],
    },
    {
      id: "d4", name: "ليلى الكواري", badge: "حديث الولادة", time: "منذ 5 ساعات",
      text: "استأجرت ممرضة ليلية 3 ليالي. أول نوم صحيح بعد 7 أسابيع. ما في أي ذنب في هذا, بالعكس أنصح الكل 😅",
      likes: 34,
      replies: [
        { name: "نورة م.", text: "وين لقيتيها؟! أبي رقمها جداً 🙏", time: "منذ 4 ساعات" },
      ],
    },
  ],
  en: [
    {
      id: "d1", name: "Rachel B.", badge: "1-3 months", time: "14 min ago",
      text: "3am and she won't sleep unless I'm holding her. The second I put her down she screams. My arms are done. Tell me this ends? 😭",
      likes: 23,
      replies: [
        { name: "Fatima K.", text: "My girl did this until 4 months then just... stopped. You're so close, I promise 💙", time: "8 min ago" },
        { name: "Sara M.", text: "Tight swaddle + white noise changed everything for us. Absolute game changer.", time: "5 min ago" },
      ],
    },
    {
      id: "d2", name: "Hana A.", badge: "Newborn", time: "2h ago",
      text: "Day 12 postpartum. I love my baby so much but I cried for two hours and I don't even know why. Normal or should I talk to someone?",
      likes: 47,
      replies: [
        { name: "Maryam T.", text: "Totally normal, it's called baby blues. If it's still this intense after 2 weeks, mention it to your OB. Nothing to push through alone 💙", time: "1h ago" },
      ],
    },
    {
      id: "d3", name: "Maryam T.", badge: "3-6 months", time: "3h ago",
      text: "My baby laughed for the first time today watching the ceiling fan spin. I actually sobbed. These moments make the 3am feeds worth it 🥹",
      likes: 89,
      replies: [],
    },
    {
      id: "d4", name: "Leila M.", badge: "Newborn", time: "5h ago",
      text: "Hired a night nanny for 3 nights. First real sleep in 7 weeks. Zero shame, 10/10 recommend. You cannot pour from an empty cup.",
      likes: 34,
      replies: [
        { name: "Rachel B.", text: "Where did you find her?? I need this desperately 🙏", time: "4h ago" },
      ],
    },
  ],
};

const IC = {
  home: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  chat: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  users: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  cal: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  user: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  star: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z" /><path d="M19 15l1.04 3.13L23.18 19l-3.14.87L19 23l-1.04-3.13L14.82 19l3.14-.87z" opacity=".6" /></svg>,
  steth: (c, s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>,
  pin: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  doc: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>,
  cam: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  vid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="23 7 16 12 23 17" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
  heart: (c, filled) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  plus: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>,
  back: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e2d3d" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
};

const S = { SPLASH: 0, ONBOARD: 1, HOME: 2, CHAT: 3, DOC: 4, COMMUNITY: 5, JOURNAL: 6 };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html, body, #root { height:100%; }
input,textarea,button { font-family:inherit; }
input::placeholder,textarea::placeholder { color:#99aab5; }
::-webkit-scrollbar { display:none; }
button { cursor:pointer; }
button:not([disabled]) { transition: transform .12s ease, opacity .12s ease; }
button:not([disabled]):active { transform: scale(0.95); opacity: 0.85; }
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes screenIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
@keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:.35; } 30% { transform:translateY(-4px); opacity:1; } }
@keyframes onlinePulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
@keyframes chipIn { from { opacity:0; transform:translateY(4px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
.fade-up { animation: fadeUp .35s cubic-bezier(0.25,0.46,0.45,0.94) both; }
.screen-in { animation: screenIn .22s cubic-bezier(0.25,0.46,0.45,0.94) both; }
.chip-in { animation: chipIn .2s ease both; }
.online-dot { animation: onlinePulse 2s ease-in-out infinite; }
`;

export default function Olfah() {
  const [scr, setScr] = useState(S.SPLASH);
  const [lang, setLang] = useState("ar");
  const [age, setAge] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [esc, setEsc] = useState(false);
  const [docSt, setDocSt] = useState(0);
  const [booked, setBooked] = useState(false);
  const [jStep, setJStep] = useState(0);
  const [jData, setJData] = useState({ mood: -1, sleep: 5, nightWakes: -1, feedType: "", feeds: 6, feedIssues: [], bmood: -1, symptoms: [], diapers: 5, support: -1, notes: "" });
  const [jDone, setJDone] = useState(false);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [newPost, setNewPost] = useState("");
  const [replyText, setReplyText] = useState({});
  const [openReply, setOpenReply] = useState(null);
  const [chatHist, setChatHist] = useState([]);
  const endRef = useRef(null);
  const inRef = useRef(null);

  const t = T[lang];
  const rtl = lang === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const ff = rtl ? "'Noto Sans Arabic',sans-serif" : "'Plus Jakarta Sans',sans-serif";

  useEffect(() => {
    const savedLang = load("olfah-lang", null);
    const savedAge = load("olfah-age", null);
    const savedJournal = load("olfah-journal", null);
    const savedJDone = load("olfah-jdone", false);
    const savedPosts = load("olfah-posts", null);
    const savedChat = load("olfah-chat", []);
    const savedLiked = load("olfah-liked", {});
    if (savedLang) setLang(savedLang);
    if (savedAge) { setAge(savedAge); setScr(S.HOME); }
    if (savedJournal) setJData(savedJournal);
    if (savedJDone) setJDone(true);
    if (savedChat.length) setChatHist(savedChat);
    setLikedPosts(savedLiked);
    setPosts(savedPosts || DEFAULT_POSTS[savedLang || "ar"]);
  }, []);

  useEffect(() => {
    const savedPosts = load("olfah-posts", null);
    if (!savedPosts) setPosts(DEFAULT_POSTS[lang]);
  }, [lang]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading, esc, suggestions]);

  useEffect(() => {
    if (scr === S.SPLASH) {
      const t = setTimeout(() => setScr(S.ONBOARD), 2200);
      return () => clearTimeout(t);
    }
  }, [scr]);

  useEffect(() => {
    if (scr === S.DOC) {
      setDocSt(0); setBooked(false);
      const a = setTimeout(() => setDocSt(1), 1800);
      const b = setTimeout(() => setDocSt(2), 3200);
      const c = setTimeout(() => setDocSt(3), 4600);
      return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
    }
  }, [scr]);

  const saveOnboard = (a, l) => { store("olfah-age", a); store("olfah-lang", l); setScr(S.HOME); };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    setSuggestions([]);
    const userMsg = { from: "user", text: text.trim(), ts: Date.now() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs); setInput(""); setLoading(true); setEsc(false);
    const jCtx = jDone ? buildJournalContext(jData, lang) : "";
    const res = await askAI(newMsgs, age, lang, jCtx);
    const aiMsg = { from: "ai", text: res.text, ts: Date.now() };
    const final = [...newMsgs, aiMsg];
    setMsgs(final); setLoading(false);
    if (res.escalate) setTimeout(() => setEsc(true), 600);
    else setTimeout(() => setSuggestions(getSuggestions(res.text, lang)), 400);
    const hist = [...chatHist, ...final.slice(-2)];
    setChatHist(hist);
    store("olfah-chat", hist.slice(-20));
  };

  const saveJournal = () => { setJDone(true); store("olfah-journal", jData); store("olfah-jdone", true); };

  const addPost = () => {
    if (!newPost.trim()) return;
    const p = { id: "u" + Date.now(), name: lang === "ar" ? "أنتِ" : "You", badge: age || "", time: lang === "ar" ? "الآن" : "Just now", text: newPost.trim(), likes: 0, replies: [] };
    const updated = [p, ...posts];
    setPosts(updated); setNewPost(""); store("olfah-posts", updated);
  };

  const addReply = (postId) => {
    const txt = replyText[postId];
    if (!txt?.trim()) return;
    const updated = posts.map(p => p.id === postId ? { ...p, replies: [...p.replies, { name: lang === "ar" ? "أنتِ" : "You", text: txt.trim(), time: lang === "ar" ? "الآن" : "Just now" }] } : p);
    setPosts(updated); setReplyText(r => ({ ...r, [postId]: "" })); setOpenReply(null); store("olfah-posts", updated);
  };

  const likePost = (postId) => {
    if (likedPosts[postId]) return;
    const updated = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
    const newLiked = { ...likedPosts, [postId]: true };
    setPosts(updated); setLikedPosts(newLiked); store("olfah-posts", updated); store("olfah-liked", newLiked);
  };

  const goChat = () => { setScr(S.CHAT); setMsgs([]); setSuggestions([]); setEsc(false); setTimeout(() => inRef.current?.focus(), 300); };
  const goHome = () => setScr(S.HOME);

  const Nav = ({ active }) => (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 env(safe-area-inset-bottom,16px)", borderTop: "1px solid #e4ecf2", background: "white", position: "sticky", bottom: 0, zIndex: 10 }}>
      {[
        { icon: IC.home, label: t.home, key: "home", action: goHome },
        { icon: IC.chat, label: t.chat, key: "chat", action: goChat },
        { icon: IC.users, label: t.community, key: "community", action: () => setScr(S.COMMUNITY) },
        { icon: IC.cal, label: t.journal, key: "journal", action: () => { setJStep(0); setScr(S.JOURNAL); } },
        { icon: IC.user, label: t.profile, key: "profile", action: () => {} },
      ].map(tab => (
        <button key={tab.key} onClick={tab.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", padding: "4px 8px" }}>
          {tab.icon(active === tab.key ? P : "#99aab5")}
          <span style={{ fontSize: 10, fontWeight: active === tab.key ? 700 : 400, color: active === tab.key ? P : "#99aab5", fontFamily: ff }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const Header = ({ title, onBack }) => (
    <div style={{ padding: "16px 20px", background: "white", borderBottom: "1px solid #e4ecf2", display: "flex", alignItems: "center", gap: 12 }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", padding: 0 }}>{IC.back}</button>}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d3d", fontFamily: ff }}>{title}</div>
    </div>
  );

  const Btn = ({ children, onClick, variant = "primary", full, disabled, style: s }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "14px 24px", borderRadius: 14, border: variant === "outline" ? `2px solid ${P}` : "none",
      background: disabled ? "#d0dce5" : variant === "primary" ? PG : "white",
      color: variant === "primary" ? "white" : P, fontSize: 14, fontWeight: 600,
      cursor: disabled ? "default" : "pointer", width: full ? "100%" : "auto", fontFamily: ff,
      boxShadow: variant === "primary" && !disabled ? "0 4px 16px rgba(91,164,207,.3)" : "none",
      transition: "all .2s", ...s,
    }}>{children}</button>
  );

  // ─── SPLASH ───
  if (scr === S.SPLASH) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#A7D5EC,#5BA4CF 40%,#3D8AB8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: ff }}>
      <style>{css}</style>
      <div className="fade-up" style={{ position: "relative", width: 88, height: 88, borderRadius: 22, background: "rgba(255,255,255,.95)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,.12)", marginBottom: 20 }}>
        {IC.heart(PD)}
        <div style={{ position: "absolute" }}>{IC.steth(PD, 32)}</div>
      </div>
      <div className="fade-up" style={{ fontSize: 38, fontWeight: 700, color: "white", animationDelay: ".1s" }}>Olfah</div>
      <div className="fade-up" style={{ fontSize: 20, color: "rgba(255,255,255,.9)", marginTop: 4, animationDelay: ".2s", fontFamily: "'Noto Sans Arabic',sans-serif" }}>ألفة</div>
      <div className="fade-up" style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 20, animationDelay: ".3s" }}>{T[lang].splash}</div>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", marginTop: 40, animation: "spin 1s linear infinite" }} />
    </div>
  );

  // ─── ONBOARDING ───
  if (scr === S.ONBOARD) return (
    <div className="screen-in" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", padding: "40px 24px 30px", direction: dir, fontFamily: ff }}>
      <style>{css}</style>
      <div style={{ fontSize: 13, color: P, fontWeight: 600, marginBottom: 6 }}>{t.onboardTitle}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#1e2d3d", lineHeight: 1.4, marginBottom: 6 }}>{t.onboardSub} 💛</div>
      <div style={{ fontSize: 14, color: "#7a8d9e", marginBottom: 30 }}>{t.onboardHelp}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#3d5a73", marginBottom: 10 }}>{t.langLabel}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {[{ l: "ar", label: "العربية" }, { l: "en", label: "English" }].map(({ l, label }) => (
          <button key={l} onClick={() => setLang(l)} style={{ padding: "10px 22px", borderRadius: 22, border: lang === l ? `2px solid ${P}` : "2px solid #d0dce5", background: lang === l ? PL : "white", color: lang === l ? PD : "#3d5a73", fontSize: 13, fontWeight: lang === l ? 600 : 400, fontFamily: ff }}>{label}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#3d5a73", marginBottom: 10 }}>{t.ageLabel}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {t.ages.map(a => (
          <button key={a} onClick={() => setAge(a)} style={{ padding: "10px 18px", borderRadius: 22, border: age === a ? `2px solid ${P}` : "2px solid #d0dce5", background: age === a ? PL : "white", color: age === a ? PD : "#3d5a73", fontSize: 13, fontWeight: age === a ? 600 : 400, fontFamily: ff, transition: "all .15s" }}>{a}</button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <Btn full onClick={() => age && saveOnboard(age, lang)} disabled={!age}>{t.start}</Btn>
    </div>
  );

  // ─── HOME ───
  if (scr === S.HOME) return (
    <div className="screen-in" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", direction: dir, fontFamily: ff }}>
      <style>{css}</style>
      <div style={{ padding: "24px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, color: "#7a8d9e" }}>{getGreeting(lang)} 👋</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1e2d3d", marginTop: 4 }}>{t.howHelp}</div>
        </div>
        <button onClick={() => { const nl = lang === "ar" ? "en" : "ar"; setLang(nl); store("olfah-lang", nl); }} style={{ padding: "5px 12px", borderRadius: 16, border: `1.5px solid ${P}`, background: "white", color: P, fontSize: 11, fontWeight: 600 }}>{lang === "ar" ? "EN" : "ع"}</button>
      </div>

      {!jDone && (
        <div onClick={() => { setJStep(0); setScr(S.JOURNAL); }} className="fade-up" style={{ margin: "0 18px 14px", padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg,#EDF5FA,#D6E8F3)", border: `1.5px solid ${P}33`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: PG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{IC.doc("white")}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d3d" }}>{t.jTitle}</div>
            <div style={{ fontSize: 11, color: "#7a8d9e", marginTop: 2 }}>{t.jSub}</div>
          </div>
          <span style={{ color: P, fontSize: 18 }}>{rtl ? "←" : "→"}</span>
        </div>
      )}

      <div onClick={goChat} className="fade-up" style={{ margin: "0 18px 14px", background: PG, borderRadius: 20, padding: "22px", color: "white", position: "relative", overflow: "hidden", cursor: "pointer", boxShadow: "0 8px 30px rgba(91,164,207,.35)", animationDelay: ".05s" }}>
        <div style={{ position: "absolute", top: -30, [rtl ? "left" : "right"]: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
        <div style={{ position: "absolute", bottom: -20, [rtl ? "right" : "left"]: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t.askTitle} ✦</div>
        <div style={{ fontSize: 12, opacity: .85, marginBottom: 14 }}>{t.askSub}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[[t.s1L, t.s1], [t.s2L, t.s2], [t.s3L, t.s3], [t.s4L, t.s4]].map(([l, q]) => (
            <button key={l} onClick={e => { e.stopPropagation(); setScr(S.CHAT); setMsgs([]); setEsc(false); setTimeout(() => send(q), 300); }} style={{ padding: "7px 13px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,.35)", background: "rgba(255,255,255,.13)", color: "white", fontSize: 10, fontWeight: 500, fontFamily: ff }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3d5a73", marginBottom: 10 }}>{t.home}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: () => <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#E3F2FD,#BBDEFB)", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.steth("#1565C0", 20)}</div>, label: t.findDoc, sub: t.docSub, action: () => setScr(S.DOC) },
            { icon: () => <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#FCE4EC,#F8BBD0)", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.users("#C2185B")}</div>, label: t.comLabel, sub: t.comSub, action: () => setScr(S.COMMUNITY) },
            { icon: () => <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#E8F5E9,#C8E6C9)", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.cal("#2E7D32")}</div>, label: t.trackerLabel, sub: t.trackerSub, action: () => { setJStep(0); setScr(S.JOURNAL); } },
            { icon: () => <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#FFF3E0,#FFE0B2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.pin("#E65100")}</div>, label: t.nearLabel, sub: t.nearSub, action: () => {} },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ background: "white", borderRadius: 14, padding: "14px", border: "1px solid #dde8f0", textAlign: rtl ? "right" : "left", fontFamily: ff }}>
              <div style={{ marginBottom: 6 }}>{item.icon()}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e2d3d" }}>{item.label}</div>
              <div style={{ fontSize: 10, color: "#7a8d9e", marginTop: 2 }}>{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3d5a73", marginBottom: 8 }}>{t.todayLog}</div>
        {jDone ? (
          <div style={{ background: "white", borderRadius: 14, padding: "14px", border: "1px solid #dde8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: OK }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: OK }}>{t.logDone}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { v: jData.feeds, l: t.feeds }, { v: jData.diapers, l: t.diapers }, { v: jData.sleep, l: t.sleepH },
                { v: jData.mood >= 0 ? t.jMoods[jData.mood] : "-", l: t.yourMood },
              ].map((x, i) => (
                <div key={i} style={{ flex: 1, background: PL, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: PD }}>{x.v}</div>
                  <div style={{ fontSize: 8, color: "#7a8d9e", marginTop: 2, fontFamily: ff }}>{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div onClick={() => { setJStep(0); setScr(S.JOURNAL); }} style={{ background: "white", borderRadius: 14, padding: "14px", border: "1.5px dashed #c0d0dd", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.plus("#7a8d9e")}</div>
            <div style={{ flex: 1, fontSize: 11, color: "#7a8d9e", fontFamily: ff }}>{t.noLog}</div>
            <span style={{ color: P }}>{rtl ? "←" : "→"}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Nav active="home" />
    </div>
  );

  // ─── CHAT ───
  if (scr === S.CHAT) return (
    <div className="screen-in" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", direction: dir, fontFamily: ff }}>
      <style>{css}</style>
      <div style={{ padding: "14px 20px", background: "white", borderBottom: "1px solid #e4ecf2", display: "flex", alignItems: "center", gap: 12, direction: "ltr", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={goHome} style={{ background: "none", border: "none", padding: 0 }}>{IC.back}</button>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: PG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{IC.star}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d3d", fontFamily: ff }}>{t.aiName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
            <div className="online-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: OK }} />
            <span style={{ fontSize: 10, color: OK, fontFamily: ff }}>{t.online}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 14px 6px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="fade-up" style={{ background: "white", borderRadius: rtl ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "12px 14px", maxWidth: "85%", border: "1px solid #e4ecf2", alignSelf: rtl ? "flex-end" : "flex-start" }}>
          <div style={{ fontSize: 13, color: "#3d5a73", lineHeight: 1.65 }}>{t.aiWelcome}</div>
        </div>

        {msgs.map((m, i) => (
          <div key={i} className="fade-up" style={{
            background: m.from === "user" ? PG : "white",
            borderRadius: m.from === "user" ? (rtl ? "4px 16px 16px 16px" : "16px 4px 16px 16px") : (rtl ? "16px 4px 16px 16px" : "4px 16px 16px 16px"),
            padding: "12px 14px", maxWidth: "85%",
            alignSelf: m.from === "user" ? (rtl ? "flex-start" : "flex-end") : (rtl ? "flex-end" : "flex-start"),
            color: m.from === "user" ? "white" : "#3d5a73", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
            border: m.from === "user" ? "none" : "1px solid #e4ecf2",
            boxShadow: m.from === "user" ? "0 2px 10px rgba(91,164,207,.25)" : "none",
          }}>{m.text}</div>
        ))}

        {loading && (
          <div style={{ background: "white", borderRadius: rtl ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "14px 16px", maxWidth: "42%", border: "1px solid #e4ecf2", display: "flex", alignItems: "center", gap: 10, alignSelf: rtl ? "flex-end" : "flex-start" }}>
            <span style={{ fontSize: 12, color: "#99aab5", fontFamily: ff }}>{t.thinking}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(d => <div key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: P, animation: `typingDot 1.2s ease ${d * 0.18}s infinite` }} />)}
            </div>
          </div>
        )}

        {suggestions.length > 0 && !loading && msgs.length > 0 && msgs[msgs.length - 1].from === "ai" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 2, alignSelf: rtl ? "flex-end" : "flex-start", maxWidth: "90%" }}>
            {suggestions.map((s, i) => (
              <button key={i} className="chip-in" onClick={() => { setSuggestions([]); send(s); }}
                style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${P}44`, background: "white", color: PD, fontSize: 12, fontFamily: ff, animationDelay: `${i * 0.06}s` }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {esc && (
          <div className="fade-up" style={{ background: "#FFF3E0", borderRadius: 14, padding: "16px", border: "1px solid #FFE0B2", maxWidth: "90%" }}>
            <div style={{ fontSize: 13, color: WARN, lineHeight: 1.6, fontWeight: 500 }}>{t.escalateMsg}</div>
            <Btn full onClick={() => setScr(S.DOC)} style={{ marginTop: 12, background: WARN, boxShadow: "0 4px 12px rgba(230,81,0,.3)" }}>{t.connectDoc}</Btn>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "10px 14px env(safe-area-inset-bottom,16px)", background: "white", borderTop: "1px solid #e4ecf2", display: "flex", gap: 8, alignItems: "center", direction: "ltr", position: "sticky", bottom: 0 }}>
        <input ref={inRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !loading) send(input); }}
          placeholder={t.typePH} disabled={loading}
          style={{ flex: 1, padding: "12px 18px", borderRadius: 24, background: PL, border: "none", outline: "none", fontSize: 14, color: "#1e2d3d", fontFamily: ff, textAlign: rtl ? "right" : "left", direction: dir }} />
        <button onClick={() => !loading && send(input)} disabled={loading || !input.trim()}
          style={{ width: 42, height: 42, borderRadius: "50%", background: input.trim() && !loading ? PG : "#d0dce5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>{IC.send}</button>
      </div>
    </div>
  );

  // ─── DOCTOR ───
  if (scr === S.DOC) return (
    <div className="screen-in" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", direction: dir, fontFamily: ff }}>
      <style>{css}</style>
      <Header title={t.docTitle} onBack={goHome} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        {docSt < 3 && (
          <div className="fade-up" key={docSt} style={{ textAlign: "center" }}>
            {docSt === 0 && <>
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid #e4ecf2`, borderTopColor: P, animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e2d3d" }}>{t.finding}</div>
              <div style={{ fontSize: 12, color: "#7a8d9e", marginTop: 8 }}>{t.sharing}</div>
            </>}
            {docSt === 1 && <>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${OK},#66BB6A)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(76,175,80,.3)" }}>{IC.steth("white", 32)}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e2d3d" }}>{t.drName}</div>
              <div style={{ fontSize: 13, color: "#7a8d9e", marginTop: 4 }}>{t.drSpec}</div>
              <div style={{ fontSize: 12, color: OK, marginTop: 8, fontWeight: 500 }}>● {t.drAvail}</div>
            </>}
            {docSt === 2 && <>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${OK},#66BB6A)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>{IC.steth("white", 32)}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e2d3d" }}>{t.drConnected} ✓</div>
              <div style={{ fontSize: 12, color: OK, marginTop: 6, fontWeight: 500 }}>{t.drHas}</div>
            </>}
          </div>
        )}
        {docSt === 3 && (
          <div className="fade-up" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", direction: "ltr" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${OK},#66BB6A)`, display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.steth("white", 18)}</div>
              <div style={{ background: "white", borderRadius: "4px 16px 16px 16px", padding: "14px", border: "1px solid #e4ecf2", flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#2E7D32", marginBottom: 6 }}>{t.drName} · {t.drSpec}</div>
                <div style={{ fontSize: 13, color: "#3d5a73", lineHeight: 1.65, direction: dir }}>{t.drMsg}</div>
              </div>
            </div>
            <div style={{ background: "#E8F5E9", borderRadius: 12, padding: "10px 14px", border: "1px solid #C8E6C9", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#2E7D32" }}>{t.drSees}</div>
            </div>
            {!booked ? (
              <Btn full onClick={() => setBooked(true)} style={{ background: `linear-gradient(135deg,${OK},#66BB6A)`, boxShadow: "0 4px 16px rgba(76,175,80,.3)" }}>{t.bookAppt}</Btn>
            ) : (
              <div className="fade-up" style={{ background: "#E8F5E9", borderRadius: 14, padding: "18px", textAlign: "center", border: "1px solid #C8E6C9" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#2E7D32" }}>{t.bookConfirm}</div>
                <div style={{ fontSize: 12, color: "#4CAF50", marginTop: 4 }}>{t.bookSub}</div>
              </div>
            )}
          </div>
        )}
      </div>
      {docSt < 3 && <div style={{ padding: "20px 28px 36px", textAlign: "center" }}><div style={{ fontSize: 11, color: "#7a8d9e" }}>{t.avgTime}</div></div>}
      {docSt === 3 && (
        <div style={{ padding: "10px 14px env(safe-area-inset-bottom,16px)", background: "white", borderTop: "1px solid #e4ecf2", display: "flex", gap: 8, direction: "ltr" }}>
          <button style={{ width: 40, height: 40, borderRadius: "50%", background: PL, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.cam(PD)}</button>
          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 24, background: PL, fontSize: 13, color: "#99aab5", textAlign: rtl ? "right" : "left", fontFamily: ff }}>{t.replyDoc}</div>
          <button style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${OK},#66BB6A)`, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.vid}</button>
        </div>
      )}
    </div>
  );

  // ─── COMMUNITY ───
  if (scr === S.COMMUNITY) return (
    <div className="screen-in" style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", direction: dir, fontFamily: ff }}>
      <style>{css}</style>
      <Header title={t.comTitle} onBack={goHome} />
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
          {t.comTabs.map((tab, i) => (
            <button key={tab} style={{ padding: "8px 16px", borderRadius: 20, whiteSpace: "nowrap", border: i === 0 ? "none" : "1px solid #d0dce5", background: i === 0 ? P : "white", color: i === 0 ? "white" : "#3d5a73", fontSize: 11, fontWeight: i === 0 ? 600 : 400, fontFamily: ff }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "4px 16px 12px" }}>
        <div style={{ background: "white", borderRadius: 14, padding: "12px", border: "1px solid #dde8f0", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: PL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{IC.user(PD)}</div>
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={t.writePost} rows={2}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, resize: "none", background: "transparent", fontFamily: ff, direction: dir, lineHeight: 1.55, color: "#1e2d3d" }} />
          {newPost.trim() && <Btn onClick={addPost} style={{ padding: "8px 16px", fontSize: 12 }}>{t.postBtn}</Btn>}
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 16px", overflowY: "auto" }}>
        {posts.map((post, pi) => (
          <div key={post.id} className="fade-up" style={{ background: "white", borderRadius: 14, padding: "14px", marginBottom: 8, border: "1px solid #dde8f0", animationDelay: `${pi * 0.04}s` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${PL},${P}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: PD }}>
                {post.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e2d3d", fontFamily: ff }}>{post.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  {post.badge && <span style={{ fontSize: 9, background: PL, color: PD, padding: "2px 8px", borderRadius: 10, fontWeight: 500, whiteSpace: "nowrap" }}>{post.badge}</span>}
                  <span style={{ fontSize: 9, color: "#b0bec5" }}>{post.time}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#2d3f4f", lineHeight: 1.65, marginBottom: 12 }}>{post.text}</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button onClick={() => likePost(post.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", fontSize: 11, color: likedPosts[post.id] ? WARN : "#7a8d9e", fontFamily: ff, fontWeight: likedPosts[post.id] ? 600 : 400 }}>
                {IC.heart(likedPosts[post.id] ? WARN : "#7a8d9e", likedPosts[post.id])} {post.likes} {t.like}
              </button>
              <button onClick={() => setOpenReply(openReply === post.id ? null : post.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", fontSize: 11, color: "#7a8d9e", fontFamily: ff }}>
                {IC.chat("#7a8d9e")} {post.replies.length} {t.replies}
              </button>
            </div>
            {post.replies.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f4f8", display: "flex", flexDirection: "column", gap: 8 }}>
                {post.replies.map((r, ri) => (
                  <div key={ri} style={{ display: "flex", gap: 8, paddingLeft: rtl ? 0 : 16, paddingRight: rtl ? 16 : 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: PL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: PD }}>{r.name.charAt(0)}</div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#1e2d3d" }}>{r.name}</span>
                      <span style={{ fontSize: 9, color: "#b0bec5", marginLeft: 6, marginRight: 6 }}>{r.time}</span>
                      <div style={{ fontSize: 12, color: "#3d5a73", marginTop: 2, lineHeight: 1.55 }}>{r.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {openReply === post.id && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <input value={replyText[post.id] || ""} onChange={e => setReplyText(r => ({ ...r, [post.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") addReply(post.id); }}
                  placeholder={t.replyPH}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #d0dce5", outline: "none", fontSize: 12, fontFamily: ff, direction: dir, background: PL, color: "#1e2d3d" }} />
                <Btn onClick={() => addReply(post.id)} style={{ padding: "8px 14px", fontSize: 11 }}>{t.replyBtn}</Btn>
              </div>
            )}
          </div>
        ))}
      </div>
      <Nav active="community" />
    </div>
  );

  // ─── JOURNAL ───
  if (scr === S.JOURNAL) {
    const STEPS = 5;
    const JBG = "#F4F8FB";
    const sleepQuality = () => {
      if (jData.sleep <= 2) return { label: lang === "ar" ? "صعب جداً 😮‍💨" : "Really rough 😮‍💨", color: WARN };
      if (jData.sleep <= 4) return { label: lang === "ar" ? "مرهقة جداً" : "Very tired", color: WARN };
      if (jData.sleep <= 6) return { label: lang === "ar" ? "قليل شوي" : "A bit short", color: "#F9A825" };
      if (jData.sleep <= 8) return { label: lang === "ar" ? "مقبول" : "Decent", color: OK };
      return { label: lang === "ar" ? "ممتاز! 🌟" : "Great! 🌟", color: OK };
    };
    const sq = sleepQuality();

    if (jDone && jStep === 0) return (
      <div className="screen-in" style={{ minHeight: "100vh", background: JBG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", direction: dir, fontFamily: ff }}>
        <style>{css}</style>
        <div className="fade-up" style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${OK},#66BB6A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "white", marginBottom: 20, boxShadow: "0 8px 28px rgba(76,175,80,.28)" }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e2d3d", marginBottom: 4 }}>{t.jSaved}</div>
        <div style={{ fontSize: 13, color: OK, fontWeight: 600, marginBottom: 24 }}>{t.jStreak}</div>
        <div style={{ background: "white", borderRadius: 18, padding: "18px 20px", marginBottom: 20, border: `1.5px solid ${P}22`, width: "100%", boxShadow: "0 2px 16px rgba(91,164,207,.1)" }}>
          <div style={{ fontSize: 13, color: "#3d5a73", lineHeight: 1.7, textAlign: "center" }}>💡 {computeInsight(jData, lang)}</div>
        </div>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { v: jData.mood >= 0 ? t.jMoods[jData.mood] : "-", l: jData.mood >= 0 ? t.jMoodL[jData.mood] : t.yourMood },
            { v: jData.sleep, l: t.jSleepU },
            { v: jData.feeds, l: t.jFeedsU },
            { v: jData.bmood >= 0 ? t.jBMoods[jData.bmood] : "-", l: jData.bmood >= 0 ? t.jBMoodL[jData.bmood] : "" },
          ].map((x, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center", border: "1px solid #dde8f0", boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: PD }}>{x.v}</div>
              <div style={{ fontSize: 10, color: "#7a8d9e", marginTop: 4, fontFamily: ff }}>{x.l}</div>
            </div>
          ))}
        </div>
        <Btn full onClick={goHome}>{t.home}</Btn>
      </div>
    );

    return (
      <div className="screen-in" style={{ minHeight: "100vh", background: JBG, display: "flex", flexDirection: "column", direction: dir, fontFamily: ff }}>
        <style>{css}</style>

        {/* Header with dot progress */}
        <div style={{ padding: "14px 20px", background: "white", borderBottom: "1px solid #e8eff4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={goHome} style={{ background: "none", border: "none", padding: 0 }}>{IC.back}</button>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} style={{ height: 6, borderRadius: 3, background: i <= jStep ? P : "#d0dce5", width: i === jStep ? 22 : 6, transition: "all .3s ease" }} />
            ))}
          </div>
          <button onClick={goHome} style={{ background: "none", border: "none", fontSize: 12, color: "#b0bec5", fontFamily: ff }}>{t.jSkip}</button>
        </div>

        {/* Step meta */}
        <div key={`meta-${jStep}`} className="fade-up" style={{ padding: "28px 26px 0", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>{t.jStepIcons[jStep]}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e2d3d", marginBottom: 5 }}>{t.jStepNames[jStep]}</div>
          <div style={{ fontSize: 13, color: "#99aab5" }}>{t.jStepSubs[jStep]}</div>
        </div>

        {/* Step content */}
        <div key={`content-${jStep}`} className="fade-up" style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>

          {/* Step 0: Your mood */}
          {jStep === 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              {t.jMoods.map((e, i) => (
                <button key={i} onClick={() => setJData(d => ({ ...d, mood: i }))} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "18px 4px", borderRadius: 20,
                  border: `2px solid ${jData.mood === i ? P : "#e4ecf2"}`,
                  background: jData.mood === i ? PL : "white",
                  boxShadow: jData.mood === i ? `0 0 0 4px ${P}28` : "0 2px 8px rgba(0,0,0,.04)",
                  transform: jData.mood === i ? "scale(1.07)" : "scale(1)",
                  transition: "all .18s", fontFamily: ff,
                }}>
                  <span style={{ fontSize: 34 }}>{e}</span>
                  <span style={{ fontSize: 9, color: jData.mood === i ? PD : "#99aab5", fontWeight: 600, textAlign: "center" }}>{t.jMoodL[i]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Sleep + night wakes */}
          {jStep === 1 && <>
            <div style={{ background: "white", borderRadius: 20, padding: "24px 20px", marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 54, fontWeight: 700, color: sq.color }}>{jData.sleep}</span>
                <span style={{ fontSize: 16, color: "#99aab5", marginLeft: 4 }}>{t.jSleepU}</span>
                <div style={{ fontSize: 13, color: sq.color, marginTop: 6, fontWeight: 500 }}>{sq.label}</div>
              </div>
              <input type="range" min="0" max="12" step=".5" value={jData.sleep}
                onChange={e => setJData(d => ({ ...d, sleep: +e.target.value }))}
                style={{ width: "100%", accentColor: P, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#c0cdd8" }}>0h</span>
                <span style={{ fontSize: 10, color: "#c0cdd8" }}>12h</span>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d5a73", marginBottom: 12 }}>{t.jNightWakes}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {t.jWakeOpts.map((opt, i) => (
                <button key={i} onClick={() => setJData(d => ({ ...d, nightWakes: i }))} style={{
                  padding: "16px 10px", borderRadius: 16, textAlign: "center",
                  border: `2px solid ${jData.nightWakes === i ? P : "#e4ecf2"}`,
                  background: jData.nightWakes === i ? PL : "white",
                  boxShadow: jData.nightWakes === i ? `0 0 0 3px ${P}25` : "0 1px 4px rgba(0,0,0,.04)",
                  fontSize: 12, fontWeight: jData.nightWakes === i ? 600 : 400,
                  color: jData.nightWakes === i ? PD : "#3d5a73",
                  transition: "all .15s", fontFamily: ff,
                }}>{opt}</button>
              ))}
            </div>
          </>}

          {/* Step 2: Feeding */}
          {jStep === 2 && <>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d5a73", marginBottom: 12 }}>{t.jFeedType}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
              {t.jFeedTypes.map((label, i) => (
                <button key={i} onClick={() => setJData(d => ({ ...d, feedType: label }))} style={{
                  padding: "16px 10px", borderRadius: 16, textAlign: "center",
                  border: `2px solid ${jData.feedType === label ? P : "#e4ecf2"}`,
                  background: jData.feedType === label ? PL : "white",
                  boxShadow: jData.feedType === label ? `0 0 0 3px ${P}25` : "0 1px 4px rgba(0,0,0,.04)",
                  transition: "all .15s", fontFamily: ff,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{t.jFeedIcons[i]}</div>
                  <div style={{ fontSize: 12, fontWeight: jData.feedType === label ? 600 : 400, color: jData.feedType === label ? PD : "#3d5a73" }}>{label}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d5a73", marginBottom: 12 }}>{t.jFeeds}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "white", borderRadius: 16, padding: "16px 20px", marginBottom: 22, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <button onClick={() => setJData(d => ({ ...d, feeds: Math.max(0, d.feeds - 1) }))} style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #d0dce5", background: "#f5f8fa", fontSize: 22, color: "#3d5a73" }}>−</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: 42, fontWeight: 700, color: PD }}>{jData.feeds}</span>
                <span style={{ fontSize: 13, color: "#99aab5", marginLeft: 6 }}>{t.jFeedsU}</span>
              </div>
              <button onClick={() => setJData(d => ({ ...d, feeds: d.feeds + 1 }))} style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #d0dce5", background: "#f5f8fa", fontSize: 22, color: "#3d5a73" }}>+</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#7a8d9e", marginBottom: 10 }}>{t.jFeedIssueLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {t.jFeedIssueItems.map((item, i) => {
                const on = jData.feedIssues?.includes(i);
                return <button key={i} onClick={() => setJData(d => ({ ...d, feedIssues: on ? d.feedIssues.filter(x => x !== i) : [...(d.feedIssues || []), i] }))}
                  style={{ padding: "9px 16px", borderRadius: 22, border: `2px solid ${on ? P : "#d0dce5"}`, background: on ? PL : "white", color: on ? PD : "#7a8d9e", fontSize: 12, fontWeight: on ? 600 : 400, fontFamily: ff, transition: "all .15s" }}>
                  {on ? "✓ " : ""}{item}
                </button>;
              })}
            </div>
          </>}

          {/* Step 3: Baby today */}
          {jStep === 3 && <>
            <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
              {t.jBMoods.map((e, i) => (
                <button key={i} onClick={() => setJData(d => ({ ...d, bmood: i }))} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "16px 4px", borderRadius: 20,
                  border: `2px solid ${jData.bmood === i ? P : "#e4ecf2"}`,
                  background: jData.bmood === i ? PL : "white",
                  boxShadow: jData.bmood === i ? `0 0 0 4px ${P}28` : "0 2px 8px rgba(0,0,0,.04)",
                  transform: jData.bmood === i ? "scale(1.07)" : "scale(1)",
                  transition: "all .18s", fontFamily: ff,
                }}>
                  <span style={{ fontSize: 30 }}>{e}</span>
                  <span style={{ fontSize: 9, color: jData.bmood === i ? PD : "#99aab5", fontWeight: 600, textAlign: "center" }}>{t.jBMoodL[i]}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#7a8d9e", marginBottom: 10 }}>{t.jSymptomLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {t.jSymptomItems.map((item, i) => {
                const on = jData.symptoms?.includes(i);
                return <button key={i} onClick={() => setJData(d => ({ ...d, symptoms: on ? d.symptoms.filter(x => x !== i) : [...(d.symptoms || []), i] }))}
                  style={{ padding: "9px 16px", borderRadius: 22, border: `2px solid ${on ? WARN : "#d0dce5"}`, background: on ? "#FFF3E0" : "white", color: on ? WARN : "#7a8d9e", fontSize: 12, fontWeight: on ? 600 : 400, fontFamily: ff, transition: "all .15s" }}>
                  {on ? "⚠ " : ""}{item}
                </button>;
              })}
            </div>
          </>}

          {/* Step 4: Wellbeing */}
          {jStep === 4 && <>
            <textarea value={jData.notes} onChange={e => setJData(d => ({ ...d, notes: e.target.value }))}
              placeholder={t.jWellbeingPH}
              style={{ width: "100%", height: 120, padding: "16px", borderRadius: 18, border: "2px solid #e4ecf2", background: "white", fontSize: 14, fontFamily: ff, direction: dir, resize: "none", outline: "none", lineHeight: 1.7, color: "#1e2d3d", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d5a73", marginBottom: 12 }}>{t.jSupportLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {t.jSupportOpts.map((opt, i) => (
                <button key={i} onClick={() => setJData(d => ({ ...d, support: i }))} style={{
                  padding: "16px 20px", borderRadius: 16, textAlign: rtl ? "right" : "left",
                  border: `2px solid ${jData.support === i ? P : "#e4ecf2"}`,
                  background: jData.support === i ? PL : "white",
                  boxShadow: jData.support === i ? `0 0 0 3px ${P}25` : "0 1px 4px rgba(0,0,0,.04)",
                  fontSize: 13, fontWeight: jData.support === i ? 600 : 400,
                  color: jData.support === i ? PD : "#3d5a73",
                  transition: "all .15s", fontFamily: ff,
                }}>
                  {jData.support === i ? "✓ " : ""}{opt}
                </button>
              ))}
            </div>
          </>}
        </div>

        {/* Navigation */}
        <div style={{ padding: "12px 22px env(safe-area-inset-bottom,20px)", background: "white", borderTop: "1px solid #e8eff4" }}>
          <Btn full onClick={() => { if (jStep < STEPS - 1) setJStep(s => s + 1); else saveJournal(); }} style={{ marginBottom: 6 }}>
            {jStep === STEPS - 1 ? t.jSave : t.jContinue}
          </Btn>
          {jStep > 0 && (
            <button onClick={() => setJStep(s => s - 1)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px", fontSize: 13, color: "#b0bec5", fontFamily: ff, textAlign: "center" }}>
              {rtl ? "→" : "←"} {t.jBack}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
