import { ChevronLeft, Plus } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Field from "../components/Field";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

const APPOINTMENTS = [
  { title: "Cervical smear", when: "12pm · 2/4/26", where: "Queen's Medical Centre" },
  { title: "Pill check", when: "6pm · 3/7/26", where: "Pharmacy" },
];

export default function AppointmentsScreen({ onNavigate }) {
  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Appointments" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        {APPOINTMENTS.map((a, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14.5 }}>{a.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{a.when} · {a.where}</div>
          </div>
        ))}
        <SectionLabelLight>Add appointment</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <Field label="Name of appointment" placeholder="e.g. Pill check" />
          <Field label="Time and date" placeholder="6pm · 3/7/26" />
          <Field label="Place" placeholder="Pharmacy" />
          <button style={{
            width: "100%", marginTop: 6, background: C.gold, color: C.purpleDeep, border: "none",
            borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Plus size={15} /> Add appointment
          </button>
        </div>
      </div>
    </div>
  );
}
