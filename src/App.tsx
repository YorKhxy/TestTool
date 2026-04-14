import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Home from "@/pages/Home";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import PlaywrightWorkbench from "@/pages/playwright/PlaywrightWorkbench";
import PlaywrightSettings from "@/pages/playwright/PlaywrightSettings";
import PlaywrightReports from "@/pages/playwright/PlaywrightReports";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/playwright" element={<PlaywrightWorkbench />} />
          <Route path="/playwright/settings" element={<PlaywrightSettings />} />
          <Route path="/playwright/reports" element={<PlaywrightReports />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
