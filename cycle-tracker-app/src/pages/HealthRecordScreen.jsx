import { useEffect, useState } from "react";
import { ChevronLeft, Cake } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

export default function HealthRecordScreen({ onNavigate, userId }) {
  const [continuousHRT, setContinuousHRT] = useState(false);
  const [continuousContraception, setContinuousContraception] = useState(false);
  const [pillScheduledBreaks, setPillScheduledBreaks] = useState(false);
  const [periodDelayPills, setPeriodDelayPills] = useState(false);
  const [age, setAge] = useState("");
  const [ageSaved, setAgeSaved] = useState(true);

  useEffect(() => {
    fetch(`/api/continuous-hrt/${userId}`)
      .then((res) => res.json())
      .then((data) => setContinuousHRT(!!data.enabled))
      .catch((err) => console.error("Continuous HRT fetch failed:", err));

    fetch(`/api/continuous-contraception/${userId}`)
      .then((res) => res.json())
      .then((data) => setContinuousContraception(!!data.enabled))
      .catch((err) => console.error("Continuous contraception fetch failed:", err));

    fetch(`/api/pill-scheduled-breaks/${userId}`)
      .then((res) => res.json())
      .then((data) => setPillScheduledBreaks(!!data.enabled))
      .catch((err) => console.error("Pill scheduled breaks fetch failed:", err));

    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => setAge(data.age != null ? String(data.age) : ""))
      .catch((err) => console.error("Profile fetch failed:", err));
  }, [userId]);

  const toggleFlag = async (current, setter, endpoint) => {
    const next = !current;
    setter(next);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, enabled: next }),
      });
      const data = await res.json();
      if (!data.success) setter(!next);
    } catch (err) {
      setter(!next);
    }
  };

  const saveAge = async () => {
    const numeric = age === "" ? null : Number(age);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, age: numeric }),
      });
      const data = await res.json();
      setAgeSaved(!!data.success);
    } catch (err) {
      setAgeSaved(false);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Health record" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Continuous combined HRT</span>
            <Toggle on={continuousHRT} onClick={() => toggleFlag(continuousHRT, setContinuousHRT, "/api/continuous-hrt")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Continuous hormonal contraception</span>
            <Toggle on={continuousContraception} onClick={() => toggleFlag(continuousContraception, setContinuousContraception, "/api/continuous-contraception")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Pill or HRT with scheduled breaks</span>
            <Toggle on={pillScheduledBreaks} onClick={() => toggleFlag(pillScheduledBreaks, setPillScheduledBreaks, "/api/pill-scheduled-breaks")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Period delays pills</span>
            <Toggle on={periodDelayPills} onClick={() => setPeriodDelayPills((p) => !p)} />
          </div>
        </div>
        <SectionLabelLight>Details</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Cake size={13} /> Age</div>
          <input
            placeholder="years"
            value={age}
            onChange={(e) => { setAge(e.target.value.replace(/\D/g, "")); setAgeSaved(false); }}
            onBlur={saveAge}
            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`, borderRadius: 10, padding: "9px 12px", color: C.cream2 }}
          />
          {!ageSaved && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>Saving…</div>}
        </div>
      </div>
    </div>
  );
}