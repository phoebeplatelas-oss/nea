export default function TopBar({ left, title, right, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 10px" }}>
      <div style={{ width: 36 }}>{left}</div>
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 20 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ width: 36, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}
