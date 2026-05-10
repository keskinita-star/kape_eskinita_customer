import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const isUnavailable = !product.available || product.stock <= 0;

  return (
    <div onClick={() => !isUnavailable && navigate(`/product/${product.id}`)}
      style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #e8e2d9", cursor: isUnavailable?"not-allowed":"pointer", opacity: isUnavailable?0.6:1, position:"relative" }}>
      {/* Sale badge */}
      {product.onSale && !isUnavailable && (
        <div style={{ position:"absolute", top:8, left:8, background:"#dc2626", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, zIndex:1 }}>SALE</div>
      )}
      {isUnavailable && (
        <div style={{ position:"absolute", top:8, right:8, background:"#6b6860", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, zIndex:1 }}>SOLD OUT</div>
      )}

      {/* Photo */}
      <div style={{ width:"100%", aspectRatio:"1", background:"#f5f3ee", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {product.photoUrl
          ? <img src={product.photoUrl} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:36 }}>☕</span>}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#1a1814", marginBottom:3, lineHeight:1.3 }}>{product.name}</div>
        {/* Stars */}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
          <span style={{ fontSize:10, color:"#f59e0b" }}>{"★".repeat(Math.round(product.rating||4))}{"☆".repeat(5-Math.round(product.rating||4))}</span>
          <span style={{ fontSize:10, color:"#9a9690" }}>({product.ratingCount||0})</span>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#1a1814" }}>
          {product.onSale
            ? <><span style={{ color:"#dc2626" }}>{formatCurrency(product.salePrice||product.price)}</span> <span style={{ fontSize:11, color:"#9a9690", textDecoration:"line-through" }}>{formatCurrency(product.price)}</span></>
            : `from ${formatCurrency(product.price)}`
          }
        </div>
      </div>
    </div>
  );
}