import { C } from "../theme";

export default function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${active ? C.gold : C.purpleLine}`,
        background: active ? C.gold : "transparent", color: active ? C.purpleDeep : C.cream2,
        fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
