import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchProducts, getFilters } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiFilter, FiStar, FiShoppingCart, FiSearch } from 'react-icons/fi';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersData, setFiltersData] = useState({ categories: [], priceRange: { min: 0, max: 1000 } });
  
  // Active Filters state
  const [activeFilters, setActiveFilters] = useState({
    category: category,
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  });

  const { addItem } = useCart();
  const { requireAuth } = useAuth();

  useEffect(() => {
    // Sync URL queries into state
    setActiveFilters(prev => ({ ...prev, category: searchParams.get('category') || '' }));
  }, [searchParams]);

  useEffect(() => {
    getFilters().then(res => setFiltersData(res.data)).catch(console.error);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        q: query,
        ...activeFilters,
        limit: 24
      };
      // remove empty keys
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      const res = await searchProducts(params);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Search failed', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, activeFilters]);

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'category') {
      if (value) {
        searchParams.set('category', value);
      } else {
        searchParams.delete('category');
      }
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FiFilter className="text-purple-400" /> Filters
            </h3>
            
            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-300 mb-3 uppercase text-xs tracking-wider">Categories</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <button 
                  onClick={() => handleFilterChange('category', '')}
                  className={`block w-full text-left text-sm ${!activeFilters.category ? 'text-purple-400 font-medium' : 'text-gray-400 hover:text-white transition-colors'}`}
                >
                  All Categories
                </button>
                {filtersData.categories.map(cat => (
                  <button 
                    key={cat} onClick={() => handleFilterChange('category', cat)}
                    className={`block w-full text-left text-sm ${activeFilters.category === cat ? 'text-purple-400 font-medium' : 'text-gray-400 hover:text-white transition-colors'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-300 mb-3 uppercase text-xs tracking-wider">Sort By</h4>
              <select 
                value={activeFilters.sort}
                onChange={e => handleFilterChange('sort', e.target.value)}
                className="input-field py-2 text-sm"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            
            <button 
              onClick={() => { setActiveFilters({ category: '', minPrice: '', maxPrice: '', sort: 'newest' }); setSearchParams({}); }}
              className="w-full text-sm text-pink-400 hover:text-pink-300 transition-colors py-2 border border-pink-500/30 rounded-lg bg-pink-500/10"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {query ? `Search results for "${query}"` : (activeFilters.category || 'All Products')}
            </h1>
            <p className="text-gray-400 text-sm">Showing {products.length} products</p>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
             </div>
          ) : products.length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FiSearch size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
              <button 
                onClick={() => { setActiveFilters({ category: '', minPrice: '', maxPrice: '', sort: 'newest' }); setSearchParams({}); }}
                className="btn-primary"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product._id} className="product-card group flex flex-col h-full bg-[#161625]">
                  <Link to={`/product/${product._id}`} className="block relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400'} 
                      alt={product.name}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{product.category}</p>
                      <div className="flex items-center text-yellow-400 text-xs font-medium">
                        <FiStar className="fill-current mr-1" /> {product.rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <Link to={`/product/${product._id}`} className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-500 line-through block mb-0.5">${product.originalPrice?.toFixed(2)}</span>
                        )}
                        <span className="text-lg font-bold text-white">${product.price?.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          requireAuth(() => addItem({
                            productId: product._id,
                            name: product.name,
                            image: product.images?.[0],
                            price: product.price
                          })); 
                        }}
                        className="py-2 px-4 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-300 text-sm font-medium flex items-center gap-2"
                      >
                        <FiShoppingCart size={16} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
