import { useState } from "react";
import TopBar from "../components/TopBar";
import { C } from "../theme";
import { STAGES } from "../data";

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)",
  border: `1px solid ${C.purpleLine}`, borderRadius: 10, padding: "11px 14px",
  color: C.cream2, fontFamily: "Manrope, sans-serif", fontSize: 14, marginBottom: 12,
};

const primaryBtn = {
  width: "100%", marginTop: 8, background: C.gold, border: "none", borderRadius: 12,
  padding: "13px", color: C.purpleDeep, fontFamily: "Manrope, sans-serif", fontWeight: 800,
  fontSize: 14.5, cursor: "pointer",
};

function InfoStep({ heading, body, onNext, nextLabel }) {
  return (
    <div>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, marginBottom: 10 }}>{heading}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.9, marginBottom: 24, fontFamily: "Manrope, sans-serif" }}>{body}</div>
      <button onClick={onNext} style={primaryBtn}>{nextLabel}</button>
    </div>
  );
}

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(0); // 0 credentials, 1 life stage, 2 age, 3 medication info, 4 past cycles info
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [lifeStage, setLifeStage] = useState("Menstruating");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setStep(0);
    setError("");
  };

  const createAccount = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin, lifeStage, age: age ? Number(age) : null }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user_id);
      } else {
        setError(data.error || "Something went wrong.");
        setStep(0);
      }
    } catch (err) {
      setError("Couldn't reach the server — is the backend running?");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user_id);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Couldn't reach the server — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Cycle Tracker" left={<div />} right={<div />} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px 40px" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                background: mode === m ? C.gold : "transparent",
                color: mode === m ? C.purpleDeep : C.cream2,
                fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13,
              }}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {mode === "login" && (
          <>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Username</div>
            <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. phoebe" />

            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>PIN</div>
            <input
              style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="4 digits" type="password" maxLength={4} inputMode="numeric"
            />

            {error && <div style={{ color: C.coral, fontSize: 12.5, marginBottom: 10, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{error}</div>}

            <button onClick={login} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : "Log in"}
            </button>
          </>
        )}

        {mode === "signup" && step === 0 && (
          <>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Username</div>
            <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. phoebe" />

            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>PIN</div>
            <input
              style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value)}
              placeholder="4 digits" type="password" maxLength={4} inputMode="numeric"
            />

            {error && <div style={{ color: C.coral, fontSize: 12.5, marginBottom: 10, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{error}</div>}

            <button onClick={() => setStep(1)} style={primaryBtn}>Next</button>
          </>
        )}

        {mode === "signup" && step === 1 && (
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, marginBottom: 14 }}>What stage are you at?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setLifeStage(s)}
                  style={{
                    background: lifeStage === s ? C.gold : "rgba(255,255,255,0.07)",
                    color: lifeStage === s ? C.purpleDeep : C.cream2,
                    border: `1.5px solid ${lifeStage === s ? C.gold : C.purpleLine}`,
                    borderRadius: 14, padding: "16px 8px", fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={primaryBtn}>Next</button>
          </div>
        )}

        {mode === "signup" && step === 2 && (
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18, marginBottom: 14 }}>How old are you?</div>
            <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 4, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Age</div>
            <input
              style={inputStyle} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 24" inputMode="numeric" maxLength={3}
            />
            <button onClick={() => setStep(3)} style={primaryBtn}>Next</button>
          </div>
        )}

        {mode === "signup" && step === 3 && (
          <InfoStep
            heading="Logging medication"
            body="Once your account is set up, go to Profile → Medication to add anything you take regularly and set reminder times. You can add, edit, or turn off reminders at any point — you don't need to fill this in now."
            onNext={() => setStep(4)}
            nextLabel="Next"
          />
        )}

        {mode === "signup" && step === 4 && (
          <InfoStep
            heading="Adding past cycles"
            body="To log a period, tap the relevant days on the Home calendar. Two consecutive days logged as bleeding will automatically be recorded as a period."
            onNext={createAccount}
            nextLabel={loading ? "Please wait…" : "Create account"}
          />
        )}
      </div>
    </div>
  );
}