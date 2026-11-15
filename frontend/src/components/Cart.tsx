import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const DISCOUNT_RATE = 0.05;
const SHIPPING_COST = 10;

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

export default function Cart() {
  const { items, itemCount, updateQuantity, removeItem } = useCart();
  const { darkMode } = useTheme();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = roundCurrency(subtotal * DISCOUNT_RATE);
  const shipping = items.length > 0 ? SHIPPING_COST : 0;
  const grandTotal = subtotal - discount + shipping;
  const panelClasses = darkMode
    ? 'bg-gray-800 border-gray-700 text-light'
    : 'bg-white border-gray-200 text-gray-800';

  const applyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCouponMessage(
      couponCode.trim()
        ? 'The 5% discount is already included in your order.'
        : 'Enter a coupon code to apply.',
    );
  };

  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 transition-colors duration-300 ${darkMode ? 'bg-dark' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-light' : 'text-gray-800'}`}>
          Shopping Cart
        </h1>
        {items.length === 0 ? (
          <div className={`rounded-lg border p-10 text-center shadow-sm ${panelClasses}`}>
            <p className="text-xl font-semibold">Your cart is empty</p>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Add products to your cart to see them here.
            </p>
            <Link
              to="/products"
              className="inline-flex mt-6 rounded-full bg-primary hover:bg-accent text-white font-medium px-6 py-3 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <section className={`rounded-lg border shadow-sm overflow-hidden ${panelClasses}`} aria-label="Cart items">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-center">
                  <thead className={darkMode ? 'bg-gray-900/70' : 'bg-gray-100'}>
                    <tr>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">S. No.</th>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">Product Image</th>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">Product Name</th>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">Unit Price</th>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">Quantity</th>
                      <th scope="col" className="border-b border-r border-gray-700 px-4 py-3">Total</th>
                      <th scope="col" className="border-b border-gray-700 px-4 py-3">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.productId} className="border-b border-gray-700/70 last:border-0">
                        <td className="border-r border-gray-700/70 px-4 py-3 font-semibold">{index + 1}</td>
                        <td className="border-r border-gray-700/70 px-4 py-2">
                          <img
                            src={`/${item.imgName}`}
                            alt={item.name}
                            className="mx-auto h-20 w-24 object-contain"
                          />
                        </td>
                        <td className="border-r border-gray-700/70 px-4 py-3 font-semibold">{item.name}</td>
                        <td className="border-r border-gray-700/70 px-4 py-3 font-semibold">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="border-r border-gray-700/70 px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) => {
                              const quantity = Number(event.target.value);
                              if (Number.isInteger(quantity) && quantity > 0) {
                                updateQuantity(item.productId, quantity);
                              }
                            }}
                            aria-label={`Quantity of ${item.name}`}
                            className={`w-16 rounded-lg border px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-primary ${
                              darkMode
                                ? 'bg-gray-900 border-gray-600 text-light'
                                : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          />
                        </td>
                        <td className="border-r border-gray-700/70 px-4 py-3 font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="text-lime-500 hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-primary rounded p-2"
                          >
                            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 border-t border-gray-700/70">
                <form onSubmit={applyCoupon} className="flex w-full sm:max-w-md">
                  <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
                  <input
                    id="coupon-code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Coupon Code"
                    className={`min-w-0 flex-1 rounded-l-full border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-light placeholder:text-gray-500'
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  />
                  <button type="submit" className="rounded-r-full bg-primary hover:bg-accent text-white font-medium px-4 transition-colors">
                    Apply Coupon
                  </button>
                </form>
                <p className="text-sm text-right" role="status" aria-live="polite">
                  {couponMessage}
                </p>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </section>

            <aside className={`rounded-lg border shadow-sm overflow-hidden ${panelClasses}`}>
              <h2 className="text-2xl font-bold text-center px-4 py-4 border-b border-gray-700/70">
                Order Summary
              </h2>
              <dl className="divide-y divide-gray-700/70">
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="font-semibold">Subtotal</dt>
                  <dd>{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="font-semibold">Discount (5%)</dt>
                  <dd>-{formatCurrency(discount)}</dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="font-semibold">Shipping</dt>
                  <dd>{formatCurrency(shipping)}</dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt className="font-semibold">Grand Total</dt>
                  <dd className="font-semibold">{formatCurrency(grandTotal)}</dd>
                </div>
              </dl>
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setCheckoutMessage('Checkout is not available yet.')}
                  className="w-full rounded-full bg-gradient-to-r from-primary to-lime-500 hover:brightness-110 text-white font-medium px-4 py-3 transition"
                >
                  Proceed To Checkout
                </button>
                {checkoutMessage && (
                  <p className="mt-3 text-center text-sm" role="status">{checkoutMessage}</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
