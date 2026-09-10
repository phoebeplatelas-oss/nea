import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import { C } from "../theme";
import { STAGES } from "../data";

export default function StageScreen({ onNavigate }) {
  // Which card is picked — just for the click-through, not wired to anything else.
  const [selected, setSelected] = useState("Menstruating");

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="My stage" right={<div />} />
      <div style={{ padding: "10px 20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            style={{
              background: selected === s ? C.gold : "rgba(255,255,255,0.07)",
              color: selected === s ? C.purpleDeep : C.cream2,
              border: `1.5px solid ${selected === s ? C.gold : C.purpleLine}`,
              borderRadius: 16, padding: "22px 10px", fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
