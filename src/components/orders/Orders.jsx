import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { getCustomerOrders } from "../../services/customerOrderService";
import { formatCurrency, formatDate, formatTime } from "../../utils/formatters";
import TopBar from "../common/TopBar";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  ordered:   { bg:"#f0f9ff", color:"#0369a1", label:"Ordered" },
  preparing: { bg:"#fff7ed", color:"#b45309", label:"Preparing" },
  ready:     { bg:"#f0fdf4", color:"#166534", label:"Ready!" },
  completed: { bg:"#f5f3ee", color:"#6b6860", label:"Completed" },
};

export default function Orders() {
  const { customer } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerOrders(customer.uid).then(o => { setOrders(o); setLoading(false); });
  }, [customer.uid]);

  const activeOrders = orders.filter(o => ["ordered","preparing","ready"].includes(o.status));
  const pastOrders = orders.filter(o => o.status === "completed");

  const handleReorder = (order) => {
    order.items.forEach(item => {
      addToCart({
        productId: item.productId,
        name: item.name,
        photo: "",
        size: item.size,
        addons: item.addons || [],
        pickupTime: "",
        finalPrice: item.finalPrice,
        qty: item.qty,
      });
    });
    toast.success("Items added to cart!");
    navigate("/cart");
  };

  const OrderCard = ({ order, showTrack }) => {
    const st = STATUS_STYLES[order.status] || STATUS_STYLES.completed;
    return (
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e8e2d9", overflow:"hidden" }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #f5f3ee", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"#9a9690" }}>{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1a1814", marginTop:2 }}>{order.items?.length} item{order.items?.length>1?"s":""}</div>
          </div>
          <span style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20, background:st.bg, color:st.color }}>{st.label}</span>
        </div>
        <div style={{ padding:"10px 14px" }}>
          {order.items?.slice(0,2).map((item, i) => (
            <div key={i} style={{ fontSize:12, color:"#6b6860", marginBottom:2 }}>{item.name} × {item.qty}</div>
          ))}
          {order.items?.length > 2 && <div style={{ fontSize:12, color:"#9a9690" }}>+{order.items.length-2} more</div>}
        </div>
        <div style={{ padding:"10px 14px", borderTop:"1px solid #f5f3ee", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a1814" }}>{formatCurrency(order.total)}</div>
          <div style={{ display:"flex", gap:8 }}>
            {showTrack && (
              <button onClick={() => navigate(`/orders/${order.id}`)}
                style={{ padding:"6px 12px", borderRadius:8, background:"#1a1814", color:"#fff", border:"none", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Track
              </button>
            )}
            {order.status === "completed" && (
              <button onClick={() => handleReorder(order)}
                style={{ padding:"6px 12px", borderRadius:8, background:"#f5f3ee", color:"#1a1814", border:"1px solid #e8e2d9", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Reorder
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:80 }}>
      <TopBar title="My Orders" />

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#9a9690", fontSize:13 }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#1a1814", marginBottom:6 }}>No orders yet</div>
          <div style={{ fontSize:13, color:"#9a9690", marginBottom:20 }}>Start ordering your favorite drinks!</div>
          <button onClick={() => navigate("/")} style={{ padding:"11px 24px", borderRadius:10, background:"#1a1814", color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer" }}>Browse Menu</button>
        </div>
      ) : (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:20 }}>
          {activeOrders.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1814", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>Active Orders</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {activeOrders.map(o => <OrderCard key={o.id} order={o} showTrack />)}
              </div>
            </div>
          )}
          {pastOrders.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1814", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>Past Orders</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {pastOrders.map(o => <OrderCard key={o.id} order={o} showTrack={false} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}