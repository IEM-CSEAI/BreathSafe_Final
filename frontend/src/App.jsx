import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ToastContainer from "./components/common/ToastContainer";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import { useAlerts } from "./hooks/useAlerts";

function AlertWatcher() {
  useAlerts();
  return null;
}

export default function App() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg text-fg">
      <Navbar />
      <AlertWatcher />
      <ToastContainer />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-3">
        <div key={pathname} className="page-slide">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}