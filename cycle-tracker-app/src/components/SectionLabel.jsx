import { C } from "../theme";

export function SectionLabel({ children }) {
  return <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15, color: C.ink, margin: "14px 0 8px" }}>{children}</div>;
}

export function SectionLabelLight({ children }) {
  return <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15, color: C.cream2, margin: "16px 0 8px" }}>{children}</div>;
}
