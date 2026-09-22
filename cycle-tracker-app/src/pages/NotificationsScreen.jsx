import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Toggle from "../components/Toggle";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";

const REMINDER_LABELS = ["Medication reminder", "Logging reminder", "Appointment reminder", "Period warning", "Fertility window"];

export default function NotificationsScreen({ onNavigate, userId }) {
  const [toggles, setToggles] = useState(
    Object.fromEntries(REMINDER_LABELS.map((label) => [label, true]))
  );

  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [savedEmail, setSavedEmail] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [sharingError, setSharingError] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const loadSharing = () => {
    fetch(`/api/sharing/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setSharingEnabled(!!data.enabled);
        setSavedEmail(data.email || null);
      })
      .catch((err) => console.error("Sharing status fetch failed:", err));
  };

  useEffect(() => {
    loadSharing();
  }, [userId]);

  const startSharing = async () => {
    setSharingError("");
    setSharingLoading(true);
    try {
      const res = await fetch("/api/sharing/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email: emailInput }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailInput("");
        loadSharing();
      } else {
        setSharingError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setSharingError("Couldn't reach the server — is the backend running?");
    } finally {
      setSharingLoading(false);
    }
  };

  const stopSharing = async () => {
    setSharingLoading(true);
    try {
      const res = await fetch("/api/sharing/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) loadSharing();
    } catch (err) {
      console.error("Stop sharing failed:", err);
    } finally {
      setSharingLoading(false);
    }
  };

  const sendReminderNow = async () => {
    setSendResult(null);
    setSharingLoading(true);
    try {
      const res = await fetch("/api/sharing/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      setSendResult(data);
    } catch (err) {
      setSendResult({ success: false, error: "Couldn't reach the server." });
    } finally {
      setSharingLoading(false);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("profile")}><ChevronLeft size={18} /></IconBtn>} title="Notifications" right={<div />} />
      <div style={{ padding: "6px 20px 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 16px" }}>
          {Object.keys(toggles).map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{k}</span>
              <Toggle on={toggles[k]} onClick={() => setToggles((p) => ({ ...p, [k]: !p[k] }))} />
            </div>
          ))}
        </div>

        <SectionLabelLight>In the loop</SectionLabelLight>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          {sharingEnabled ? (
            <>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 12 }}>
                Currently sharing cycle reminders with <strong>{savedEmail}</strong>.
              </div>
              {sendResult && (
                <div style={{ fontSize: 12, marginBottom: 10, color: sendResult.success ? "#2E7D32" : C.coral, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>
                  {sendResult.success ? "Reminder sent." : sendResult.error}
                </div>
              )}
              <button
                onClick={sendReminderNow}
                disabled={sharingLoading}
                style={{
                  width: "100%", marginBottom: 10, background: C.gold, color: C.purpleDeep, border: "none",
                  borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13,
                  cursor: sharingLoading ? "default" : "pointer", opacity: sharingLoading ? 0.7 : 1,
                }}
              >
                {sharingLoading ? "Please wait…" : "Send reminder now"}
              </button>
              <button
                onClick={stopSharing}
                disabled={sharingLoading}
                style={{
                  width: "100%", background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}`,
                  borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13,
                  cursor: sharingLoading ? "default" : "pointer", opacity: sharingLoading ? 0.7 : 1,
                }}
              >
                {sharingLoading ? "Please wait…" : "Stop sharing"}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 10 }}>Send a cycle reminder to someone you trust.</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Enter email address</div>
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: `1px solid ${C.purpleLine}`,
                    borderRadius: 10, padding: "9px 12px", color: C.cream2, fontFamily: "Manrope, sans-serif", fontSize: 13,
                  }}
                />
              </div>
              {sharingError && <div style={{ color: C.coral, fontSize: 12, marginBottom: 8, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{sharingError}</div>}
              <button
                onClick={startSharing}
                disabled={sharingLoading}
                style={{
                  width: "100%", background: C.gold, color: C.purpleDeep, border: "none",
                  borderRadius: 10, padding: "10px", fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 13,
                  cursor: sharingLoading ? "default" : "pointer", opacity: sharingLoading ? 0.7 : 1,
                }}
              >
                {sharingLoading ? "Please wait…" : "Start sharing"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}