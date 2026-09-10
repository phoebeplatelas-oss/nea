import { useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`,
  borderRadius: 10, padding: "9px 12px", color: C.cream2, fontFamily: "Manrope, sans-serif", fontSize: 13,
};

export default function AppointmentsScreen({ onNavigate, userId }) {
  const [appointments, setAppointments] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAppointments = () => {
    fetch(`/api/appointments/${userId}`)
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch((err) => console.error("Appointments fetch failed:", err));
  };

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, title, date, time, location }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle(""); setDate(""); setTime(""); setLocation("");
        loadAppointments();
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Couldn't reach the server — is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Appointments" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        {appointments.length === 0 && (
          <div style={{ fontSize: 12.5, opacity: 0.7, marginBottom: 12, fontFamily: "Manrope, sans-serif" }}>No appointments yet.</div>
        )}
        {appointments.map((a) => (
          <div key={a.id} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14.5 }}>{a.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
              {a.time ? `${a.time} · ` : ""}{a.date}{a.location ? ` · ${a.location}` : ""}
            </div>
          </div>
        ))}
        <SectionLabelLight>Add appointment</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Name of appointment</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pill check" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Date</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Time</div>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Place</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pharmacy" style={inputStyle} />
          </div>
          {error && <div style={{ color: C.coral, fontSize: 12, marginBottom: 8, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{error}</div>}
          <button
            onClick={submit}
            disabled={saving}
            style={{
              width: "100%", marginTop: 6, background: C.gold, color: C.purpleDeep, border: "none",
              borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13,
              cursor: saving ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.7 : 1,
            }}
          >
            <Plus size={15} /> {saving ? "Saving…" : "Add appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}