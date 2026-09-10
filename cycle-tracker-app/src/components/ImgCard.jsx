import { C } from "../theme";

export default function ImgCard({ label }) {
  return (
    <div style={{ minWidth: 92, width: 92 }}>
      <div style={{
        height: 62, borderRadius: 12,
        background: "linear-gradient(180deg,#CFE8F5 0%,#BFE0EF 55%,#8FCB86 55%,#79c06c 100%)",
        border: `1px solid ${C.creamLine}`,
      }} />
      <div style={{ fontSize: 11, marginTop: 5, color: C.ink, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{label}</div>
    </div>
  );
}
