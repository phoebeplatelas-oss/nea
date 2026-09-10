import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { C } from "../theme";

export default function Donut({ data, centerTitle, centerSub }) {
  return (
    <div style={{ position: "relative", width: 168, height: 168, margin: "0 auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: C.cream2 }}>{centerTitle}</div>
        <div style={{ fontSize: 10, color: C.cream2, opacity: 0.75, maxWidth: 90 }}>{centerSub}</div>
      </div>
    </div>
  );
}
