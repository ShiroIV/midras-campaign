import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        toast.success('Connecté');
      } else {
        await register(username, password, 'player');
        toast.success('Compte créé');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24, color: '#1a1a2e' }}>Midras</h1>
      <h2 style={{ textAlign: 'center', marginBottom: 20, fontSize: '1.1em', color: '#666' }}>
        {mode === 'login' ? 'Connexion' : 'Inscription'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label>Nom d'utilisateur</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: 10, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 10, marginTop: 4 }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, fontSize: '1em' }}>
          {loading ? '...' : (mode === 'login' ? 'Se connecter' : 'S\'inscrire')}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9em' }}
        >
          {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
      </p>
    </div>
  );
}
