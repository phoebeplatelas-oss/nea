import { C } from "./theme";

export const STAGES = [
  "Prepubescent", "Menstruating", "Fertility",
  "Pregnancy", "Perimenopause", "Postmenopause",
];

export const PROFILE_ITEMS = [
  { key: "privacy", label: "Privacy" },
  { key: "appointments", label: "Appointments" },
  { key: "symptoms", label: "Symptom settings" },
  { key: "stage", label: "My stage" },
  { key: "notifications", label: "Notifications" },
  { key: "loop", label: "In the loop" },
  { key: "medication", label: "Medication" },
];

// Each row already says which icon-set it uses ("bleed" / "check" / "face" / "arrow") —
// no logic decides this, it's just written down per symptom.
export const LOG_SYMPTOMS = [
  { name: "Bleeding", type: "bleed" },
  { name: "Bloating", type: "check" },
  { name: "Cramps", type: "check" },
  { name: "Diarrhea", type: "check" },
  { name: "Sore breasts", type: "check" },
  { name: "Skin", type: "face" },
  { name: "Discharge", type: "arrow" },
  { name: "Mood", type: "face" },
  { name: "Sex drive", type: "arrow" },
  { name: "Energy", type: "face" },
  { name: "Taken pill", type: "check" },
  { name: "Unprotected sex", type: "check" },
];

export const MY_SYMPTOMS = [
  "Bleeding", "Bloating", "Cramps", "Diarrhea", "Sore breasts",
  "Skin", "Discharge", "Mood", "Sex drive", "Energy", "Unprotected sex"
];

export const ARTICLE_CATS = ["Period", "Menopause", "Sexual health", "Perimenopause"];
export const ARTICLE_SECTIONS = ["For you", "Your body", "Hormone cycles", "Sexual health"];

export const CYCLE_DATA = [
  { name: "Menstruating", value: 7, color: C.coral },
  { name: "Follicular", value: 11, color: C.purpleLine },
  { name: "Ovulating", value: 2, color: C.gold },
  { name: "Luteal", value: 9, color: C.purpleMid },
];

export const SYMPTOM_DATA = [
  { name: "Spotting", value: 4, color: C.coral },
  { name: "Cramps", value: 4, color: C.purpleLine },
  { name: "Mood swings", value: 4, color: C.blue },
  { name: "High sex drive", value: 5, color: C.gold },
  { name: "Productive", value: 7, color: "#8CC28C" },
  { name: "Low energy", value: 4, color: C.inkSoft },
];

// Every calendar day is just written out with its phase already decided —
// nothing is calculated at render time. Edit these values to restyle any day.
export const PHASE_COLOR = {
  menstruation: C.coral,
  follicular: C.purpleLine,
  ovulation: C.gold,
  luteal: C.purpleMid,
};

export const CALENDAR_DAYS = [
  ...Array.from({ length: 6 }, (_, i) => ({ day: i + 1, phase: "menstruation" })),
  ...Array.from({ length: 6 }, (_, i) => ({ day: i + 7, phase: "follicular" })),
  ...Array.from({ length: 4 }, (_, i) => ({ day: i + 13, phase: "ovulation" })),
  ...Array.from({ length: 15 }, (_, i) => ({ day: i + 17, phase: "luteal" })),
];
// (This produces the same fixed 31-day pattern as before — it's just data now,
// written with Array.from for brevity instead of a function that decides phases.)

export const TODAY = 16;
export const STREAK = 13;
