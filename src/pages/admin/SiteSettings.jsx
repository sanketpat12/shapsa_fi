import { useState } from 'react';
import { FiSave, FiGlobe, FiMail, FiShield, FiPercent } from 'react-icons/fi';

export default function SiteSettings() {
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    siteName: 'Shopsa',
    siteTagline: 'Your Smart Shopping Destination',
    contactEmail: 'support@shopsa.com',
    taxRate: '8',
    freeShippingThreshold: '50',
    lowStockThreshold: '10',
    enableDeals: true,
    enableReviews: true,
    maintenanceMode: false
  });

  const handleSave = () => {
    setToast('Settings saved successfully!');
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Settings</h1>
          <p className="page-subtitle">Configure your platform</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <FiSave /> Save Changes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* General Settings */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: '1.1rem' }}>
            <FiGlobe style={{ color: 'var(--primary)' }} /> General Settings
          </h3>
          <div className="form-group">
            <label>Site Name</label>
            <input
              type="text"
              className="form-input"
              value={settings.siteName}
              onChange={e => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tagline</label>
            <input
              type="text"
              className="form-input"
              value={settings.siteTagline}
              onChange={e => setSettings({ ...settings, siteTagline: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              className="form-input"
              value={settings.contactEmail}
              onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
        </div>

        {/* Commerce Settings */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: '1.1rem' }}>
            <FiPercent style={{ color: 'var(--primary)' }} /> Commerce Settings
          </h3>
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              className="form-input"
              value={settings.taxRate}
              onChange={e => setSettings({ ...settings, taxRate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Free Shipping Threshold ($)</label>
            <input
              type="number"
              className="form-input"
              value={settings.freeShippingThreshold}
              onChange={e => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Low Stock Alert Threshold</label>
            <input
              type="number"
              className="form-input"
              value={settings.lowStockThreshold}
              onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="card" style={{ padding: 28, gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: '1.1rem' }}>
            <FiShield style={{ color: 'var(--primary)' }} /> Feature Toggles
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { key: 'enableDeals', label: 'Deals & Promotions', desc: 'Show deals page to customers' },
              { key: 'enableReviews', label: 'Product Reviews', desc: 'Allow customers to review products' },
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Take the site offline for maintenance' }
            ].map(toggle => (
              <div
                key={toggle.key}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${settings[toggle.key] ? 'var(--primary)' : 'var(--border)'}`,
                  background: settings[toggle.key] ? 'rgba(255, 107, 53, 0.04)' : 'var(--bg-white)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSettings({ ...settings, [toggle.key]: !settings[toggle.key] })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{toggle.label}</span>
                  <div style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: settings[toggle.key] ? 'var(--primary)' : 'var(--border)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                      left: settings[toggle.key] ? 22 : 2,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}></div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{toggle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
