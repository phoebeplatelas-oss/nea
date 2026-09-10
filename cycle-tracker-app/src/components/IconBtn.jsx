import { C } from "../theme";

export default function IconBtn({ children, onClick, bg = "rgba(255,255,255,0.12)", color = C.cream2 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 999, border: "none", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", color, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
