import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users } from '../data/users';
import { FiUser, FiShoppingBag, FiShield, FiMail, FiLock, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import './Login.css';

const roles = [
  {
    id: 'customer',
    label: 'Customer',
    icon: <FiUser />,
    description: 'Shop products, track orders, and discover deals',
    color: '#FF6B35',
    demo: { email: 'customer@shopsa.com', password: 'customer123' }
  },
  {
    id: 'retailer',
    label: 'Retailer',
    icon: <FiShoppingBag />,
    description: 'Manage products, inventory, and track sales',
    color: '#F59E0B',
    demo: { email: 'retailer@shopsa.com', password: 'retailer123' }
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <FiShield />,
    description: 'Manage users, monitor platform, and analytics',
    color: '#8B5CF6',
    demo: { email: 'admin@shopsa.com', password: 'admin123' }
  }
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(role.demo.email);
    setPassword(role.demo.password);
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        login(user);
        navigate(`/${user.role}`);
      } else {
        setError('Invalid email or password. Try the demo credentials.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
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
            <h2>Welcome! Choose your role</h2>
            <p className="role-hint">Select how you want to access the platform</p>
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
                  <h3>{role.label}</h3>
                  <p>{role.description}</p>
                  <div className="role-arrow"><FiArrowRight /></div>
                </button>
              ))}
            </div>
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
              <span>Logging in as <strong>{selectedRole.label}</strong></span>
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
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg login-btn"
                disabled={loading}
                style={{ background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}dd)` }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <FiArrowRight />}
              </button>

              <div className="demo-hint">
                <span className="demo-badge">DEMO</span>
                Credentials are pre-filled for quick access
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
