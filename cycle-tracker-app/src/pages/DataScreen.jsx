import { Home } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Donut from "../components/Donut";
import Legend from "../components/Legend";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";
import { CYCLE_DATA, SYMPTOM_DATA } from "../data";

export default function DataScreen({ onNavigate }) {
  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("home")}><Home size={16} /></IconBtn>} title="Data" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <SectionLabelLight>Average cycle</SectionLabelLight>
        <Donut data={CYCLE_DATA} centerTitle="29" centerSub="avg. cycle length, days" />
        <Legend data={CYCLE_DATA} />

        <SectionLabelLight>Average symptoms</SectionLabelLight>
        <Donut data={SYMPTOM_DATA} centerTitle="28d" centerSub="symptoms logged" />
        <Legend data={SYMPTOM_DATA} />
      </div>
    </div>
  );
}
