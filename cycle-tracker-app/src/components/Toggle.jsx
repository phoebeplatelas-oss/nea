import { C } from "../theme";

export default function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
        background: on ? C.gold : "rgba(255,255,255,0.25)", position: "relative", transition: "background .15s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%",
        background: C.creamCard, transition: "left .15s",
      }} />
    </button>
  );
}
