import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const TABS = [
  { path:"/", icon:"🏠", label:"Home" },
  { path:"/orders", icon:"📦", label:"Orders" },
  { path:"/cart", icon:"🛒", label:"Cart" },
  { path:"/profile", icon:"👤", label:"Profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { itemCount } = useCart();

  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#fff", borderTop:"1px solid #e8e2d9", display:"grid", gridTemplateColumns:"repeat(4,1fr)", zIndex:50, paddingBottom:"env(safe-area-inset-bottom)" }}>
      {TABS.map(tab => {
        const active = pathname === tab.path || (tab.path !== "/" && pathname.startsWith(tab.path));
        const isCart = tab.path === "/cart";
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0 8px", border:"none", background:"none", cursor:"pointer", position:"relative" }}>
            <div style={{ position:"relative" }}>
              <span style={{ fontSize:22 }}>{tab.icon}</span>
              {isCart && itemCount > 0 && (
                <span style={{ position:"absolute", top:-4, right:-8, background:"#dc2626", color:"#fff", fontSize:9, fontWeight:700, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span style={{ fontSize:10, fontWeight: active?700:400, color: active?"#1a1814":"#9a9690", marginTop:2 }}>{tab.label}</span>
            {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:20, height:2, background:"#1a1814", borderRadius:2 }} />}
          </button>
        );
      })}
    </div>
  );
}