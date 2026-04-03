import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Home from "@/pages/Home";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
