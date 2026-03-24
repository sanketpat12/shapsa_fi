import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiShoppingBag, FiShield, FiMail, FiLock,
  FiArrowRight, FiArrowLeft, FiEye, FiEyeOff,
} from 'react-icons/fi';
import './Login.css';

const roles = [
  {
    id: 'customer',
    label: 'Customer',
    icon: <FiUser />,
    description: 'Shop products, track orders, and discover deals',
    color: '#FF6B35',
  },
  {
    id: 'retailer',
    label: 'Retailer',
    icon: <FiShoppingBag />,
    description: 'Manage products, inventory, and track sales',
    color: '#F59E0B',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <FiShield />,
    description: 'Manage users, monitor platform, and analytics',
    color: '#8B5CF6',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const result = loginWithCredentials(email.trim(), password);
      if (result.success) {
        // Ensure logged-in user matches chosen role
        if (result.user.role !== selectedRole.id) {
          setError(`This account is registered as a ${result.user.role}, not a ${selectedRole.id}.`);
        } else {
          navigate(`/${result.user.role}`);
        }
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

        {!selectedRole ? (
          <div className="role-selection animate-fade-in-up">
            <h2>Welcome Back!</h2>
            <p className="role-hint">Select your role to sign in</p>
            <div className="role-cards">
              {roles.map((role, i) => (
                <button
                  key={role.id}
                  className="role-card"
                  onClick={() => handleRoleSelect(role)}
                  style={{ animationDelay: `${i * 0.1}s`, '--role-color': role.color }}
                >
                  <div className="role-icon" style={{ background: `${role.color}15`, color: role.color }}>
                    {role.icon}
                  </div>
                  <div>
                    <h3>{role.label}</h3>
                    <p>{role.description}</p>
                  </div>
                  <div className="role-arrow"><FiArrowRight /></div>
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Register here
              </Link>
            </p>
          </div>
        ) : (
          <div className="login-form-container animate-fade-in-up">
            <button className="back-btn" onClick={() => setSelectedRole(null)}>
              <FiArrowLeft /> Back to roles
            </button>

            <div className="login-role-badge" style={{ '--role-color': selectedRole.color }}>
              <div className="role-icon-sm" style={{ background: `${selectedRole.color}15`, color: selectedRole.color }}>
                {selectedRole.icon}
              </div>
              <span>Signing in as <strong>{selectedRole.label}</strong></span>
            </div>

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
                style={{ background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}dd)` }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
                {!loading && <FiArrowRight />}
              </button>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: selectedRole.color, fontWeight: 600 }}>
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
        )}
      </div>
    </div>
  );
}
