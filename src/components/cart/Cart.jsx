import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { placeCustomerOrder } from "../../services/customerOrderService";
import { updateCustomer } from "../../services/customerService";
import { formatCurrency } from "../../utils/formatters";
import { SERVICE_FEE, LOYALTY_POINTS_PER_PESO } from "../../utils/constants";
import TopBar from "../common/TopBar";
import toast from "react-hot-toast";
import { useState } from "react";

export default function Cart() {
  const { cart, updateQty, clearCart, total, itemCount } = useCart();
  const { customer, setCustomer } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState("");

  const grandTotal = total + SERVICE_FEE;
  const pointsEarned = Math.floor(grandTotal * LOYALTY_POINTS_PER_PESO);

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const orderRef = await placeCustomerOrder({
        customerId: customer.uid,
        customerName: customer.name,
        items: cart.map(i => ({
          productId: i.productId,
          name: i.name,
          size: i.size,
          addons: i.addons,
          pickupTime: i.pickupTime,
          finalPrice: i.finalPrice,
          qty: i.qty,
        })),
        subtotal: total,
        serviceFee: SERVICE_FEE,
        total: grandTotal,
        note,
        status: "ordered",
      });

      // Update loyalty points
      const newPoints = (customer.loyaltyPoints || 0) + pointsEarned;
      const newTotal = (customer.totalSpent || 0) + grandTotal;
      const newOrders = (customer.totalOrders || 0) + 1;
      await updateCustomer(customer.uid, { loyaltyPoints: newPoints, totalSpent: newTotal, totalOrders: newOrders });
      setCustomer(c => ({ ...c, loyaltyPoints: newPoints, totalSpent: newTotal, totalOrders: newOrders }));

      clearCart();
      toast.success(`Order placed! +${pointsEarned} pts 🎉`);
      navigate(`/orders/${orderRef.key}`);
    } catch (err) {
      toast.error("Failed to place order.");
    } finally { setPlacing(false); }
  };

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:100 }}>
      <TopBar title="My Cart" back />

      {!cart.length ? (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🛒</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#1a1814", marginBottom:6 }}>Your cart is empty</div>
          <div style={{ fontSize:13, color:"#9a9690", marginBottom:20 }}>Add some drinks to get started!</div>
          <button onClick={() => navigate("/")}
            style={{ padding:"11px 24px", borderRadius:10, background:"#1a1814", color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {/* Items */}
          {cart.map(item => (
            <div key={item.cartKey} style={{ background:"#fff", borderRadius:14, padding:14, border:"1px solid #e8e2d9" }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:56, height:56, borderRadius:10, background:"#f5f3ee", overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.photo
                    ? <img src={item.photo} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <span style={{ fontSize:24 }}>☕</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1a1814" }}>{item.name}</div>
                  {item.addons?.length > 0 && (
                    <div style={{ fontSize:11, color:"#9a9690", marginTop:2 }}>+ {item.addons.map(a=>a.label).join(", ")}</div>
                  )}
                  <div style={{ fontSize:11, color:"#4a3d8f", marginTop:2 }}>🕐 Pickup: {item.pickupTime}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={() => updateQty(item.cartKey, -1)}
                        style={{ width:24, height:24, borderRadius:"50%", border:"1px solid #e8e2d9", background:"#f5f3ee", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                      <span style={{ fontSize:13, fontWeight:600 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.cartKey, 1)}
                        style={{ width:24, height:24, borderRadius:"50%", border:"1px solid #e8e2d9", background:"#f5f3ee", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1814" }}>{formatCurrency(item.finalPrice * item.qty)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Note */}
          <div style={{ background:"#fff", borderRadius:14, padding:14, border:"1px solid #e8e2d9" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9a9690", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Order Note</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any special requests? (optional)"
              style={{ width:"100%", padding:"10px 12px", border:"1px solid #e8e2d9", borderRadius:8, fontSize:13, resize:"none", height:70, outline:"none", fontFamily:"inherit", background:"#faf9f6" }} />
          </div>

          {/* Summary */}
          <div style={{ background:"#fff", borderRadius:14, padding:16, border:"1px solid #e8e2d9" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#1a1814", marginBottom:12 }}>Order Summary</div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6b6860", marginBottom:6 }}><span>Subtotal ({itemCount} items)</span><span>{formatCurrency(total)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6b6860", marginBottom:10 }}><span>Service Fee</span><span>{formatCurrency(SERVICE_FEE)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700, color:"#1a1814", borderTop:"1px solid #f0ede8", paddingTop:10 }}><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
            <div style={{ marginTop:10, padding:"8px 12px", background:"#eeeaf9", borderRadius:8, fontSize:12, color:"#4a3d8f", fontWeight:500 }}>
              ⭐ You'll earn {pointsEarned} loyalty points from this order!
            </div>
          </div>
        </div>
      )}

      {/* Place Order */}
      {cart.length > 0 && (
        <div style={{ position:"fixed", bottom:70, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"12px 16px", background:"#fff", borderTop:"1px solid #e8e2d9" }}>
          <button onClick={handlePlaceOrder} disabled={placing}
            style={{ width:"100%", padding:"14px", borderRadius:12, background: placing?"#d0ccc4":"#1a1814", color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor: placing?"not-allowed":"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>{placing ? "Placing order..." : "Place Order"}</span>
            <span>{formatCurrency(grandTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}