import { useState, useEffect } from 'react';
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
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  // Translate Supabase errors to Portuguese
  function translateError(msg) {
    if (!msg) return msg;
    if (msg.toLowerCase().includes('email rate limit exceeded'))
      return `Limite de envio de e-mails atingido. Aguarde ${cooldown > 0 ? cooldown + 's' : '60s'} e tente novamente.`;
    if (msg.toLowerCase().includes('invalid login credentials'))
      return 'E-mail ou senha incorretos.';
    if (msg.toLowerCase().includes('email not confirmed'))
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada ou entre com Google.';
    if (msg.toLowerCase().includes('user already registered'))
      return 'Este e-mail já está registrado. Tente fazer login.';
    return msg;
  }

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(translateError(error.message));
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
        redirectTo: window.location.origin + '/'
      }
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || cooldown > 0) return;
    setResetLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        setCooldown(60);
      }
      setError(translateError(error.message));
    } else {
      setResetSent(true);
      setCooldown(60);
    }
    setResetLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1><PixelIcon name="gamepad" size={32} /> INDIE_SQUAD</h1>
          <p>{showReset ? 'Recuperar senha' : 'Login to Mission Control'}</p>
        </div>

        {error && <div className="auth-error"><PixelIcon name="alert" size={14} /> {error}</div>}

        {/* ── Password Reset Form ── */}
        {showReset ? (
          <>
            {resetSent ? (
              <div className="auth-success-msg">
                <PixelIcon name="check" size={20} />
                <p>E-mail de redefinição enviado para <strong>{resetEmail}</strong>.</p>
                <p className="small-text">Verifique sua caixa de entrada e clique no link para criar uma nova senha.</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label>EMAIL DA CONTA</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={resetLoading}>
                  {resetLoading ? 'ENVIANDO...' : '[ ENVIAR LINK DE REDEFINIÇÃO ]'}
                </button>
              </form>
            )}
            <p className="auth-footer">
              <a href="#" onClick={(e) => { e.preventDefault(); setShowReset(false); setError(null); setResetSent(false); }}>
                ← Voltar ao login
              </a>
            </p>
          </>
        ) : (
          <>
            {/* ── Normal Login Form ── */}
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

            <p className="auth-forgot">
              <a href="#" onClick={(e) => { e.preventDefault(); setShowReset(true); setError(null); }}>
                Esqueci minha senha
              </a>
            </p>

            <p className="auth-footer">
              Novo no esquadrão? <Link to="/register">Recrute-se aqui.</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
