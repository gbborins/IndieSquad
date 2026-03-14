import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 16 }) {
  return <img src={`${ICON_BASE}/${name}.svg`} alt={name} width={size} height={size} style={{ imageRendering: "pixelated", verticalAlign: "middle" }} />;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box success-box">
          <PixelIcon name="check" size={48} />
          <h2>RECRUTAMENTO CONCLUÍDO</h2>
          <p>Seja bem-vindo ao Esquadrão, Comandante {fullName}.</p>
          <p className="small-text">Redirecionando para as credenciais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1><PixelIcon name="user-plus" size={32} /> RECRUTAMENTO</h1>
          <p>Join Mission Control</p>
        </div>

        {error && <div className="auth-error"><PixelIcon name="alert" size={14} /> {error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>NICKNAME (FULL NAME)</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Hideo Kojima"
              required 
            />
          </div>
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
            {loading ? 'CRIANDO...' : '[ REGISTRAR ]'}
          </button>
        </form>

        <p className="auth-footer">
          Já é nosso Comandante? <Link to="/login">Acesse a sala de controle.</Link>
        </p>
      </div>
    </div>
  );
}
