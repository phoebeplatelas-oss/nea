import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import { C } from "../theme";
import { STAGES } from "../data";

export default function StageScreen({ onNavigate, userId }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => setSelected(data.life_stage || "Menstruating"))
      .catch((err) => console.error("Profile fetch failed:", err));
  }, [userId]);

  const choose = async (stage) => {
    const previous = selected;
    setSelected(stage);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, lifeStage: stage }),
      });
      const data = await res.json();
      if (!data.success) setSelected(previous);
    } catch (err) {
      setSelected(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="My stage" right={<div />} />
      <div style={{ padding: "10px 20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => choose(s)}
            disabled={saving}
            style={{
              background: selected === s ? C.gold : "rgba(255,255,255,0.07)",
              color: selected === s ? C.purpleDeep : C.cream2,
              border: `1.5px solid ${selected === s ? C.gold : C.purpleLine}`,
              borderRadius: 16, padding: "22px 10px", fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14,
              cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}