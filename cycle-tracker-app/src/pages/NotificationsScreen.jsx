import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import Field from "../components/Field";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

const REMINDER_LABELS = ["Medication reminder", "Logging reminder", "Appointment reminder", "Period warning", "Fertility window"];

export default function NotificationsScreen({ onNavigate }) {
  const [toggles, setToggles] = useState(
    Object.fromEntries(REMINDER_LABELS.map((label) => [label, true]))
  );

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Notifications" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 16px" }}>
          {REMINDER_LABELS.map((label) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{label}</span>
              <Toggle on={toggles[label]} onClick={() => setToggles((prev) => ({ ...prev, [label]: !prev[label] }))} />
            </div>
          ))}
        </div>
        <SectionLabelLight>In the loop</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 10 }}>Send a cycle reminder to someone you trust.</div>
          <Field label="Enter phone number" placeholder="07…" />
          <button style={{
            width: "100%", background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}`,
            borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer",
          }}>
            Stop sharing
          </button>
        </div>
      </div>
    </div>
  );
}
