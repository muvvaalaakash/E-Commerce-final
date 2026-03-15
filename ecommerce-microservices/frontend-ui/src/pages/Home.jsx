import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getTrending, getRecommendations } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiStar, FiShoppingCart } from 'react-icons/fi';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { user, requireAuth } = useAuth();

  useEffect(() => {
    const promises = [
      getProducts({ featured: true, limit: 4 }).catch(() => ({ data: { products: [] } })),
      getTrending().catch(() => ({ data: { trending: [] } }))
    ];
    
    if (user && user.id) {
      promises.push(getRecommendations(user.id).catch(() => ({ data: [] })));
    }
    
    Promise.all(promises).then(([featRes, trendRes, recRes]) => {
      setFeatured(featRes.data.products || []);
      setTrending(trendRes.data.trending?.slice(0, 8) || []);
      if (recRes) {
        setRecommendations(recRes.data || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user]);

  const Hero = () => (
    <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 bg-hero-gradient text-white animate-fade-in shadow-2xl shadow-purple-500/20">
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      <div className="relative z-10 px-8 py-20 sm:py-32 md:px-16 flex flex-col md:flex-row items-center justify-between">
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-slide-up">
            Next-Gen Shopping <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-200">Experience</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 mb-10 max-w-lg mx-auto md:mx-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Discover premium products tailored to your lifestyle. Enjoy lightning-fast delivery and secure checkout.
          </p>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/products" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Shop Now <FiArrowRight size={20} />
            </Link>
          </div>
        </div>
        <div className="hidden md:block w-96 h-96 relative animate-float">
          {/* Abstract Hero Image Representation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-amber-400 rounded-full mix-blend-screen filter blur-xl opacity-70"></div>
          <img 
             src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop" 
             alt="Fashion" 
             className="w-full h-full object-cover rounded-full border-4 border-white/20 shadow-2xl"
          />
        </div>
      </div>
    </div>
  );

  const ProductGrid = ({ title, products }) => (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          {title}
        </h2>
        <Link to="/products" className="text-purple-400 hover:text-pink-400 font-medium transition-colors flex items-center gap-1">
          View all <FiArrowRight />
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product._id} className="product-card group">
              <Link to={`/product/${product._id}`}>
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                    alt={product.name}
                    className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
                    loading="lazy"
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.featured && <span className="badge bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">Featured</span>}
                    {product.stock < 10 && product.stock > 0 && <span className="badge bg-red-500 text-white shadow-lg">Low Stock</span>}
                  </div>
                </div>
              </Link>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{product.category}</p>
                  <div className="flex items-center text-yellow-400 text-sm">
                    <FiStar className="fill-current" /> <span className="ml-1 text-gray-300">{product.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                <Link to={`/product/${product._id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 hover:text-purple-400 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xl font-bold text-white">${product.price?.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice?.toFixed(2)}</span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); requireAuth(() => addItem(product)); }}
                    className="p-3 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-300"
                    aria-label="Add to cart"
                  >
                    <FiShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in pb-10">
      <Hero />
      <ProductGrid title="Featured Collection" products={featured} />
      
      {/* Promotional Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-purple-900/40 border border-purple-500/20">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Free Express Delivery</h3>
            <p className="text-purple-200">On all orders over $150. Limited time offer.</p>
          </div>
          <Link to="/products" className="mt-6 md:mt-0 btn-primary">
            Explore Deals
          </Link>
        </div>
      </div>

      <ProductGrid title="Trending Now" products={trending} />
      
      {recommendations.length > 0 && (
        <ProductGrid title="Recommended For You" products={recommendations} />
      )}
    </div>
  );
}
