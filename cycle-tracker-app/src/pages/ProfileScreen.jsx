import { Home, Star, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import { C } from "../theme";
import { PROFILE_ITEMS } from "../data";

// Where each menu row should navigate to. A plain lookup table, not logic.
const DESTINATIONS = {
  privacy: "profile",
  appointments: "appointments",
  symptoms: "mySymptoms",
  stage: "stage",
  notifications: "notifications",
  loop: "notifications",
  medication: "healthRecord",
};

export default function ProfileScreen({ onNavigate }) {
  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100%" }}>
      <TopBar
        left={<IconBtn onClick={() => onNavigate("home")} bg="rgba(59,18,99,0.08)" color={C.ink}><Home size={16} /></IconBtn>}
        title={<span style={{ color: C.ink }}>Profile</span>}
        right={<IconBtn bg="transparent"><Star size={20} color={C.gold} fill={C.gold} /></IconBtn>}
      />
      <div style={{ padding: "10px 20px 24px" }}>
        {PROFILE_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onNavigate(DESTINATIONS[key])}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "transparent", border: "none", borderBottom: `1px solid ${C.creamLine}`,
              padding: "13px 2px", cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14.5, color: C.purpleMid }}>{label}</span>
            <ChevronRight size={16} color={C.inkSoft} />
          </button>
        ))}
      </div>
    </div>
  );
}
