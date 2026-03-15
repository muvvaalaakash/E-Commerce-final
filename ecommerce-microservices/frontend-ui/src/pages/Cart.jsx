import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, processPayment } from '../api';
import { FiTrash2, FiArrowRight, FiShield, FiCreditCard, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, updateQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState('normal');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const deliveryFee = deliveryType === 'express' ? 14.99 : 4.99;
  const subtotal = cart.total || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    if (!cart.items?.length) return;
    setCheckingOut(true);
    try {
      // 1. Create order
      const orderRes = await createOrder({
        userId: user.id,
        items: cart.items.map(i => ({ productId: i.productId, name: i.name, image: i.image, price: i.price, quantity: i.quantity, size: i.size, color: i.color })),
        shippingAddress,
        deliveryType
      });
      const orderId = orderRes.data.order._id;

      // 2. Process mock payment
      const paymentPayload = {
        orderId, 
        userId: user.id, 
        amount: total, 
        method: paymentMethod, 
      };
      
      if (paymentMethod === 'credit_card') {
        paymentPayload.cardNumber = paymentDetails.cardNumber || '1234123412341234';
      }
      
      const payRes = await processPayment(paymentPayload);

      if (payRes.data.success) {
        toast.success('Order placed successfully!');
        await clear();
        navigate('/orders');
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (err) {
      toast.error('Checkout failed');
      console.error(err);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!cart.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
          <FiShoppingCart size={40} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Discover our premium collection and find something you love.</p>
        <Link to="/products" className="btn-primary inline-block">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cart Items */}
        <div className="flex-1 space-y-6">
          {cart.items.map(item => (
            <div key={item._id} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link to={`/product/${item.productId}`} className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/product/${item.productId}`}>
                      <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors line-clamp-1">{item.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.size && <span className="mr-3">Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-white">${item.price?.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-lg h-10 w-32">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="flex-1 text-gray-400 hover:text-white transition-colors">-</button>
                    <span className="flex-1 text-center font-medium text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="flex-1 text-gray-400 hover:text-white transition-colors">+</button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-2 p-2"
                  >
                    <FiTrash2 /> <span className="hidden sm:inline text-sm font-medium">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="glass-card p-6 sm:p-8 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal ({cart.count} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Delivery Fee ({deliveryType === 'express' ? 'Express' : 'Standard'})</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm text-gray-400 mb-3">Shipping Information</p>
                <div className="space-y-3 animate-fade-in">
                  <input 
                    type="text" required placeholder="Full Name" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    value={shippingAddress.name} onChange={e => setShippingAddress({...shippingAddress, name: e.target.value})}
                  />
                  <input 
                    type="text" required placeholder="Street Address" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    value={shippingAddress.address} onChange={e => setShippingAddress({...shippingAddress, address: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" required placeholder="City" 
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                    />
                    <input 
                      type="text" required placeholder="State" 
                      className="w-1/4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})}
                    />
                    <input 
                      type="text" required placeholder="ZIP" 
                      className="w-1/4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                      value={shippingAddress.zipCode} onChange={e => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm text-gray-400 mb-3">Delivery Options</p>
                <div className="space-y-3">
                  <label className={`flex items-start p-3 rounded-xl cursor-pointer border transition-all ${deliveryType === 'normal' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <input type="radio" name="delivery" checked={deliveryType === 'normal'} onChange={() => setDeliveryType('normal')} className="mt-1 accent-purple-500"/>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-white">Standard Delivery</span>
                        <span className="text-sm text-gray-300">$4.99</span>
                      </div>
                      <span className="text-xs text-gray-400">3-5 business days</span>
                    </div>
                  </label>
                  <label className={`flex items-start p-3 rounded-xl cursor-pointer border transition-all ${deliveryType === 'express' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <input type="radio" name="delivery" checked={deliveryType === 'express'} onChange={() => setDeliveryType('express')} className="mt-1 accent-purple-500"/>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-white">Express Delivery</span>
                        <span className="text-sm text-gray-300">$14.99</span>
                      </div>
                      <span className="text-xs text-gray-400">1-2 business days</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-sm text-gray-400 mb-3">Payment Method</p>
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === 'credit_card' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                  >
                    Credit / Debit Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === 'upi' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                  >
                    UPI
                  </button>
                </div>
                
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 animate-fade-in">
                    <input 
                      type="text" 
                      placeholder="Card Number" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      value={paymentDetails.cardNumber}
                      onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                    />
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        value={paymentDetails.expiryDate}
                        onChange={e => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="CVV" 
                        className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        maxLength="4"
                        value={paymentDetails.cvv}
                        onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'upi' && (
                  <div className="animate-fade-in">
                    <input 
                      type="text" 
                      placeholder="Enter UPI ID (e.g. name@bank)" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      value={paymentDetails.upiId}
                      onChange={e => setPaymentDetails({...paymentDetails, upiId: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-gray-300">Total</span>
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={checkingOut}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
            >
              {checkingOut ? 'Processing...' : (
                <>Secure Checkout <FiArrowRight /></>
              )}
            </button>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiShield className="text-green-400"/> Secure end-to-end encryption
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiCreditCard className="text-blue-400"/> Authentic payment gateways
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
