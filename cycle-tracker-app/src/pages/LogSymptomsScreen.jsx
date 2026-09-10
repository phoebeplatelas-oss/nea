import { useState } from "react";
import { ChevronLeft, Settings, X, Check, Droplet, Frown, Smile, ArrowUp, ArrowDown } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import { C } from "../theme";
import { LOG_SYMPTOMS } from "../data";

const ICONS_BY_TYPE = {
  bleed: [{ k: "none", el: <X size={15} /> }, { k: "light", el: <Droplet size={13} /> }, { k: "heavy", el: <Droplet size={17} /> }],
  check: [{ k: "no", el: <X size={15} /> }, { k: "yes", el: <Check size={15} /> }],
  face: [{ k: "low", el: <Frown size={15} /> }, { k: "high", el: <Smile size={15} /> }],
  arrow: [{ k: "down", el: <ArrowDown size={15} /> }, { k: "up", el: <ArrowUp size={15} /> }],
};

const SYMPTOM_KEY = {
  Bleeding: { light: "bleedinglight", heavy: "bleedingheavy" },
  Bloating: { yes: "bloating" },
  Cramps: { yes: "cramps" },
  Diarrhea: { yes: "diarrhea" },
  "Sore breasts": { yes: "breast_soreness" },
  Skin: { low: "badskin" },
  Discharge: { up: "increased_discharge" },
  Mood: { low: "badmood" },
  "Sex drive": { up: "increased_libido" },
  Energy: { low: "lowenergy" },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function LogRow({ name, type, value, onChange }) {
  const opts = ICONS_BY_TYPE[type];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.07)",
      borderRadius: 13, padding: "10px 14px", marginBottom: 8, border: value ? `1.5px dashed ${C.gold}` : "1.5px solid transparent",
    }}>
      <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{name}</span>
      <div style={{ display: "flex", gap: 8 }}>
        {opts.map((o) => (
          <button
            key={o.k}
            onClick={() => onChange(value === o.k ? null : o.k)}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: value === o.k ? C.gold : "rgba(255,255,255,0.14)",
              color: value === o.k ? C.purpleDeep : C.cream2,
            }}
          >
            {o.el}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LogSymptomsScreen({ onNavigate, userId }) {
  const [values, setValues] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setStatus(null);
    setSaving(true);

    const symptoms = Object.entries(values)
      .map(([name, val]) => SYMPTOM_KEY[name]?.[val])
      .filter(Boolean);

    try {
      const res = await fetch("/api/log-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, date: todayISO(), symptoms }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ ok: true, message: "Saved for today." });
      } else {
        setStatus({ ok: false, message: data.error || "Something went wrong." });
      }
    } catch (err) {
      setStatus({ ok: false, message: "Couldn't reach the server — is the backend running?" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100%" }}>
      <TopBar
        left={<div style={{ width: 34 }} />}
        title={<span style={{ color: C.ink }}>Quick log symptoms</span>}
        right={<IconBtn onClick={() => onNavigate("mySymptoms")} bg="rgba(59,18,99,0.08)" color={C.ink}><Settings size={16} /></IconBtn>}
      />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, fontFamily: "Manrope, sans-serif" }}>
          Logging for today.
        </div>

        <div style={{ background: C.purpleDeep, borderRadius: 18, padding: "14px" }}>
          {LOG_SYMPTOMS.map((s) => (
            <LogRow
              key={s.name}
              name={s.name}
              type={s.type}
              value={values[s.name]}
              onChange={(v) => setValues((prev) => ({ ...prev, [s.name]: v }))}
            />
          ))}
        </div>

        {status && (
          <div style={{
            marginTop: 12, fontSize: 12.5, fontFamily: "Manrope, sans-serif", fontWeight: 600,
            color: status.ok ? "#2E7D32" : C.coral,
          }}>
            {status.message}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", marginTop: 14, background: C.gold, border: "none", borderRadius: 14, padding: "12px",
            color: C.purpleDeep, fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 14, cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save log"}
        </button>
      </div>
    </div>
  );
}