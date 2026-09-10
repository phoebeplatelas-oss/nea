import { useEffect, useState } from "react";
import { ChevronLeft, Cake } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

export default function HealthRecordScreen({ onNavigate, userId }) {
  const [continuousHRT, setContinuousHRT] = useState(false);
  const [periodDelayPills, setPeriodDelayPills] = useState(false);
  const [scheduledBreaks, setScheduledBreaks] = useState(true);

  useEffect(() => {
    fetch(`/api/continuous-hrt/${userId}`)
      .then((res) => res.json())
      .then((data) => setContinuousHRT(!!data.enabled))
      .catch((err) => console.error("Continuous HRT fetch failed:", err));
  }, [userId]);

  const toggleContinuousHRT = async () => {
    const next = !continuousHRT;
    setContinuousHRT(next);
    try {
      const res = await fetch("/api/continuous-hrt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, enabled: next }),
      });
      const data = await res.json();
      if (!data.success) setContinuousHRT(!next);
    } catch (err) {
      setContinuousHRT(!next);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Health record" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Continuous combined HRT</span>
            <Toggle on={continuousHRT} onClick={toggleContinuousHRT} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Period delays pills</span>
            <Toggle on={periodDelayPills} onClick={() => setPeriodDelayPills((p) => !p)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", gap: 10 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>Pill or HRT with scheduled breaks</span>
            <Toggle on={scheduledBreaks} onClick={() => setScheduledBreaks((p) => !p)} />
          </div>
        </div>
        <SectionLabelLight>Details</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Cake size={13} /> Age</div>
          <input placeholder="years" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`, borderRadius: 10, padding: "9px 12px", color: C.cream2 }} />
        </div>
      </div>
    </div>
  );
}