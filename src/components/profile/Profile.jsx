import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { LOYALTY_GOAL } from "../../utils/constants";
import TopBar from "../common/TopBar";

export default function Profile() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  const points = customer?.loyaltyPoints || 0;
  const progress = Math.min(100, (points / LOYALTY_GOAL) * 100);
  const pointsLeft = Math.max(0, LOYALTY_GOAL - points);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const StatCard = ({ label, value }) => (
    <div style={{ background:"#f5f3ee", borderRadius:12, padding:"14px 16px", textAlign:"center", flex:1 }}>
      <div style={{ fontSize:18, fontWeight:700, color:"#1a1814" }}>{value}</div>
      <div style={{ fontSize:11, color:"#9a9690", marginTop:2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:80 }}>
      <TopBar title="Profile" />

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
        {/* Avatar & Name */}
        <div style={{ background:"#1a1814", borderRadius:20, padding:24, textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#2d2260", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 12px" }}>
            {customer?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:"#f5f3ee" }}>{customer?.name}</div>
          <div style={{ fontSize:13, color:"#6b6860", marginTop:2 }}>{customer?.email}</div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:10 }}>
          <StatCard label="Total Orders" value={customer?.totalOrders || 0} />
          <StatCard label="Total Spent" value={formatCurrency(customer?.totalSpent || 0)} />
          <StatCard label="Points" value={points} />
        </div>

        {/* Loyalty */}
        <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #e8e2d9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#1a1814" }}>⭐ Loyalty Rewards</div>
            <div style={{ fontSize:12, color:"#4a3d8f", fontWeight:600 }}>{points} / {LOYALTY_GOAL} pts</div>
          </div>
          <div style={{ background:"#f5f3ee", borderRadius:20, height:10, overflow:"hidden", marginBottom:10 }}>
            <div style={{ width:`${progress}%`, background:"linear-gradient(90deg, #2d2260, #4a3d8f)", height:"100%", borderRadius:20, transition:"width 0.5s" }} />
          </div>
          {pointsLeft > 0
            ? <div style={{ fontSize:12, color:"#9a9690" }}>🎯 {pointsLeft} more points for a <strong style={{ color:"#4a3d8f" }}>FREE drink!</strong></div>
            : <div style={{ fontSize:12, color:"#166534", fontWeight:600 }}>🎉 You've earned a free drink! Show this to the cashier.</div>
          }
          <div style={{ marginTop:12, padding:"10px 14px", background:"#f5f3ee", borderRadius:10, fontSize:11, color:"#9a9690" }}>
            💡 Earn 1 point for every ₱10 spent
          </div>
        </div>

        {/* Settings */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e8e2d9", overflow:"hidden" }}>
          {[
            { icon:"📦", label:"My Orders", action:() => navigate("/orders") },
            { icon:"🔔", label:"Notifications", action:() => {} },
            { icon:"❓", label:"Help & Support", action:() => {} },
            { icon:"📄", label:"Terms & Privacy", action:() => {} },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", border:"none", background:"none", borderBottom: i<arr.length-1?"1px solid #f5f3ee":"none", cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:14, color:"#1a1814", fontWeight:500, flex:1 }}>{item.label}</span>
              <span style={{ color:"#9a9690" }}>›</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ width:"100%", padding:"13px", borderRadius:12, background:"#fff", color:"#dc2626", border:"1px solid #fca5a5", fontSize:14, fontWeight:600, cursor:"pointer" }}>
          Sign Out
        </button>

        <div style={{ textAlign:"center", fontSize:11, color:"#9a9690" }}>Kape Eskinita v1.0.0</div>
      </div>
    </div>
  );
}