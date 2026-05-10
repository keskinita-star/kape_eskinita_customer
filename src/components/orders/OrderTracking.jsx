import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listenToOrder } from "../../services/customerOrderService";
import { formatCurrency, formatTime } from "../../utils/formatters";
import TopBar from "../common/TopBar";

const STEPS = [
  { key:"ordered", label:"Order Placed", icon:"📋", desc:"We received your order!" },
  { key:"preparing", label:"Preparing", icon:"👨‍🍳", desc:"Your drinks are being made" },
  { key:"ready", label:"Ready for Pickup", icon:"✅", desc:"Come pick up your order!" },
];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const unsub = listenToOrder(id, setOrder);
    return unsub;
  }, [id]);

  if (!order) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#9a9690", fontSize:13 }}>Loading order...</div>;

  const currentStep = STEPS.findIndex(s => s.key === order.status);
  const isReady = order.status === "ready";

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:100 }}>
      <TopBar title="Order Tracking" back />

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
        {/* Status Card */}
        <div style={{ background: isReady?"#f0fdf4":"#1a1814", borderRadius:20, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:8 }}>{STEPS[Math.max(0,currentStep)].icon}</div>
          <div style={{ fontSize:18, fontWeight:700, color: isReady?"#166534":"#fff", marginBottom:4 }}>
            {STEPS[Math.max(0,currentStep)].label}
          </div>
          <div style={{ fontSize:13, color: isReady?"#166534":"#9a9690" }}>
            {STEPS[Math.max(0,currentStep)].desc}
          </div>
          {isReady && (
            <div style={{ marginTop:12, padding:"8px 16px", background:"#166534", borderRadius:20, display:"inline-block" }}>
              <span style={{ color:"#fff", fontSize:12, fontWeight:600 }}>🎉 Your order is ready!</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #e8e2d9" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#9a9690", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:16 }}>Order Progress</div>
          {STEPS.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} style={{ display:"flex", gap:14, marginBottom: i < STEPS.length-1 ? 0 : 0 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background: done?"#1a1814":"#f5f3ee", border: done?"none":"1px solid #e8e2d9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                    {done ? <span style={{ color:"#fff", fontSize:14 }}>✓</span> : <span>{step.icon}</span>}
                  </div>
                  {i < STEPS.length-1 && <div style={{ width:2, height:32, background: i < currentStep?"#1a1814":"#e8e2d9", margin:"4px 0" }} />}
                </div>
                <div style={{ paddingTop:6, paddingBottom: i < STEPS.length-1 ? 24 : 0 }}>
                  <div style={{ fontSize:13, fontWeight: active?700:500, color: done?"#1a1814":"#9a9690" }}>{step.label}</div>
                  {active && <div style={{ fontSize:11, color:"#6b6860", marginTop:2 }}>{step.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items */}
        <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #e8e2d9" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#9a9690", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Your Order</div>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i<order.items.length-1?"1px solid #f5f3ee":"none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:"#1a1814" }}>{item.name} × {item.qty}</div>
                {item.addons?.length > 0 && <div style={{ fontSize:11, color:"#9a9690" }}>+ {item.addons.map(a=>a.label).join(", ")}</div>}
                <div style={{ fontSize:11, color:"#4a3d8f" }}>🕐 {item.pickupTime}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:"#1a1814" }}>{formatCurrency(item.finalPrice * item.qty)}</div>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, paddingTop:12, borderTop:"1px solid #f0ede8" }}>
            <span style={{ fontSize:14, fontWeight:700, color:"#1a1814" }}>Total</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#1a1814" }}>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {order.note && (
          <div style={{ background:"#fff", borderRadius:14, padding:14, border:"1px solid #e8e2d9" }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#9a9690", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Note</div>
            <div style={{ fontSize:13, color:"#6b6860" }}>{order.note}</div>
          </div>
        )}
      </div>
    </div>
  );
}