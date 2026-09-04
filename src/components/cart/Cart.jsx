import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { placeCustomerOrder } from "../../services/customerOrderService";
import { updateCustomer } from "../../services/customerService";
import { formatCurrency } from "../../utils/formatters";
import { LOYALTY_POINTS_PER_PESO } from "../../utils/constants";
import TopBar from "../common/TopBar";
import toast from "react-hot-toast";
import { useState, useMemo } from "react";

// ─── Generate 15-min pickup slots from now + 15 min up to 1 AM ───────────────
function generatePickupSlots() {
  const slots = [];
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil((start.getMinutes() + 15) / 15) * 15);
  const closing = new Date(now);
  if (now.getHours() < 1) {
    closing.setHours(1, 0, 0, 0);
  } else {
    closing.setDate(closing.getDate() + 1);
    closing.setHours(1, 0, 0, 0);
  }
  const cursor = new Date(start);
  while (cursor <= closing) {
    slots.push(cursor.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    cursor.setMinutes(cursor.getMinutes() + 15);
  }
  return slots;
}

// ─── Payment options ──────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: "cash",  label: "Cash",         icon: "💵", desc: "Pay at counter" },
  { id: "gcash", label: "GCash/PayMaya", icon: "📱", desc: "Show QR at pickup" },
];

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff", borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </span>
  );
}

