import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { C } from "../theme";
import { MY_SYMPTOMS } from "../data";

export default function MySymptomsScreen({ onNavigate, userId }) {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/symptom-settings/${userId}`)
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch((err) => console.error("Symptom settings fetch failed:", err))
      .finally(() => setLoaded(true));
  }, [userId]);

  const toggle = async (name) => {
    const next = settings[name] === false ? true : false;
    setSettings((prev) => ({ ...prev, [name]: next }));
    try {
      const res = await fetch("/api/symptom-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, symptom: name, enabled: next }),
      });
      const data = await res.json();
      if (!data.success) setSettings((prev) => ({ ...prev, [name]: !next }));
    } catch (err) {
      setSettings((prev) => ({ ...prev, [name]: !next }));
    }
  };

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")} bg="rgba(59,18,99,0.08)" color={C.ink}><ChevronLeft size={18} /></IconBtn>} title={<span style={{ color: C.ink }}>My symptoms</span>} right={<div />} />
      <div style={{ padding: "10px 20px 24px" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, fontFamily: "Manrope, sans-serif" }}>
          Turn a symptom off to hide it from Quick log.
        </div>
        <div style={{ background: C.purpleDeep, borderRadius: 18, padding: "6px 16px" }}>
          {MY_SYMPTOMS.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: C.cream2, fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{s}</span>
              <Toggle on={loaded ? settings[s] !== false : true} onClick={() => toggle(s)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}