import { C } from "../theme";

export default function Legend({ data }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", marginTop: 12 }}>
      {data.map((d) => (
        <span key={d.name} style={{ fontSize: 11, color: C.cream2, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
          {d.name} · {d.value}d
        </span>
      ))}
    </div>
  );
}
