import { useState } from "react";
import { C, FONTS } from "./theme";
import BottomNav from "./components/BottomNav";

import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import DataScreen from "./pages/DataScreen";
import ArticlesScreen from "./pages/ArticlesScreen";
import LogSymptomsScreen from "./pages/LogSymptomsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import StageScreen from "./pages/StageScreen";
import MySymptomsScreen from "./pages/MySymptomsScreen";
import AppointmentsScreen from "./pages/AppointmentsScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import HealthRecordScreen from "./pages/HealthRecordScreen";

const PAGES = {
  home: HomeScreen,
  data: DataScreen,
  articles: ArticlesScreen,
  log: LogSymptomsScreen,
  profile: ProfileScreen,
  stage: StageScreen,
  mySymptoms: MySymptomsScreen,
  appointments: AppointmentsScreen,
  notifications: NotificationsScreen,
  healthRecord: HealthRecordScreen,
};

const TAB_KEYS = ["home", "data", "articles", "profile"];

export default function App() {
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState("home");

  const commonStyle = (
    <style>{FONTS}{`
      * { -webkit-tap-highlight-color: transparent; }
      input::placeholder { color: rgba(251,243,216,0.45); }
      html, body, #root { height: 100%; margin: 0; }
      .app-backdrop { height: 100dvh; background: ${C.purpleDeep}; font-family: Manrope, sans-serif; }
      .content-column { max-width: 480px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; }
    `}</style>
  );

  if (!userId) {
    return (
      <div className="app-backdrop">
        {commonStyle}
        <div className="content-column">
          <LoginScreen onLoginSuccess={(id) => setUserId(id)} />
        </div>
      </div>
    );
  }

  const Page = PAGES[page];

  return (
    <div className="app-backdrop">
      {commonStyle}
      <div className="content-column">
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Page onNavigate={setPage} userId={userId} />
        </div>
        {page !== "log" && (
          <BottomNav activeKey={TAB_KEYS.includes(page) ? page : "none"} onNavigate={setPage} />
        )}
      </div>
    </div>
  );
}