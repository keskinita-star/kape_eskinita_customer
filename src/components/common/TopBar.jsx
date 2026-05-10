import { useNavigate } from "react-router-dom";

export default function TopBar({ title, back, right }) {
  const navigate = useNavigate();
  return (
    <div style={{ position:"sticky", top:0, zIndex:40, background:"#fff", borderBottom:"1px solid #e8e2d9", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {back && (
          <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#1a1814", padding:0, lineHeight:1 }}>←</button>
        )}
        <span style={{ fontSize:16, fontWeight:700, color:"#1a1814", letterSpacing:"-0.3px" }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}