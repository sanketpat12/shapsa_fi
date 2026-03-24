import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff,
} from 'react-icons/fi';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const result = loginWithCredentials(email.trim(), password);
      if (result.success) {
        // Auto-redirect to the dashboard based on their registered role
        navigate(`/${result.user.role}`);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="login-brand">
            <span className="login-brand-icon">🛍️</span>
            <h1>Shopsa</h1>
          </div>
          <p className="login-subtitle">Your Smart Shopping Destination</p>
        </div>

        <div className="login-form-container animate-fade-in-up">
          <h2 style={{ marginBottom: '4px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome Back!
          </h2>
          <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    fontSize: '1rem', padding: 0,
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <FiArrowRight />}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Register here
              </Link>
            </p>

            {/* Demo credentials hint */}
            <div className="demo-hint">
              <span className="demo-badge">DEMO</span>
              Use <strong>customer@shopsa.com</strong> / <strong>customer123</strong> (or retailer/admin)
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
