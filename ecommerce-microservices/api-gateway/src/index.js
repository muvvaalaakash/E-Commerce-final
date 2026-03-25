const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost', credentials: true }));
app.use(express.json());

const parseCookies = (req) => {
    const list = {};
    const rc = req.headers.cookie;
    rc && rc.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
};

// Service URLs
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  auth: process.env.AUTH_SERVICE_URL || 'http://authentication-service:3002',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
  search: process.env.SEARCH_SERVICE_URL || 'http://search-service:3004',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3005',
  cart: process.env.CART_SERVICE_URL || 'http://cart-service:3006',
  wishlist: process.env.WISHLIST_SERVICE_URL || 'http://wishlist-service:3007',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3008',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3009',
  invoice: process.env.INVOICE_SERVICE_URL || 'http://invoice-service:3010',
  shipping: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3011',
  review: process.env.REVIEW_SERVICE_URL || 'http://review-rating-service:3012',
  recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://recommendation-service:3013',
  admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3014'
};

// Auth middleware
const authenticate = async (req, res, next) => {
  let token = parseCookies(req).token;
  if (!token && req.headers.authorization) {
     token = req.headers.authorization.split(' ')[1] || req.headers.authorization;
  }
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const resp = await axios.post(`${SERVICES.auth}/authenticate`, { authorization: token });
    req.user = resp.data.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

// --- Public Routes (no auth needed) ---

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const resp = await axios.post(`${SERVICES.auth}/validate-login`, req.body);
    res.cookie('token', resp.data.token, cookieOptions);
    res.json(resp.data);
  } catch (err) { res.status(err.response?.status || 500).json(err.response?.data || { error: err.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const userResp = await axios.post(`${SERVICES.user}/register`, req.body);
    const user = userResp.data.user;
    const tokenResp = await axios.post(`${SERVICES.auth}/generate-token`, { userId: user.id, email: user.email, role: user.role });
    res.cookie('token', tokenResp.data.token, cookieOptions);
    res.status(201).json({ message: 'Registration successful', user, token: tokenResp.data.token });
  } catch (err) { res.status(err.response?.status || 500).json(err.response?.data || { error: err.message }); }
});

app.post('/api/auth/register-admin', async (req, res) => {
  try {
    const userResp = await axios.post(`${SERVICES.user}/register-admin`, req.body);
    const user = userResp.data.user;
    const tokenResp = await axios.post(`${SERVICES.auth}/generate-token`, { userId: user.id, email: user.email, role: user.role });
    res.cookie('token', tokenResp.data.token, cookieOptions);
    res.status(201).json({ message: 'Admin Registration successful', user, token: tokenResp.data.token });
  } catch (err) { res.status(err.response?.status || 500).json(err.response?.data || { error: err.message }); }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    let token = parseCookies(req).token;
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1] || req.headers.authorization;
    }
    if (!token && req.body.token) token = req.body.token;
    
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const resp = await axios.post(`${SERVICES.auth}/verify-token`, { token });
    res.json(resp.data);
  } catch (err) { res.status(err.response?.status || 500).json(err.response?.data || { error: err.message }); }
});

// Product routes (public)
app.get('/api/products', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.product}/products`, { params: req.query }); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/products/:id', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.product}/products/${req.params.id}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/products/:id/similar', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.product}/products/${req.params.id}/similar`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/categories', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.product}/categories`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Search routes (public)
app.get('/api/search', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.search}/search`, { params: req.query }); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/filters', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.search}/filters`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews (public read)
app.get('/api/reviews/:productId', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.review}/reviews/${req.params.productId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/reviews/average/:productId', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.review}/reviews/average/${req.params.productId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trending (public)
app.get('/api/trending', async (req, res) => {
  try { const r = await axios.get(`${SERVICES.recommendation}/trending`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Protected Routes (auth needed) ---

// Profile
app.get('/api/profile/:id', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.user}/profile/${req.params.id}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/profile/:id', authenticate, async (req, res) => {
  try { const r = await axios.put(`${SERVICES.user}/profile/${req.params.id}`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cart
app.get('/api/cart/:userId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.cart}/cart/${req.params.userId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/cart', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.cart}/cart`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/cart', authenticate, async (req, res) => {
  try { const r = await axios.put(`${SERVICES.cart}/cart`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/cart/:userId/:productId', authenticate, async (req, res) => {
  try { const r = await axios.delete(`${SERVICES.cart}/cart/${req.params.userId}/${req.params.productId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/cart/:userId', authenticate, async (req, res) => {
  try { const r = await axios.delete(`${SERVICES.cart}/cart/${req.params.userId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Wishlist
app.get('/api/wishlist/:userId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.wishlist}/wishlist/${req.params.userId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/wishlist', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.wishlist}/wishlist`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/wishlist/:userId/:productId', authenticate, async (req, res) => {
  try { const r = await axios.delete(`${SERVICES.wishlist}/wishlist/${req.params.userId}/${req.params.productId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/wishlist/:userId/check/:productId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.wishlist}/wishlist/${req.params.userId}/check/${req.params.productId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
app.post('/api/orders', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.order}/orders`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/orders/:userId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.order}/orders/${req.params.userId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/orders/detail/:orderId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.order}/orders/detail/${req.params.orderId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Payment
app.post('/api/payments/process', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.payment}/payments/process`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/payments/:orderId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.payment}/payments/${req.params.orderId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Invoice
app.post('/api/invoices/generate', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.invoice}/invoices/generate`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/invoices/:orderId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.invoice}/invoices/${req.params.orderId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/invoices/:orderId/pdf', authenticate, async (req, res) => {
  try { 
    const r = await axios.get(`${SERVICES.invoice}/invoices/${req.params.orderId}/pdf`, { responseType: 'stream' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.orderId}.pdf`);
    r.data.pipe(res);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Shipping
app.get('/api/shipping/:orderId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.shipping}/shipping/${req.params.orderId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews (write)
app.post('/api/reviews', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.review}/reviews`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Recommendations
app.get('/api/recommendations/:userId', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.recommendation}/recommendations/${req.params.userId}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Admin Routes ---
app.get('/api/admin/dashboard', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.admin}/admin/dashboard`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/products', authenticate, async (req, res) => {
  try { const r = await axios.post(`${SERVICES.admin}/admin/products`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/products/:id', authenticate, async (req, res) => {
  try { const r = await axios.put(`${SERVICES.admin}/admin/products/${req.params.id}`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/products/:id', authenticate, async (req, res) => {
  try { const r = await axios.delete(`${SERVICES.admin}/admin/products/${req.params.id}`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/orders', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.admin}/admin/orders`, { params: req.query }); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/orders/:id/status', authenticate, async (req, res) => {
  try { const r = await axios.put(`${SERVICES.admin}/admin/orders/${req.params.id}/status`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/users', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.admin}/admin/users`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/inventory', authenticate, async (req, res) => {
  try { const r = await axios.get(`${SERVICES.admin}/admin/inventory`); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/inventory/:productId', authenticate, async (req, res) => {
  try { const r = await axios.put(`${SERVICES.admin}/admin/inventory/${req.params.productId}`, req.body); res.json(r.data); } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
