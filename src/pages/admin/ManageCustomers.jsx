import { customerList } from '../../data/users';
import orders from '../../data/orders';
import { FiUser, FiMail, FiCalendar, FiShoppingBag } from 'react-icons/fi';

export default function ManageCustomers() {
  const customerData = customerList.map(customer => {
    const customerOrders = orders.filter(o => o.customerId === customer.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent
    };
  });

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Customers</h1>
          <p className="page-subtitle">{customerData.length} registered customers</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {customerData.map(customer => (
          <div key={customer.id} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {customer.avatar}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>{customer.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMail style={{ fontSize: '0.8rem' }} /> {customer.email}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{customer.orderCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Orders</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>${customer.totalSpent}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Spent</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--info-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--info)' }}>{customer.joinDate}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Joined</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All Customers Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customerData.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>{customer.avatar}</div>
                    <span style={{ fontWeight: 600 }}>{customer.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{customer.email}</td>
                <td style={{ fontWeight: 600 }}>{customer.orderCount}</td>
                <td style={{ fontWeight: 700 }}>${customer.totalSpent}</td>
                <td style={{ color: 'var(--text-muted)' }}>{customer.joinDate}</td>
                <td><span className="badge badge-success">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
