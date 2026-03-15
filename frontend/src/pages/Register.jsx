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
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: window.location.origin + '/login'
      }
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('email rate limit exceeded'))
        msg = 'Limite de envio de e-mails atingido. Aguarde 60 segundos e tente novamente.';
      else if (msg.toLowerCase().includes('user already registered'))
        msg = 'Este e-mail já está registrado. Tente fazer login ou redefinir sua senha.';
      else if (msg.toLowerCase().includes('password should be'))
        msg = 'A senha deve ter no mínimo 6 caracteres.';
      setError(msg);
    } else {
      // Supabase returns user with empty identities if email already exists
      // (when email confirmation is enabled)
      if (data?.user?.identities?.length === 0) {
        setError(null);
        setAlreadyExists(true);
      } else if (data?.session) {
        // Auto-confirmed, go directly to app
        navigate('/');
        return;
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    }
    
    setLoading(false);
  };

  const handleSendReset = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('email rate limit exceeded'))
        msg = 'Limite de envio de e-mails atingido. Aguarde 60 segundos e tente novamente.';
      setError(msg);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  // ── Success Screen ──
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

  // ── Already Exists Screen ──
  if (alreadyExists) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h1><PixelIcon name="alert" size={32} /> E-MAIL EXISTENTE</h1>
            <p>Este e-mail já está cadastrado no sistema</p>
          </div>

          {error && <div className="auth-error"><PixelIcon name="alert" size={14} /> {error}</div>}

          {resetSent ? (
            <div className="auth-success-msg">
              <PixelIcon name="check" size={20} />
              <p>Link de redefinição enviado para <strong>{email}</strong>.</p>
              <p className="small-text">Verifique sua caixa de entrada e clique no link para criar uma nova senha.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                O e-mail <strong>{email}</strong> já possui uma conta.
                Deseja redefinir sua senha?
              </p>
              <button className="login-btn" onClick={handleSendReset} disabled={loading}>
                {loading ? 'ENVIANDO...' : '[ ENVIAR LINK DE REDEFINIÇÃO ]'}
              </button>
            </div>
          )}

          <p className="auth-footer">
            <Link to="/login">← Voltar ao login</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Registration Form ──
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
