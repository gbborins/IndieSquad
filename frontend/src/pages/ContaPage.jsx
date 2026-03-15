import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AGENTS } from '../config/agents';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

function PixelIcon({ name, size = 16 }) {
  return <img src={`${ICON_BASE}/${name}.svg`} alt={name} width={size} height={size} style={{ imageRendering: "pixelated", verticalAlign: "middle" }} />;
}

export default function ContaPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const userMeta = user?.user_metadata || {};
  const fullName = userMeta.full_name || userMeta.name || 'Comandante';
  const email = user?.email || '—';
  const avatarUrl = userMeta.avatar_url || userMeta.picture;
  const provider = user?.app_metadata?.provider || 'email';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
    setChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <PixelIcon name="user" size={20} />
        <span>Minha Conta</span>
      </div>

      <div className="conta-layout">
        {/* Profile Card */}
        <div className="conta-card conta-profile">
          <div className="conta-avatar-area">
            {avatarUrl ? (
              <img className="conta-avatar-img" src={avatarUrl} alt="avatar" />
            ) : (
              <div className="conta-avatar-fallback">
                <span>{fullName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="conta-provider-badge">
              <PixelIcon name={provider === 'google' ? 'human-run' : 'lock'} size={12} />
              <span>{provider === 'google' ? 'Google' : 'Email'}</span>
            </div>
          </div>

          <div className="conta-info">
            <h2 className="conta-name">{fullName}</h2>
            <p className="conta-email">{email}</p>
            <div className="conta-meta-row">
              <PixelIcon name="calendar" size={14} />
              <span>Membro desde {createdAt}</span>
            </div>
            <div className="conta-meta-row">
              <PixelIcon name="check" size={14} />
              <span>Status: <strong style={{ color: '#4ade80' }}>Ativo</strong></span>
            </div>
          </div>
        </div>

        {/* Squad Overview */}
        <div className="conta-card">
          <h3 className="conta-card-title">
            <PixelIcon name="users" size={16} /> Meu Esquadrão
          </h3>
          <div className="conta-squad-grid">
            {Object.values(AGENTS).map(agent => (
              <div key={agent.id} className="conta-squad-member" style={{ borderLeftColor: agent.color }}>
                <span className="conta-squad-avatar">{agent.avatar}</span>
                <div>
                  <div className="conta-squad-name">{agent.name}</div>
                  <div className="conta-squad-role" style={{ color: agent.color }}>{agent.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="conta-card">
          <h3 className="conta-card-title">
            <PixelIcon name="lock" size={16} /> Segurança
          </h3>

          {!showPasswordForm ? (
            <button className="conta-action-btn" onClick={() => setShowPasswordForm(true)}>
              <PixelIcon name="edit" size={14} />
              Alterar Senha
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="conta-password-form">
              <div className="form-group">
                <label>NOVA SENHA</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <div className="conta-form-actions">
                <button type="submit" className="conta-action-btn primary" disabled={changingPassword}>
                  {changingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
                <button type="button" className="conta-action-btn" onClick={() => { setShowPasswordForm(false); setPasswordMsg(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {passwordMsg && (
            <div className={`conta-msg ${passwordMsg.type}`}>
              <PixelIcon name={passwordMsg.type === 'error' ? 'alert' : 'check'} size={14} />
              {passwordMsg.text}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="conta-card conta-danger">
          <h3 className="conta-card-title">
            <PixelIcon name="alert" size={16} /> Zona de Perigo
          </h3>
          <button className="conta-action-btn danger" onClick={handleSignOut}>
            <PixelIcon name="logout" size={14} />
            Desconectar da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
