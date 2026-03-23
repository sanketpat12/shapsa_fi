const orders = [
  {
    id: "ORD-001",
    customerId: 1,
    customerName: "Alex Johnson",
    items: [
      { productId: 1, name: "ProAudio X1", price: 299, quantity: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop" },
      { productId: 8, name: "PowerBank Ultra", price: 89, quantity: 2, image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=80&h=80&fit=crop" }
    ],
    total: 477,
    status: "Delivered",
    date: "2026-03-15",
    retailerId: 1
  },
  {
    id: "ORD-002",
    customerId: 1,
    customerName: "Alex Johnson",
    items: [
      { productId: 2, name: "Lumina Phone 15", price: 999, quantity: 1, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&h=80&fit=crop" }
    ],
    total: 999,
    status: "Shipped",
    date: "2026-03-20",
    retailerId: 1
  },
  {
    id: "ORD-003",
    customerId: 2,
    customerName: "Sarah Williams",
    items: [
      { productId: 3, name: "SmartWatch Pro", price: 449, quantity: 1, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop" }
    ],
    total: 449,
    status: "Processing",
    date: "2026-03-22",
    retailerId: 2
  },
  {
    id: "ORD-004",
    customerId: 2,
    customerName: "Sarah Williams",
    items: [
      { productId: 5, name: "CloudBuds Elite", price: 179, quantity: 1, image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=80&h=80&fit=crop" },
      { productId: 11, name: "FitBand Max", price: 129, quantity: 1, image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=80&h=80&fit=crop" }
    ],
    total: 308,
    status: "Delivered",
    date: "2026-03-10",
    retailerId: 2
  },
  {
    id: "ORD-005",
    customerId: 1,
    customerName: "Alex Johnson",
    items: [
      { productId: 7, name: "GameStation X", price: 549, quantity: 1, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=80&h=80&fit=crop" }
    ],
    total: 549,
    status: "Pending",
    date: "2026-03-23",
    retailerId: 2
  }
];

export default orders;
