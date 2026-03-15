import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";

// Placeholder pages — content will be added later
function EmptyPage() {
  return null;
}

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
            <Route path="/guilda" element={<EmptyPage />} />
            <Route path="/quests" element={<EmptyPage />} />
            <Route path="/npcs" element={<EmptyPage />} />
            <Route path="/memoria" element={<EmptyPage />} />
            <Route path="/uso" element={<EmptyPage />} />
            <Route path="/conta" element={<EmptyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}