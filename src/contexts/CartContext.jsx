import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { customer } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (!customer) return;

    const guestDrafts = JSON.parse(localStorage.getItem("guestCartDraft") || "[]");
    if (!guestDrafts.length) return;

    setCart(prev => {
      const merged = [...prev];

      guestDrafts.forEach(item => {
        const key = `${item.productId}-${item.size}-${(item.addons || []).map(a => a.id).join(",")}`;
        const existing = merged.find(i => i.cartKey === key);
        if (existing) {
          existing.qty += item.qty;
          return;
        }
        merged.push({ ...item, cartKey: key });
      });

      return merged;
    });

    localStorage.removeItem("guestCartDraft");
  }, [customer]);

  const addToCart = (item) => {
    setCart(prev => {
      const key = `${item.productId}-${item.size}-${(item.addons||[]).map(a=>a.id).join(",")}`;
      const existing = prev.find(i => i.cartKey === key);
      if (existing) return prev.map(i => i.cartKey === key ? { ...i, qty: i.qty + item.qty } : i);
      return [...prev, { ...item, cartKey: key }];
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev
      .map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  const clearCart = () => setCart([]);
  const total = cart.reduce((s, i) => s + i.finalPrice * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);