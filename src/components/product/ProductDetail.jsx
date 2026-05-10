import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { rtdb } from "../../services/firebase";
import { useCart } from "../../contexts/CartContext";
import { SIZES, ADDONS, PICKUP_SLOTS, NO_SIZE_CATEGORIES } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [pickupTime, setPickupTime] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    get(ref(rtdb, `products/${id}`)).then(snap => {
      if (snap.exists()) setProduct({ id, ...snap.val() });
      setLoading(false);
    });
  }, [id]);

  const needsSize = product && !NO_SIZE_CATEGORIES.includes(product.category);
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const sizePrice = needsSize ? selectedSize.priceAdd : 0;
  const unitPrice = product ? product.price + sizePrice + addonTotal : 0;
  const totalPrice = unitPrice * qty;

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (!pickupTime) return toast.error("Please select a pickup time.");
    addToCart({
      productId: product.id,
      name: needsSize ? `${product.name} (${selectedSize.label})` : product.name,
      photo: product.photoUrl,
      size: needsSize ? selectedSize.label : null,
      addons: selectedAddons,
      pickupTime,
      finalPrice: unitPrice,
      qty,
    });
    toast.success("Added to cart! 🛒");
    navigate(-1);
  };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#9a9690", fontSize:13 }}>Loading...</div>;
  if (!product) return <div style={{ padding:20, color:"#9a9690" }}>Product not found.</div>;

  const sec = (title) => (
    <div style={{ fontSize:11, fontWeight:700, color:"#9a9690", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>{title}</div>
  );

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:100 }}>
      {/* Photo */}
      <div style={{ position:"relative" }}>
        <div style={{ width:"100%", aspectRatio:"4/3", background:"#e8e2d9", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {product.photoUrl
            ? <img src={product.photoUrl} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:64 }}>☕</span>}
        </div>
        <button onClick={() => navigate(-1)}
          style={{ position:"absolute", top:16, left:16, background:"rgba(255,255,255,0.9)", border:"none", borderRadius:"50%", width:36, height:36, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          ←
        </button>
      </div>

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:20 }}>
        {/* Title */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#1a1814", flex:1, letterSpacing:"-0.5px" }}>{product.name}</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#1a1814", marginLeft:12 }}>{formatCurrency(unitPrice)}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <span style={{ fontSize:12, color:"#f59e0b" }}>{"★".repeat(Math.round(product.rating||4))}{"☆".repeat(5-Math.round(product.rating||4))}</span>
            <span style={{ fontSize:12, color:"#9a9690" }}>({product.ratingCount||0} reviews)</span>
          </div>
          {product.description && <div style={{ fontSize:13, color:"#6b6860", marginTop:8, lineHeight:1.6 }}>{product.description}</div>}
        </div>

        {/* Recipe preview */}
        {product.recipe?.length > 0 && (
          <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
            {sec("Ingredients")}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {product.recipe.map((r, i) => (
                <span key={i} style={{ fontSize:11, padding:"4px 10px", background:"#f5f3ee", borderRadius:20, color:"#6b6860" }}>
                  {r.ingredientName} {r.quantity}{r.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        {needsSize && (
          <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
            {sec("Size")}
            <div style={{ display:"flex", gap:8 }}>
              {SIZES.map(size => {
                const price = product.price + size.priceAdd;
                const isSelected = selectedSize.label === size.label;
                return (
                  <button key={size.label} onClick={() => setSelectedSize(size)}
                    style={{ flex:1, padding:"12px 8px", borderRadius:10, border: isSelected?"2px solid #1a1814":"1px solid #e8e2d9", background: isSelected?"#1a1814":"#fff", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isSelected?"#fff":"#1a1814" }}>{size.label}</div>
                    <div style={{ fontSize:11, color: isSelected?"#d0ccc4":"#9a9690", marginTop:2 }}>{formatCurrency(price)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons */}
        <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
          {sec("Add-ons")}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ADDONS.map(addon => {
              const isSelected = selectedAddons.find(a => a.id === addon.id);
              return (
                <button key={addon.id} onClick={() => toggleAddon(addon)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", borderRadius:10, border: isSelected?"2px solid #1a1814":"1px solid #e8e2d9", background: isSelected?"#1a1814":"#fff", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:18, height:18, borderRadius:4, border: isSelected?"2px solid #fff":"2px solid #d0ccc4", background: isSelected?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {isSelected && <span style={{ fontSize:12, color:"#1a1814", fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, fontWeight:500, color: isSelected?"#fff":"#1a1814" }}>{addon.label}</span>
                  </div>
                  <span style={{ fontSize:13, color: isSelected?"#d0ccc4":"#9a9690" }}>+{formatCurrency(addon.price)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pickup Time */}
        <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
          {sec("Pickup Time")}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {PICKUP_SLOTS.map(slot => (
              <button key={slot} onClick={() => setPickupTime(slot)}
                style={{ padding:"7px 12px", borderRadius:20, fontSize:12, border: pickupTime===slot?"2px solid #1a1814":"1px solid #e8e2d9", background: pickupTime===slot?"#1a1814":"#fff", color: pickupTime===slot?"#fff":"#6b6860", cursor:"pointer", fontWeight: pickupTime===slot?600:400 }}>
                {slot}
              </button>
            ))}
          </div>
          {!pickupTime && <div style={{ fontSize:11, color:"#b45309", marginTop:8 }}>⚠️ Please select a pickup time</div>}
        </div>

        {/* Quantity */}
        <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
          {sec("Quantity")}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={() => setQty(q => Math.max(1, q-1))}
              style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #e8e2d9", background:"#f5f3ee", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600 }}>−</button>
            <span style={{ fontSize:18, fontWeight:700, color:"#1a1814", minWidth:24, textAlign:"center" }}>{qty}</span>
            <button onClick={() => setQty(q => q+1)}
              style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #e8e2d9", background:"#f5f3ee", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600 }}>+</button>
            <span style={{ fontSize:13, color:"#9a9690", marginLeft:4 }}>{formatCurrency(unitPrice)} each</span>
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"12px 20px 24px", background:"#fff", borderTop:"1px solid #e8e2d9" }}>
        <button onClick={handleAddToCart}
          style={{ width:"100%", padding:"14px", borderRadius:12, background:"#1a1814", color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>Add to Cart · {qty} item{qty>1?"s":""}</span>
          <span>{formatCurrency(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
}