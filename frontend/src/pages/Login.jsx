import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 16 }) {
  return <img src={`${ICON_BASE}/${name}.svg`} alt={name} width={size} height={size} style={{ imageRendering: "pixelated", verticalAlign: "middle" }} />;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/'
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1><PixelIcon name="gamepad" size={32} /> INDIE_SQUAD</h1>
          <p>Login to Mission Control</p>
        </div>

        {error && <div className="auth-error"><PixelIcon name="alert" size={14} /> {error}</div>}

        <button 
          className="google-btn" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="18" height="18" />
          [ ENTRAR COM GOOGLE ]
        </button>

        <div className="auth-divider"><span>OU</span></div>

        <form onSubmit={handleEmailLogin} className="auth-form">
          <div className="form-group">
            <label>EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="commander@indiesquad.com"
              required 
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'CONECTANDO...' : '[ INICIAR SESSÃO ]'}
          </button>
        </form>

        <p className="auth-footer">
          Novo no esquadrão? <Link to="/register">Recrute-se aqui.</Link>
        </p>
      </div>
    </div>
  );
}
