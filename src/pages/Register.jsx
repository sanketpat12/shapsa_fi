import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FiUser, FiShoppingBag, FiShield, FiMail, FiLock,
  FiArrowRight, FiArrowLeft, FiEye, FiEyeOff,
  FiAlertCircle, FiKey, FiHome,
} from 'react-icons/fi';
import './Register.css';

const ADMIN_SECRET = 'SHOPSA_ADMIN';

const roles = [
  {
    id: 'customer',
    label: 'Customer',
    icon: <FiUser />,
    description: 'Browse products, track orders & get exclusive deals',
    color: '#FF6B35',
  },
  {
    id: 'retailer',
    label: 'Retailer',
    icon: <FiShoppingBag />,
    description: 'List products, manage inventory & grow your sales',
    color: '#F59E0B',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <FiShield />,
    description: 'Platform management, analytics & user oversight',
    color: '#8B5CF6',
  },
];

function getPasswordStrength(pw) {
  if (!pw) return 0;
  if (pw.length < 4) return 1;
  if (pw.length < 6) return 2;
  return 3;
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
    setError('');
  };

  const validate = () => {
    if (selectedRole.id === 'retailer' && !storeName.trim())
      return 'Store name is required.';
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (selectedRole.id === 'admin') {
      if (!adminCode.trim()) return 'Admin access code is required.';
      if (adminCode.trim() !== ADMIN_SECRET) return 'Invalid admin access code.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const userData = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: selectedRole.id,
      ...(selectedRole.id === 'retailer'
        ? { storeName: storeName.trim(), ownerName: name.trim() }
        : {}),
    };

    const result = await register(userData);
    if (result.success) {
      // Check if Supabase auto-signed user in (email confirmation OFF)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(`/${selectedRole.id}`);
      } else {
        setSuccessMsg('✅ Account created! Please check your email to confirm, then log in.');
        setTimeout(() => navigate('/login'), 4000);
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const pwStrength = getPasswordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][pwStrength];
  const strengthClass = ['', 'filled-weak', 'filled-fair', 'filled-strong'][pwStrength];

  return (
    <div className="register-page">
      <div className="register-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <div className="register-brand">
            <span className="register-brand-icon">🛍️</span>
            <h1>Shopsa</h1>
          </div>
          <p className="register-subtitle">Create your account to get started</p>
        </div>

        {/* Step indicator */}
        <div className="register-steps">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {/* Step 1 — Role Selection */}
        {step === 1 && (
          <div className="reg-role-selection animate-fade-in-up">
            <h2>Create an Account</h2>
            <p className="reg-role-hint">Choose how you want to join the platform</p>
            <div className="reg-role-cards">
              {roles.map((role, i) => (
                <button
                  key={role.id}
                  className="reg-role-card"
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
            <p className="reg-footer" style={{ marginTop: '24px' }}>
              Already have an account?{' '}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Registration Form */}
        {step === 2 && selectedRole && (
          <div className="register-form-container animate-fade-in-up">
            <button className="reg-back-btn" onClick={handleBack}>
              <FiArrowLeft /> Back to roles
            </button>

            <div className="reg-role-badge" style={{ '--role-color': selectedRole.color }}>
              <div className="reg-role-icon-sm" style={{ background: `${selectedRole.color}15`, color: selectedRole.color }}>
                {selectedRole.icon}
              </div>
              <span>Registering as <strong>{selectedRole.label}</strong></span>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {error && (
                <div className="reg-error">
                  <FiAlertCircle style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="reg-error" style={{ background: 'var(--success-bg,#d1fae5)', color: 'var(--success,#065f46)', borderColor: 'var(--success,#065f46)' }}>
                  ✅ {successMsg}
                </div>
              )}

              {/* Retailer: Store Name */}
              {selectedRole.id === 'retailer' && (
                <div className="form-group">
                  <label>Store Name</label>
                  <div className="reg-input-wrapper">
                    <FiHome className="reg-input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. TechWorld Electronics"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Full Name / Owner Name */}
              <div className="form-group">
                <label>{selectedRole.id === 'retailer' ? 'Owner Full Name' : 'Full Name'}</label>
                <div className="reg-input-wrapper">
                  <FiUser className="reg-input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={selectedRole.id === 'retailer' ? 'Your full name' : 'e.g. Alex Johnson'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Admin Code */}
              {selectedRole.id === 'admin' && (
                <div className="form-group">
                  <label>Admin Access Code</label>
                  <div className="reg-input-wrapper">
                    <FiKey className="reg-input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter secret admin code"
                      value={adminCode}
                      onChange={e => setAdminCode(e.target.value)}
                      required
                    />
                  </div>
                  <p className="admin-code-hint">
                    <FiShield size={12} /> Provided by platform administrators only
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label>Email Address</label>
                <div className="reg-input-wrapper">
                  <FiMail className="reg-input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password + Confirm — side by side on wider screens */}
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <div className="reg-input-wrapper">
                    <FiLock className="reg-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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
                  {/* Strength bars */}
                  {password && (
                    <div className="password-strength">
                      {[1, 2, 3].map(n => (
                        <div
                          key={n}
                          className={`strength-bar ${n <= pwStrength ? strengthClass : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="reg-input-wrapper">
                    <FiLock className="reg-input-icon" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '44px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(s => !s)}
                      style={{
                        position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        fontSize: '1rem', padding: 0,
                      }}
                    >
                      {showConfirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg register-btn"
                disabled={loading}
                style={{
                  background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}dd)`,
                }}
              >
                {loading ? 'Creating Account…' : `Create ${selectedRole.label} Account`}
                {!loading && <FiArrowRight style={{ marginLeft: 8 }} />}
              </button>

              <div className="reg-footer">
                Already have an account?{' '}
                <Link to="/login">Sign in here</Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
