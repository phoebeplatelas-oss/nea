import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Donut from "../components/Donut";
import Legend from "../components/Legend";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

function describeOffset(avgOffset) {
  const rounded = Math.round(avgOffset);
  if (rounded < 0) return `${Math.abs(rounded)} day${Math.abs(rounded) === 1 ? "" : "s"} before your period, on average`;
  if (rounded === 0) return "Usually on day 1 of your period";
  return `${rounded} day${rounded === 1 ? "" : "s"} into your period, on average`;
}

export default function DataScreen({ onNavigate, userId }) {
  const [cycleData, setCycleData] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/cycle-stats/${userId}`).then((res) => res.json()),
      fetch(`/api/symptom-timing/${userId}`).then((res) => res.json()),
    ])
      .then(([cycleStats, timing]) => {
        if (cycleStats.available) {
          setCycleData([
            { name: "Menstruating", value: cycleStats.menstruating, color: C.coral },
            { name: "Follicular", value: cycleStats.follicular, color: C.purpleLine },
            { name: "Ovulation", value: cycleStats.ovulation, color: C.gold },
            { name: "Luteal", value: cycleStats.luteal, color: C.purpleMid },
          ].filter((d) => d.value > 0));
        } else {
          setCycleData([]);
        }
        setTimingData(timing.timing || []);
      })
      .catch((err) => console.error("Data fetch failed:", err))
      .finally(() => setLoaded(true));
  }, [userId]);

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("home")}><Home size={16} /></IconBtn>} title="Data" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <SectionLabelLight>Average cycle</SectionLabelLight>
        {!loaded ? (
          <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.7, padding: "20px 0" }}>Loading…</div>
        ) : cycleData && cycleData.length > 0 ? (
          <>
            <Donut
              data={cycleData}
              centerTitle={String(cycleData.reduce((sum, d) => sum + d.value, 0))}
              centerSub="avg. cycle length, days"
            />
            <Legend data={cycleData} />
          </>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.7, padding: "20px 0" }}>
            Not enough logged periods yet to show an average cycle.
          </div>
        )}

        <SectionLabelLight>When your symptoms tend to happen</SectionLabelLight>
        {!loaded ? (
          <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.7, padding: "20px 0" }}>Loading…</div>
        ) : timingData && timingData.length > 0 ? (
          <div>
            {timingData.map((s) => (
              <div key={s.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", marginBottom: 8,
              }}>
                <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13 }}>{s.name}</span>
                <span style={{ fontSize: 11.5, opacity: 0.8, textAlign: "right" }}>{describeOffset(s.avg_offset)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.7, padding: "20px 0" }}>
            No symptoms logged yet.
          </div>
        )}
      </div>
    </div>
  );
}