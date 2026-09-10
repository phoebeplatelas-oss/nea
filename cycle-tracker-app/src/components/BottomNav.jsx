import { Home, CalendarDays, Search, Star } from "lucide-react";
import { C } from "../theme";

const ITEMS = [
  { key: "home", icon: Home, label: "Home" },
  { key: "data", icon: CalendarDays, label: "Data" },
  { key: "articles", icon: Search, label: "Articles" },
  { key: "profile", icon: Star, label: "Profile" },
];

export default function BottomNav({ activeKey, onNavigate }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
      background: C.purpleDeep, borderTop: "1px solid rgba(255,255,255,0.1)",
    }}>
      {ITEMS.map(({ key, icon: Icon, label }) => {
        const active = activeKey === key;
        const color = active ? C.gold : "rgba(251,243,216,0.55)";
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color }}
          >
            <Icon size={18} fill={key === "profile" ? color : "none"} />
            <span style={{ fontSize: 9.5, fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
