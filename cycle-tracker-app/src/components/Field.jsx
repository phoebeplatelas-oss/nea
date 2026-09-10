import { C } from "../theme";

export default function Field({ label, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{label}</div>
      <input placeholder={placeholder} style={{
        width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`,
        borderRadius: 10, padding: "9px 12px", color: C.cream2, fontFamily: "Manrope, sans-serif", fontSize: 13,
      }} />
    </div>
  );
}
