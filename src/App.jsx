import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Welcomepage from "./components/Welcomepage/Welcomepage";
import Eventpage from "./components/Eventpage/Eventpage";
import CreateEvent from "./components/CreateEvent/CreateEvent";
import MyEvents from "./components/MyEvents/MyEvents";
import SavedEvents from "./components/SavedEvents/SavedEvents";
import AuthModal from "./components/Auth/AuthModal";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import LaunchBanner from "./components/LaunchBanner/LaunchBanner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SavedEventsProvider } from "./context/SavedEventsContext";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import data from "./data.json";
import { supabase } from "./lib/supabase";
import { dbRowToEvent } from "./lib/mapEvent";

// Wraps a route so unauthenticated users are redirected and the auth modal opens
function RequireAuth({ children }) {
  const { user, loading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      openAuthModal('login');
      navigate('/', { replace: true });
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return null;
  return children;
}

function AppContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (supabase) {
        try {
          const { data: rows, error } = await supabase
            .from("events")
            .select("*")
            .eq("status", "active")
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true });

          if (!error && rows && rows.length > 0) {
            setEvents(rows.map(dbRowToEvent));
            setLoading(false);
            return;
          }
        } catch {
          // Supabase unreachable, fall through to data.json
        }
      }

      // Fallback to local data
      setEvents(data);
      setLoading(false);
    }

    fetchEvents();
  }, []);

  return (
    <div className="App">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f1f1f',
            color: '#ffffff',
            border: '1px solid #333333',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: {
            style: { borderColor: '#ff66c4' },
            iconTheme: { primary: '#ff66c4', secondary: '#1f1f1f' },
          },
          error: {
            style: { borderColor: '#ff4444' },
            iconTheme: { primary: '#ff4444', secondary: '#1f1f1f' },
          },
        }}
      />
      <AuthModal />
      <CookieBanner />
      <LaunchBanner />
      <nav>
        <Navbar />
      </nav>
      <main>
        <Routes>
          <Route
            path="/"
            index
            element={<Welcomepage events={events} loading={loading} />}
          />
          <Route
            path=":name"
            element={<Eventpage events={events} />}
          />
          <Route
            path="/createevent"
            element={
              <RequireAuth>
                <CreateEvent events={events} setEvents={setEvents} />
              </RequireAuth>
            }
          />
          <Route
            path="/myevents"
            element={
              <RequireAuth>
                <MyEvents />
              </RequireAuth>
            }
          />
          <Route
            path="/saved"
            element={
              <RequireAuth>
                <SavedEvents />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SavedEventsProvider>
        <AppContent />
      </SavedEventsProvider>
    </AuthProvider>
  );
}

export default App;