// ─── Confirm + Payment Modal ──────────────────────────────────────────────────
function ConfirmModal({ total, pointsEarned, itemCount, onConfirm, onCancel, placing }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center",
    }}>
      {/* Backdrop */}
      <div onClick={onCancel} style={{
        position: "absolute", inset: 0,
        background: "rgba(26,24,20,0.45)", backdropFilter: "blur(2px)",
      }} />

      {/* Sheet */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 430,
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "24px 20px 36px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e0dbd2", margin: "0 auto 20px" }} />

        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1814", marginBottom: 4 }}>Confirm Your Order</div>
        <div style={{ fontSize: 13, color: "#9a9690", marginBottom: 20 }}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} · Ready to place?
        </div>

        {/* Total */}
        <div style={{ background: "#f5f3ee", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#1a1814" }}>
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Payment Method
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {PAYMENT_METHODS.map(pm => {
              const selected = paymentMethod === pm.id;
              return (
                <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                  style={{
                    flex: 1, padding: "12px 8px", borderRadius: 12,
                    border: selected ? "2px solid #1a1814" : "1.5px solid #e8e2d9",
                    background: selected ? "#1a1814" : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{pm.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#fff" : "#1a1814" }}>{pm.label}</div>
                  <div style={{ fontSize: 10, color: selected ? "#d0ccc4" : "#9a9690", marginTop: 2 }}>{pm.desc}</div>
                </button>
              );
            })}
          </div>

          {/* GCash notice */}
          {paymentMethod === "gcash" && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 2 }}>📲 GCash / PayMaya</div>
              <div style={{ fontSize: 11, color: "#3b82f6" }}>Show your payment confirmation to the cashier when you pick up your order.</div>
            </div>
          )}
        </div>

        {/* Loyalty points */}
        <div style={{ padding: "10px 14px", background: "#eeeaf9", borderRadius: 10, fontSize: 13, color: "#4a3d8f", fontWeight: 500, marginBottom: 20 }}>
          ⭐ You'll earn <strong>{pointsEarned} loyalty points</strong> from this order!
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={placing}
            style={{
              flex: 1, padding: "13px", borderRadius: 12,
              background: "#f5f3ee", color: "#1a1814",
              border: "1px solid #e8e2d9", fontSize: 14, fontWeight: 600,
              cursor: placing ? "not-allowed" : "pointer",
            }}>
            Go Back
          </button>
          <button onClick={() => onConfirm(paymentMethod)} disabled={placing}
            style={{
              flex: 2, padding: "13px", borderRadius: 12,
              background: placing ? "#d0ccc4" : "#1a1814",
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
              cursor: placing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {placing ? <><Spinner /> Placing…</> : `Confirm · ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Cart ────────────────────────────────────────────────────────────────
export default function Cart() {
  const { cart, updateQty, clearCart, total, itemCount, updatePickupTime } = useCart();
  const { customer, setCustomer } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const pointsEarned = Math.floor(total * LOYALTY_POINTS_PER_PESO);
  const pickupSlots = useMemo(() => generatePickupSlots(), []);

  const handlePlaceOrder = async (paymentMethod) => {
    if (!customer) {
      sessionStorage.setItem("redirectAfterLogin", "/cart");
      toast.error("Please sign in or create an account to place your order.");
      navigate("/login");
      return;
    }

    if (!cart.length) return;
    setPlacing(true);
    try {
      const orderRef = await placeCustomerOrder({
        customerId:   customer.uid,
        customerName: customer.name,
        items: cart.map(i => ({
          productId:  i.productId,
          name:       i.name,
          size:       i.size,
          addons:     i.addons,
          pickupTime: i.pickupTime,
          finalPrice: i.finalPrice,
          qty:        i.qty,
        })),
        subtotal: total,
        total,
        note,
        payment: paymentMethod,   // "cash" | "gcash"
      });

      const newPoints = (customer.loyaltyPoints || 0) + pointsEarned;
      const newTotal  = (customer.totalSpent   || 0) + total;
      const newOrders = (customer.totalOrders  || 0) + 1;
      await updateCustomer(customer.uid, { loyaltyPoints: newPoints, totalSpent: newTotal, totalOrders: newOrders });
      setCustomer(c => ({ ...c, loyaltyPoints: newPoints, totalSpent: newTotal, totalOrders: newOrders }));

      clearCart();
      toast.success(`Order placed! +${pointsEarned} pts 🎉`);
      navigate(`/orders/${orderRef.key}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order.");
    } finally {
      setPlacing(false);
      setShowConfirm(false);
    }
  };

  return (
    <div style={{ background: "#f5f3ee", minHeight: "100vh", paddingBottom: 100 }}>
      <TopBar title="My Cart" back />

      {!cart.length ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1814", marginBottom: 6 }}>Your cart is empty</div>
          <div style={{ fontSize: 13, color: "#9a9690", marginBottom: 20 }}>Add some drinks to get started!</div>
          <button onClick={() => navigate("/")}
            style={{ padding: "11px 24px", borderRadius: 10, background: "#1a1814", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Cart Items */}
          {cart.map(item => (
            <div key={item.cartKey} style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1px solid #e8e2d9" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f5f3ee", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.photo
                    ? <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 24 }}>☕</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1814" }}>{item.name}</div>
                  {item.size && <div style={{ fontSize: 11, color: "#9a9690", marginTop: 1 }}>{item.size}</div>}
                  {item.addons?.length > 0 && (
                    <div style={{ fontSize: 11, color: "#9a9690", marginTop: 1 }}>+ {item.addons.map(a => a.label).join(", ")}</div>
                  )}

                  {/* Pickup Time Dropdown */}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: "#4a3d8f", fontWeight: 600, display: "block", marginBottom: 4 }}>🕐 Pickup Time</label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={item.pickupTime}
                        onChange={e => updatePickupTime(item.cartKey, e.target.value)}
                        style={{
                          width: "100%", padding: "7px 30px 7px 10px",
                          borderRadius: 8, border: "1px solid #d4c9f0",
                          background: "#f0ecfc", color: "#4a3d8f",
                          fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                          cursor: "pointer", appearance: "none", WebkitAppearance: "none", outline: "none",
                        }}>
                        {!pickupSlots.includes(item.pickupTime) && (
                          <option value={item.pickupTime}>{item.pickupTime}</option>
                        )}
                        {pickupSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#4a3d8f" }}>▼</span>
                    </div>
                  </div>

                  {/* Qty + Price */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => updateQty(item.cartKey, -1)}
                        style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid #e8e2d9", background: "#f5f3ee", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.cartKey, 1)}
                        style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid #e8e2d9", background: "#f5f3ee", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1814" }}>{formatCurrency(item.finalPrice * item.qty)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Order Note */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1px solid #e8e2d9" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9690", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Order Note</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Any special requests? (optional)"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e8e2d9", borderRadius: 8, fontSize: 13, resize: "none", height: 70, outline: "none", fontFamily: "inherit", background: "#faf9f6", boxSizing: "border-box" }} />
          </div>

          {/* Order Summary */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e8e2d9" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1814", marginBottom: 12 }}>Order Summary</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#1a1814", borderTop: "1px solid #f0ede8", paddingTop: 10 }}>
              <span>Total ({itemCount} items)</span><span>{formatCurrency(total)}</span>
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#eeeaf9", borderRadius: 8, fontSize: 12, color: "#4a3d8f", fontWeight: 500 }}>
              ⭐ You'll earn {pointsEarned} loyalty points from this order!
            </div>
          </div>
        </div>
      )}

      {/* Place Order Button */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "12px 16px", background: "#fff", borderTop: "1px solid #e8e2d9", boxSizing: "border-box" }}>
          <button onClick={() => {
            if (!customer) {
              sessionStorage.setItem("redirectAfterLogin", "/cart");
              toast.error("Please sign in or create an account to place your order.");
              navigate("/login");
              return;
            }
            setShowConfirm(true);
          }}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#1a1814", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Place Order</span>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Confirm + Payment Sheet */}
      {showConfirm && (
        <ConfirmModal
          total={total}
          pointsEarned={pointsEarned}
          itemCount={itemCount}
          placing={placing}
          onConfirm={handlePlaceOrder}
          onCancel={() => !placing && setShowConfirm(false)}
        />
      )}
    </div>
  );
}