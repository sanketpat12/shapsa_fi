import { retailerList } from '../../data/users';
import products from '../../data/products';
import orders from '../../data/orders';
import { FiShoppingBag, FiMail, FiPackage } from 'react-icons/fi';

export default function ManageRetailers() {
  const retailerData = retailerList.map(retailer => {
    const retailerId = retailer.id === 3 ? 1 : 2;
    const retailerProducts = products.filter(p => p.retailerId === retailerId);
    const retailerOrders = orders.filter(o => o.retailerId === retailerId);
    const revenue = retailerOrders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = retailerProducts.filter(p => p.stock <= 10).length;
    return {
      ...retailer,
      productCount: retailerProducts.length,
      orderCount: retailerOrders.length,
      revenue,
      lowStock
    };
  });

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Retailers</h1>
          <p className="page-subtitle">{retailerData.length} registered retailers</p>
        </div>
      </div>

      {/* Retailer Cards */}
      <div className="grid-2" style={{ marginBottom: 32 }}>
        {retailerData.map(retailer => (
          <div key={retailer.id} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {retailer.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>{retailer.storeName || retailer.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMail style={{ fontSize: '0.8rem' }} /> {retailer.email}
                </p>
              </div>
              {retailer.lowStock > 0 && (
                <span className="badge badge-warning">{retailer.lowStock} Low Stock</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{retailer.productCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Products</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--info-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--info)' }}>{retailer.orderCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Orders</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>${retailer.revenue}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Revenue</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Retailer Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Retailer</th>
              <th>Email</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Low Stock Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {retailerData.map(retailer => (
              <tr key={retailer.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>{retailer.avatar}</div>
                    <span style={{ fontWeight: 600 }}>{retailer.storeName || retailer.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{retailer.email}</td>
                <td style={{ fontWeight: 600 }}>{retailer.productCount}</td>
                <td style={{ fontWeight: 600 }}>{retailer.orderCount}</td>
                <td style={{ fontWeight: 700 }}>${retailer.revenue}</td>
                <td>
                  {retailer.lowStock > 0 ? (
                    <span className="badge badge-warning">{retailer.lowStock}</span>
                  ) : (
                    <span className="badge badge-success">None</span>
                  )}
                </td>
                <td><span className="badge badge-success">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
