export const users = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "customer@shopsa.com",
    password: "customer123",
    role: "customer",
    avatar: "AJ",
    joinDate: "2025-08-15",
    totalOrders: 12,
    totalSpent: 3450
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "customer2@shopsa.com",
    password: "customer123",
    role: "customer",
    avatar: "SW",
    joinDate: "2025-11-02",
    totalOrders: 5,
    totalSpent: 1200
  },
  {
    id: 3,
    name: "TechWorld Electronics",
    email: "retailer@shopsa.com",
    password: "retailer123",
    role: "retailer",
    avatar: "TW",
    joinDate: "2025-06-10",
    totalProducts: 8,
    totalRevenue: 45600,
    storeName: "TechWorld Electronics"
  },
  {
    id: 4,
    name: "GadgetZone",
    email: "retailer2@shopsa.com",
    password: "retailer123",
    role: "retailer",
    avatar: "GZ",
    joinDate: "2025-09-20",
    totalProducts: 4,
    totalRevenue: 23400,
    storeName: "GadgetZone"
  },
  {
    id: 5,
    name: "Admin User",
    email: "admin@shopsa.com",
    password: "admin123",
    role: "admin",
    avatar: "AD",
    joinDate: "2025-01-01"
  }
];

export const customerList = users.filter(u => u.role === 'customer');
export const retailerList = users.filter(u => u.role === 'retailer');

export default users;
