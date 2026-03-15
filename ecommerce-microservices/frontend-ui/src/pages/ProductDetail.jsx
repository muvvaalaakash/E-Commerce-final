import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getSimilarProducts, getReviews, getAverageRating, submitReview, addToWishlist } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiStar, FiHeart, FiShoppingCart, FiTruck, FiShield, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const { addItem } = useCart();
  const { user, requireAuth } = useAuth();
  const handleAddToWishlist = () => {
    requireAuth(() => {
      addToWishlist({
        userId: user.id,
        productId: product._id,
        name: product.name,
        image: product.images?.[0],
        price: product.price
      }).then(() => {
        toast.success('Added to wishlist!');
      }).catch(err => {
        toast.error(err.response?.data?.error || 'Could not add to wishlist');
      });
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    
    Promise.all([
      getProduct(id),
      getSimilarProducts(id).catch(() => ({ data: [] })),
      getReviews(id).catch(() => ({ data: [] })),
      getAverageRating(id).catch(() => ({ data: { average: 0, count: 0 } }))
    ]).then(([prodRes, simRes, revRes, ratRes]) => {
      setProduct(prodRes.data);
      if(prodRes.data.size?.length) setSelectedSize(prodRes.data.size[0]);
      if(prodRes.data.color?.length) setSelectedColor(prodRes.data.color[0]);
      setSimilar(simRes.data || []);
      setReviews(revRes.data || []);
      setRatingStats(ratRes.data || { average: 0, count: 0 });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load product details');
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  if (!product) return <div className="text-center py-20 text-white text-2xl">Product not found</div>;

  const handleAddToCart = () => {
    requireAuth(() => {
      addItem({
        productId: product._id,
        name: product.name,
        image: product.images?.[0],
        price: product.price,
        quantity,
        size: selectedSize,
        color: selectedColor
      });
    });
  };

  const images = product.images?.length ? product.images : ['https://via.placeholder.com/800'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      
      {/* Breadcrumbs */}
      <div className="flex text-sm text-gray-400 mb-8 items-center gap-2">
        <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-purple-400 transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-white truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        
        {/* Image Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 custom-scrollbar">
              {images.map((img, idx) => (
                <button 
                  key={idx} onClick={() => setActiveImage(idx)}
                  className={`w-20 md:w-full aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx ? 'border-purple-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {/* Main Image */}
          <div className="flex-1 glass-card overflow-hidden aspect-[4/5] rounded-3xl relative">
            <img 
              src={images[activeImage]} alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.featured && (
              <span className="absolute top-4 left-4 badge bg-gradient-to-r from-yellow-400 to-amber-500 text-white">Featured</span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6 border-b border-white/10 pb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={i < Math.round(ratingStats.average) ? "fill-current" : "text-gray-600"} />
                  ))}
                </div>
                <span className="ml-2 text-white font-medium">{ratingStats.average.toFixed(1)}</span>
                <span className="ml-2 text-gray-400 text-sm hover:text-purple-400 cursor-pointer transition-colors">
                  ({ratingStats.count} reviews)
                </span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className={product.stock > 0 ? "text-success-500 text-sm font-medium" : "text-red-500 text-sm font-medium"}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                ${product.price?.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${product.originalPrice?.toFixed(2)}</span>
              )}
            </div>
          </div>

          <p className="text-gray-300 text-base leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Variants */}
          {product.size?.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-white">Size</span>
                <span className="text-xs text-purple-400 cursor-pointer">Size Guide</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.size.map(sz => (
                  <button 
                    key={sz} onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${selectedSize === sz ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/50 hover:bg-white/10'}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.color?.length > 0 && (
            <div className="mb-8">
              <span className="text-sm font-medium text-white mb-3 block">Color: <span className="text-gray-400">{selectedColor}</span></span>
              <div className="flex flex-wrap gap-3">
                {product.color.map(col => (
                  <button 
                    key={col} onClick={() => setSelectedColor(col)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${selectedColor === col ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-white/5 border-white/10 text-gray-300 hover:border-pink-500/50 hover:bg-white/10'}`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <div className="flex gap-4">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl h-14">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 text-gray-400 hover:text-white h-full transition-colors">-</button>
                <span className="w-8 text-center text-white font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 text-gray-400 hover:text-white h-full transition-colors">+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${product.stock > 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/25 hover:scale-[1.02]' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                <FiShoppingCart size={20} /> {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button 
                onClick={handleAddToWishlist}
                className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-300 group"
              >
                <FiHeart size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400">
                  <FiTruck size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Free Delivery</p>
                  <p className="text-[10px]">Over $150</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-pink-400">
                  <FiShield size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">1 Year Warranty</p>
                  <p className="text-[10px]">Guaranteed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400 hidden md:flex">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400">
                  <FiClock size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Dispatches in 24h</p>
                  <p className="text-[10px]">Fast shipping</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-white/10 pt-16 mb-20">
        <h2 className="text-2xl font-bold text-white mb-8">Customer Reviews</h2>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Stats summary */}
          <div className="w-full md:w-1/3 glass-card p-8 h-fit">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl font-bold text-white">{ratingStats.average.toFixed(1)}</div>
              <div>
                <div className="flex text-yellow-400 text-lg mb-1">
                  {[...Array(5)].map((_, i) => <FiStar key={i} className={i < Math.round(ratingStats.average) ? "fill-current" : "text-gray-600"} />)}
                </div>
                <p className="text-gray-400 text-sm">Based on {ratingStats.count} reviews</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[5,4,3,2,1].map(stars => {
                const count = ratingStats.distribution[stars] || 0;
                const percent = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-sm">
                    <div className="w-10 flex text-gray-400 font-medium">{stars} <FiStar className="ml-1 mt-0.5 text-yellow-400 fill-current" size={14}/></div>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="w-8 text-right text-gray-500 text-xs">{count}</div>
                  </div>
                );
              })}
            </div>
            
            <button onClick={() => {
              const reviewText = window.prompt("Write your review:");
              const ratingText = window.prompt("Rate 1-5:");
              if(reviewText && ratingText && !isNaN(ratingText)) {
                submitReview({ productId: product._id, userId: user?.id || 'anonymous', userName: user?.name || 'Anonymous User', rating: Number(ratingText), review: reviewText })
                  .then(() => { toast.success('Review submitted!'); setTimeout(() => window.location.reload(), 1000); })
                  .catch(err => toast.error(err.response?.data?.error || 'Failed to submit review'));
              }
            }} className="w-full btn-secondary mt-8 border-purple-500/30 text-purple-300 hover:text-white">
              Write a Review
            </button>
          </div>

          {/* Review List */}
          <div className="flex-1 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-400 italic">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="border-b border-white/5 pb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300 font-bold border border-purple-500/20">
                        {review.userName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{review.userName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex text-yellow-400 text-sm">
                      {[...Array(5)].map((_, i) => <FiStar key={i} className={i < review.rating ? "fill-current" : "text-gray-700"} />)}
                    </div>
                  </div>
                  {review.title && <h4 className="font-semibold text-gray-200 mt-3 mb-1">{review.title}</h4>}
                  <p className="text-gray-400 text-sm leading-relaxed mt-2">{review.review}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="border-t border-white/10 pt-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-white">You Might Also Like</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {similar.map(prod => (
              <Link key={prod._id} to={`/product/${prod._id}`} className="product-card group block">
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <img src={prod.images?.[0] || 'https://via.placeholder.com/300'} alt={prod.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">{prod.name}</h3>
                  <p className="text-purple-400 font-bold">${prod.price?.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
