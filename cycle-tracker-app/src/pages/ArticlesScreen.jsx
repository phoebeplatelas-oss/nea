import { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import Chip from "../components/Chip";
import ImgCard from "../components/ImgCard";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";
import { ARTICLE_CATS, ARTICLE_SECTIONS } from "../data";

export default function ArticlesScreen({ onNavigate }) {
  // Just tracks which chip is highlighted — doesn't filter anything.
  const [activeCat, setActiveCat] = useState("Period");

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar left={<IconBtn onClick={() => onNavigate("home")}><ChevronLeft size={18} /></IconBtn>} title="All articles" right={<div />} />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "9px 12px", marginBottom: 10 }}>
          <Search size={15} />
          <span style={{ fontSize: 12.5, opacity: 0.7 }}>Search by category</span>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {ARTICLE_CATS.map((c) => (
            <Chip key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Chip>
          ))}
        </div>
        {ARTICLE_SECTIONS.map((s) => (
          <div key={s}>
            <SectionLabelLight>{s}</SectionLabelLight>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              <ImgCard label="Read" /><ImgCard label="Read" /><ImgCard label="Read" /><ImgCard label="Read" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
