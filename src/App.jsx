import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Welcomepage from "./components/Welcomepage/Welcomepage";
import Eventpage from "./components/Eventpage/Eventpage";
import CreateEvent from "./components/CreateEvent/CreateEvent";
import MyEvents from "./components/MyEvents/MyEvents";
import SavedEvents from "./components/SavedEvents/SavedEvents";
import Admin from "./components/Admin/Admin";
import Privacy from "./components/Privacy/Privacy";
import NotFound from "./components/NotFound/NotFound";
import AuthModal from "./components/Auth/AuthModal";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import LaunchBanner from "./components/LaunchBanner/LaunchBanner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SavedEventsProvider } from "./context/SavedEventsContext";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
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

// Wraps a route so only admins can access it; others are silently redirected home
function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [loading, user, isAdmin]);

  if (loading) return null;
  if (!user || !isAdmin) return null;
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
            .gte("date", (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })())
            .order("date", { ascending: true });

          if (!error && rows && rows.length > 0) {
            setEvents(rows.map(dbRowToEvent));
            setLoading(false);
            return;
          }
          if (error) throw error;
        } catch {
          toast.error("Could not load events. Check your connection and try again.");
        }
      }

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
            path="event/:id"
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
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
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
