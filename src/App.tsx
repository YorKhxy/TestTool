import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShellClean from "@/components/AppShellClean";
import Home from "@/pages/Home";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import PlaywrightWorkbench from "@/pages/playwright/PlaywrightWorkbench";
import PlaywrightSettings from "@/pages/playwright/PlaywrightSettings";
import PlaywrightReports from "@/pages/playwright/PlaywrightReports";
import PlaywrightNativeSpec from "@/pages/playwright/PlaywrightNativeSpec";

export default function App() {
  return (
    <Router>
      <AppShellClean>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/playwright" element={<PlaywrightWorkbench />} />
          <Route path="/playwright/native" element={<PlaywrightNativeSpec />} />
          <Route path="/playwright/settings" element={<PlaywrightSettings />} />
          <Route path="/playwright/reports" element={<PlaywrightReports />} />
        </Routes>
      </AppShellClean>
    </Router>
  );
}
