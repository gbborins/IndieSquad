import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 16 }) {
  return <img src={`${ICON_BASE}/${name}.svg`} alt={name} width={size} height={size} style={{ imageRendering: "pixelated", verticalAlign: "middle" }} />;
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;

    function markReady() {
      if (!resolved) {
        resolved = true;
        setReady(true);
        setChecking(false);
      }
    }

    // Method 1: Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        markReady();
      } else if (event === 'SIGNED_IN' && session) {
        // Sometimes Supabase fires SIGNED_IN instead of PASSWORD_RECOVERY
        // Check if URL has recovery-related hash params
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('type=magiclink')) {
          markReady();
        } else {
          markReady(); // User has a session either way, allow password change
        }
      }
    });

    // Method 2: Check URL hash for recovery token and process it
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      // Supabase should auto-process the hash, give it a moment
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) markReady();
        });
      }, 1500);
    }

    // Method 3: Check if there's already an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If user already has a session, allow them to change password
        markReady();
      }
    });

    // Timeout: stop showing "checking" after 5 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        setChecking(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('same password'))
        msg = 'A nova senha não pode ser igual à senha anterior.';
      setError(msg);
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
          <h2>SENHA REDEFINIDA</h2>
          <p>Sua senha foi atualizada com sucesso.</p>
          <p className="small-text">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1><PixelIcon name="lock" size={32} /> NOVA SENHA</h1>
          <p>Defina sua nova senha de acesso</p>
        </div>

        {error && <div className="auth-error"><PixelIcon name="alert" size={14} /> {error}</div>}

        {!ready ? (
          <div className="auth-success-msg">
            {checking ? (
              <>
                <PixelIcon name="loader" size={20} />
                <p>Verificando link de redefinição...</p>
              </>
            ) : (
              <>
                <PixelIcon name="alert" size={20} />
                <p>Não foi possível verificar o link de redefinição.</p>
                <p className="small-text">O link pode ter expirado. Solicite um novo na página de login.</p>
                <button
                  className="login-btn"
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate('/login')}
                >
                  [ VOLTAR AO LOGIN ]
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label>NOVA SENHA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>CONFIRMAR SENHA</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'SALVANDO...' : '[ REDEFINIR SENHA ]'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
