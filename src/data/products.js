const products = [
  {
    id: 1,
    name: "ProAudio X1",
    price: 299,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    description: "Premium wireless headphones with active noise cancellation, 40-hour battery life, and studio-grade sound quality.",
    stock: 45,
    retailerId: 1,
    rating: 4.8,
    reviews: 234,
    badge: "Best Seller"
  },
  {
    id: 2,
    name: "Lumina Phone 15",
    price: 999,
    category: "Phones",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
    description: "Flagship smartphone with 6.7\" AMOLED display, 200MP camera, and AI-powered features for the ultimate mobile experience.",
    stock: 28,
    retailerId: 1,
    rating: 4.9,
    reviews: 567,
    badge: "New Arrival"
  },
  {
    id: 3,
    name: "SmartWatch Pro",
    price: 449,
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    description: "Advanced smartwatch with health monitoring, GPS, and 7-day battery life. Your personal health companion.",
    stock: 62,
    retailerId: 2,
    rating: 4.7,
    reviews: 189,
    badge: "Popular"
  },
  {
    id: 4,
    name: "UltraBook Air",
    price: 1299,
    category: "Laptops",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
    description: "Ultra-thin laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for professionals on the go.",
    stock: 15,
    retailerId: 1,
    rating: 4.9,
    reviews: 412,
    badge: "Premium"
  },
  {
    id: 5,
    name: "CloudBuds Elite",
    price: 179,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=300&h=300&fit=crop",
    description: "True wireless earbuds with spatial audio, adaptive EQ, and seamless device switching.",
    stock: 8,
    retailerId: 2,
    rating: 4.6,
    reviews: 321,
    badge: "Low Stock"
  },
  {
    id: 6,
    name: "VisionTab 12",
    price: 799,
    category: "Tablets",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop",
    description: "12.9\" tablet with Liquid Retina display, Apple Pencil support, and desktop-class performance.",
    stock: 34,
    retailerId: 1,
    rating: 4.8,
    reviews: 156,
    badge: null
  },
  {
    id: 7,
    name: "GameStation X",
    price: 549,
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop",
    description: "Next-gen gaming console with 4K/120fps gameplay, ray tracing, and 1TB SSD storage.",
    stock: 5,
    retailerId: 2,
    rating: 4.9,
    reviews: 723,
    badge: "Hot"
  },
  {
    id: 8,
    name: "PowerBank Ultra",
    price: 89,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop",
    description: "20,000mAh portable charger with 65W fast charging, USB-C, and wireless charging pad.",
    stock: 120,
    retailerId: 1,
    rating: 4.5,
    reviews: 89,
    badge: null
  },
  {
    id: 9,
    name: "SmartSpeaker Hub",
    price: 199,
    category: "Smart Home",
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=300&h=300&fit=crop",
    description: "AI-powered smart speaker with premium sound, voice control, and whole-home automation hub.",
    stock: 3,
    retailerId: 2,
    rating: 4.7,
    reviews: 445,
    badge: "Low Stock"
  },
  {
    id: 10,
    name: "DroneView 4K",
    price: 699,
    category: "Camera",
    image: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=300&h=300&fit=crop",
    description: "Professional drone with 4K 60fps camera, 40-min flight time, and intelligent obstacle avoidance.",
    stock: 19,
    retailerId: 1,
    rating: 4.6,
    reviews: 178,
    badge: null
  },
  {
    id: 11,
    name: "FitBand Max",
    price: 129,
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop",
    description: "Advanced fitness tracker with heart rate, SpO2, sleep tracking, and 14-day battery life.",
    stock: 77,
    retailerId: 2,
    rating: 4.4,
    reviews: 234,
    badge: "Value Pick"
  },
  {
    id: 12,
    name: "CamPro R5",
    price: 2499,
    category: "Camera",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop",
    description: "Professional mirrorless camera with 45MP full-frame sensor, 8K video, and advanced autofocus.",
    stock: 7,
    retailerId: 1,
    rating: 4.9,
    reviews: 567,
    badge: "Professional"
  }
];

export const categories = [
  "All", "Phones", "Laptops", "Audio", "Wearables", "Tablets", "Gaming", "Camera", "Smart Home", "Accessories"
];

export default products;
