import { useEffect, useState } from "react";
import { Home, Star, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import IconBtn from "../components/IconBtn";
import ImgCard from "../components/ImgCard";
import { SectionLabelLight } from "../components/SectionLabel";
import { C } from "../theme";


const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MAX_MONTHS_BACK = 12;
const MAX_MONTHS_FORWARD = 2;

function pad(n) { return String(n).padStart(2, "0"); }
function isoDate(year, month, day) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const cells = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function cloneMap(map) {
  const copy = {};
  for (const [k, v] of Object.entries(map)) copy[k] = new Set(v);
  return copy;
}

function expandRange(startISO, days) {
  const out = [];
  const start = new Date(startISO + "T00:00:00");
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(isoDate(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return out;
}

function expandInclusive(startISO, endISO) {
  const out = [];
  let cur = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  while (cur <= end) {
    out.push(isoDate(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return isoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function HomeScreen({ onNavigate, userId }) {
  const [predictedDate, setPredictedDate] = useState(null);
  const [forecastLength, setForecastLength] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [predictionError, setPredictionError] = useState(false);
  const [symptomsByDate, setSymptomsByDate] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarError, setCalendarError] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [forecastDates, setForecastDates] = useState(new Set());
  const [fertilityDates, setFertilityDates] = useState(new Set());
  const [streak, setStreak] = useState(0);

  const now = new Date();
  const realTodayISO = isoDate(now.getFullYear(), now.getMonth(), now.getDate());

  const viewDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const grid = getMonthGrid(year, month);
  const monthStartISO = isoDate(year, month, 1);
  const monthEndISO = isoDate(year, month, new Date(year, month + 1, 0).getDate());

  const loadMonth = () => {
    return fetch(`/api/symptoms/${userId}?start=${monthStartISO}&end=${monthEndISO}`)
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        for (const { date, symptom } of data.symptoms || []) {
          if (!map[date]) map[date] = new Set();
          map[date].add(symptom);
        }
        setSymptomsByDate(map);
      })
      .catch((err) => console.error("Symptom fetch failed:", err));
  };

  const loadPrediction = () => {
    return fetch(`/api/prediction/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setPredictedDate(data.predicted_date);
        setForecastLength(data.length || null);
        if (data.predicted_date && data.length) {
          setForecastDates(new Set(expandRange(data.predicted_date, data.length)));
        } else {
          setForecastDates(new Set());
        }
      })
      .catch((err) => {
        console.error("Prediction fetch failed:", err);
        setPredictionError(true);
      })
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    loadPrediction();
    fetch(`/api/streak/${userId}`)
      .then((res) => res.json())
      .then((data) => setStreak(data.streak || 0))
      .catch((err) => console.error("Streak fetch failed:", err));
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((profileData) => {
        if (profileData.life_stage !== "Fertility") return;
        return fetch(`/api/fertility-window/${userId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.start && data.end) setFertilityDates(new Set(expandInclusive(data.start, data.end)));
          });
      })
      .catch((err) => console.error("Fertility window fetch failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setSelectedDay(null);
    setCalendarError("");
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, month]);

  const hasBleeding = (dateStr) => {
    const set = symptomsByDate[dateStr];
    return !!set && (set.has("bleedinglight") || set.has("bleedingheavy"));
  };

  const isFuture = (day) => isoDate(year, month, day) > realTodayISO;

  // While a period is actively being logged, show a ring on the remaining
  // days it's expected to run - separate from forecastDates, which only
  // ever tracks the *next* period once this one is confirmed.
  const activePeriodForecast = new Set();
  if (hasBleeding(realTodayISO)) {
    let runStart = realTodayISO;
    while (hasBleeding(addDays(runStart, -1))) {
      runStart = addDays(runStart, -1);
    }
    const predictedEnd = addDays(runStart, (forecastLength || 5) - 1);
    let d = addDays(realTodayISO, 1);
    while (d <= predictedEnd) {
      activePeriodForecast.add(d);
      d = addDays(d, 1);
    }
  }

  const handleDayClick = async (day) => {
    if (isFuture(day)) return;

    const dateStr = isoDate(year, month, day);
    setSelectedDay(day);
    setCalendarError("");

    const currentlyLogged = hasBleeding(dateStr);
    const existing = symptomsByDate[dateStr] || new Set();
    const kept = [...existing].filter((s) => s !== "bleedinglight" && s !== "bleedingheavy");
    const symptoms = currentlyLogged ? kept : [...kept, "bleedingheavy"];

    const previous = symptomsByDate;
    const optimistic = cloneMap(symptomsByDate);
    optimistic[dateStr] = new Set(symptoms);
    setSymptomsByDate(optimistic);

    try {
      const res = await fetch("/api/log-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, date: dateStr, symptoms }),
      });
      const data = await res.json();
      if (!data.success) {
        setSymptomsByDate(previous);
        setCalendarError(data.error || "Couldn't save that.");
      } else {
        loadMonth();
        loadPrediction();
        fetch(`/api/streak/${userId}`)
          .then((res) => res.json())
          .then((d) => setStreak(d.streak || 0))
          .catch((err) => console.error("Streak fetch failed:", err));
      }
    } catch (err) {
      setSymptomsByDate(previous);
      setCalendarError("Couldn't reach the server — is the backend running?");
    }
  };

  const canGoBack = monthOffset < MAX_MONTHS_BACK;
  const canGoForward = monthOffset > -MAX_MONTHS_FORWARD;

  return (
    <div style={{ background: C.purpleDeep, color: C.cream2, minHeight: "100%" }}>
      <TopBar
        left={<IconBtn onClick={() => onNavigate("home")}><Home size={16} /></IconBtn>}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", fontSize: 14 }}>
            <Flame size={16} color={C.gold} />{streak} day streak
          </span>
        }
        right={<IconBtn onClick={() => onNavigate("profile")} bg="transparent"><Star size={20} color={C.gold} fill={C.gold} /></IconBtn>}
      />

      <div style={{ padding: "6px 20px 20px" }}>
        <button
          onClick={() => onNavigate("log")}
          style={{
            width: "100%", background: C.gold, border: "none", borderRadius: 16, padding: "12px 16px",
            color: C.purpleDeep, fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 14.5,
            textAlign: "left", cursor: "pointer", marginBottom: 14,
          }}
        >
          Quick log
        </button>

        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: "14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <button
              onClick={() => canGoBack && setMonthOffset((o) => o + 1)}
              disabled={!canGoBack}
              style={{ background: "none", border: "none", cursor: canGoBack ? "pointer" : "default", color: C.cream2, opacity: canGoBack ? 1 : 0.25, padding: 4 }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, textAlign: "center" }}>
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              onClick={() => canGoForward && setMonthOffset((o) => o - 1)}
              disabled={!canGoForward}
              style={{ background: "none", border: "none", cursor: canGoForward ? "pointer" : "default", color: C.cream2, opacity: canGoForward ? 1 : 0.25, padding: 4 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.7, textAlign: "center", marginBottom: 10 }}>
            Tap a day to log or clear bleeding
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 7 }}>
            {grid.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const dateStr = isoDate(year, month, day);
              const logged = hasBleeding(dateStr);
              const isToday = dateStr === realTodayISO;
              const isSelected = day === selectedDay;
              const future = isFuture(day);
              const forecasted = !logged && (forecastDates.has(dateStr) || activePeriodForecast.has(dateStr));
              const inFertilityWindow = fertilityDates.has(dateStr);

              const rings = [];
              if (isToday) rings.push(`0 0 0 2px ${C.gold}`);
              if (isSelected) rings.push(`0 0 0 ${isToday ? 4 : 2}px ${C.cream2}`);
              if (inFertilityWindow) rings.push(`0 0 0 ${rings.length ? 4 : 2}px #3FA34D`);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  disabled={future}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", fontSize: 10.5,
                    border: forecasted ? "2px dashed #FF5C5C" : "none",
                    cursor: future ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: logged ? C.coral : "rgba(255,255,255,0.08)",
                    boxShadow: rings.length ? rings.join(", ") : "none",
                    color: C.cream2, fontFamily: "Manrope, sans-serif", fontWeight: 600,
                    opacity: future ? 0.3 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12, fontSize: 9.5, opacity: 0.85, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral }} /> Period day
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px dashed #FF5C5C" }} /> Predicted period
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", boxShadow: `0 0 0 2px ${C.gold}` }} /> Today
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", boxShadow: `0 0 0 2px ${C.cream2}` }} /> Last tapped
            </span>
            {fertilityDates.size > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", boxShadow: "0 0 0 2px #3FA34D" }} /> Fertility window
              </span>
            )}
          </div>
          {calendarError && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.coral, textAlign: "center", fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>
              {calendarError}
            </div>
          )}
        </div>

        <div style={{
          marginTop: 14, background: C.gold, color: C.purpleDeep, borderRadius: 14, padding: "10px 14px",
          fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13,
        }}>
          {(() => {
            if (!loaded) return "Loading prediction…";
            if (predictionError) return "Something went wrong loading your prediction.";

            if (hasBleeding(realTodayISO)) {
              let runStart = realTodayISO;
              while (hasBleeding(addDays(runStart, -1))) {
                runStart = addDays(runStart, -1);
              }
              const predictedEnd = addDays(runStart, (forecastLength || 5) - 1);
              return `Predicted to end: ${predictedEnd}`;
            }

            if (!predictedDate) return "Not enough history yet to predict a date.";
            return `Predicted next period: ${predictedDate}`;
          })()}
        </div>

        <SectionLabelLight>Insights for you</SectionLabelLight>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          <ImgCard label="Boost energy" />
          <ImgCard label="Skin care" />
          <ImgCard label="Sleep tips" />
        </div>

        <button
          onClick={() => onNavigate("articles")}
          style={{
            width: "100%", marginTop: 16, background: "transparent", border: `1.5px solid ${C.purpleLine}`,
            color: C.cream2, borderRadius: 14, padding: "11px", fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          All articles
        </button>
      </div>
    </div>
  );
}