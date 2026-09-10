import { useState } from "react";
import { ChevronLeft, Scale, Cake } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

const RECORD_LABELS = ["Continuous hormonal contraception or HRT", "Period delays pills", "Pill or HRT with scheduled breaks"];

export default function HealthRecordScreen({ onNavigate }) {
  const [toggles, setToggles] = useState({
    "Continuous hormonal contraception or HRT": false,
    "Period delays pills": false,
    "Pill or HRT with scheduled breaks": true,
  });

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Health record" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 16px" }}>
          {RECORD_LABELS.map((label) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
              <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, flex: 1 }}>{label}</span>
              <Toggle on={toggles[label]} onClick={() => setToggles((prev) => ({ ...prev, [label]: !prev[label] }))} />
            </div>
          ))}
        </div>
        <SectionLabelLight>Details</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Scale size={13} /> Weight</div>
            <input placeholder="kg" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`, borderRadius: 10, padding: "9px 12px", color: C.cream2 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Cake size={13} /> Age</div>
            <input placeholder="years" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`, borderRadius: 10, padding: "9px 12px", color: C.cream2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
