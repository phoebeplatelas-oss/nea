import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { C } from "../theme";
import { MY_SYMPTOMS } from "../data";

export default function MySymptomsScreen({ onNavigate }) {
  // Every symptom starts "on" — tapping just flips it, nothing else reacts to it.
  const [on, setOn] = useState({});

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")} bg="rgba(59,18,99,0.08)" color={C.ink}><ChevronLeft size={18} /></IconBtn>} title={<span style={{ color: C.ink }}>My symptoms</span>} right={<div />} />
      <div style={{ padding: "10px 20px 24px" }}>
        <div style={{ background: C.purpleDeep, borderRadius: 18, padding: "6px 16px" }}>
          {MY_SYMPTOMS.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: C.cream2, fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{s}</span>
              <Toggle on={on[s] !== false} onClick={() => setOn((prev) => ({ ...prev, [s]: prev[s] === false ? true : false }))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
