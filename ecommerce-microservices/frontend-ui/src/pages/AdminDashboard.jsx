import React, { useState, useEffect } from 'react';
import { getAdminDashboard, getAdminOrders, getAdminUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBox, FiShoppingBag, FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalUsers: 0 });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, products
  
  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: 0, stock: 0, category: '', images: '', size: '', color: ''
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    Promise.all([
      getAdminDashboard(),
      getAdminOrders({ limit: 10 })
    ]).then(([statRes, ordRes]) => {
      setStats(statRes.data);
      setOrders(ordRes.data.orders || []);
      setLoading(false);
      fetchAdminProducts();
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user, navigate]);

  const fetchAdminProducts = () => {
    import('../api').then(({ getProducts }) => {
      getProducts({ limit: 100 }).then(res => setProducts(res.data.products || []));
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...productForm,
      images: productForm.images.split(',').map(s => s.trim()).filter(Boolean),
      size: productForm.size.split(',').map(s => s.trim()).filter(Boolean),
      color: productForm.color.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const { addProduct, updateProduct } = await import('../api');
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        toast.success('Product updated');
      } else {
        await addProduct(payload);
        toast.success('Product added');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: 0, stock: 0, category: '', images: '', size: '', color: '' });
      fetchAdminProducts();
      // refresh stats
      getAdminDashboard().then(res => setStats(res.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm('Delete this product?')) return;
    try {
      const { deleteProduct } = await import('../api');
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchAdminProducts();
      getAdminDashboard().then(res => setStats(res.data));
    } catch(err) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-purple-600/80 text-white' : 'glass-card text-gray-400 hover:text-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'products' ? 'bg-purple-600/80 text-white' : 'glass-card text-gray-400 hover:text-white'}`}>Products</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalUsers}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><FiUsers size={24}/></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalOrders}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400"><FiShoppingBag size={24}/></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Products</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalProducts}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><FiBox size={24}/></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-green-500 flex flex-col justify-center items-center cursor-pointer hover:bg-white/10 transition-colors">
          <FiSettings size={28} className="text-gray-400 mb-2"/>
          <span className="text-white font-medium">Platform Settings</span>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-300 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono">{o._id.substring(0,8)}</td>
                  <td className="px-6 py-4">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-white">${o.totalAmount?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${o.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-purple-400 hover:text-purple-300 mr-3">Examine</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Product Management</h2>
            <button 
              onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: 0, stock: 0, category: '', images: '', size: '', color: '' }); setShowProductForm(true); }}
              className="btn-primary flex items-center gap-2 py-2 text-sm"
            >
              <FiPlus /> Add Product
            </button>
          </div>

          {showProductForm && (
            <div className="mb-8 p-6 bg-white/5 border border-purple-500/30 rounded-2xl animate-fade-in">
              <h3 className="text-lg font-bold text-white mb-4">{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input required value={productForm.name} onChange={e=>setProductForm({...productForm, name: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <input required value={productForm.category} onChange={e=>setProductForm({...productForm, category: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Price ($)</label>
                  <input required type="number" step="0.01" value={productForm.price} onChange={e=>setProductForm({...productForm, price: Number(e.target.value)})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Stock Amount</label>
                  <input required type="number" value={productForm.stock} onChange={e=>setProductForm({...productForm, stock: Number(e.target.value)})} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea required value={productForm.description} onChange={e=>setProductForm({...productForm, description: e.target.value})} className="input-field" rows="3"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Image URLs (comma separated)</label>
                  <input value={productForm.images} onChange={e=>setProductForm({...productForm, images: e.target.value})} className="input-field text-sm" placeholder="https://image1.jpg, https://image2.jpg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sizes (comma separated)</label>
                  <input value={productForm.size} onChange={e=>setProductForm({...productForm, size: e.target.value})} className="input-field text-sm" placeholder="S, M, L" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Colors (comma separated)</label>
                  <input value={productForm.color} onChange={e=>setProductForm({...productForm, color: e.target.value})} className="input-field text-sm" placeholder="Red, Blue, Green" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowProductForm(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingProduct ? 'Save Changes' : 'Create Product'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-gray-300 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <img src={p.images?.[0] || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <span className="truncate max-w-[200px]">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 uppercase text-xs">{p.category}</td>
                    <td className="px-6 py-4 text-white">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${p.stock > 10 ? 'bg-green-500/20 text-green-400' : p.stock > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => {
                        setEditingProduct(p);
                        setProductForm({
                          name: p.name, description: p.description, price: p.price, stock: p.stock, 
                          category: p.category, images: (p.images||[]).join(', '),
                          size: (p.size||[]).join(', '), color: (p.color||[]).join(', ')
                        });
                        setShowProductForm(true);
                      }} className="text-blue-400 hover:text-blue-300 transition-colors"><FiEdit2 size={18}/></button>
                      <button onClick={() => handleDeleteProduct(p._id)} className="text-red-400 hover:text-red-300 transition-colors"><FiTrash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

