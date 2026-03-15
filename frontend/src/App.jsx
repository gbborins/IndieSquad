import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from "./pages/Login";
import Register from "./pages/Register";
import GuildPage from "./pages/GuildPage";
import Home from "./pages/Home";
import UsoPage from "./pages/UsoPage";
import MemoriaPage from "./pages/MemoriaPage";
import NPCsPage from "./pages/NPCsPage";
import Layout from "./components/Layout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>[ Carregando Sistema... ]</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/guilda" replace />} />
            <Route path="/guilda" element={<GuildPage />} />
            <Route path="/quests" element={<Home />} />
            <Route path="/npcs" element={<NPCsPage />} />
            <Route path="/memoria" element={<MemoriaPage />} />
            <Route path="/uso" element={<UsoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}