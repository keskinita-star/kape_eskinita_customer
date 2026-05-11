import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { rtdb } from "../../services/firebase";
import { useCart } from "../../contexts/CartContext";
import { SIZES, NO_SIZE_CATEGORIES, getAddonsForProduct } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

function generatePickupSlots() {
  const slots = [];
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil((start.getMinutes() + 15) / 15) * 15);
  // Closing at 1 AM next day
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

  const pickupSlots = useMemo(() => generatePickupSlots(), []);

  useEffect(() => {
    if (pickupSlots.length > 0 && !pickupTime) setPickupTime(pickupSlots[0]);
  }, [pickupSlots]);

  useEffect(() => {
    get(ref(rtdb, `products/${id}`)).then(snap => {
      if (snap.exists()) setProduct({ id, ...snap.val() });
      setLoading(false);
    });
  }, [id]);

  const availableAddons = useMemo(
    () => product ? getAddonsForProduct(product.category, product.name) : [],
    [product]
  );

  useEffect(() => {
    setSelectedAddons(prev => prev.filter(a => availableAddons.find(av => av.id === a.id)));
  }, [availableAddons]);

  const needsSize = product && !NO_SIZE_CATEGORIES.includes(product.category);
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const sizePrice = needsSize ? selectedSize.priceAdd : 0;
  const unitPrice = product ? product.price + sizePrice + addonTotal : 0;
  const totalPrice = unitPrice * qty;

  const toggleAddon = (addon) =>
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );

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

  const isClosed = pickupSlots.length === 0;

  return (
    <div style={{ background:"#f5f3ee", minHeight:"100vh", paddingBottom:110 }}>

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

        {/* Ingredients */}
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
                const isSelected = selectedSize.label === size.label;
                return (
                  <button key={size.label} onClick={() => setSelectedSize(size)}
                    style={{ flex:1, padding:"12px 8px", borderRadius:10, border: isSelected?"2px solid #1a1814":"1px solid #e8e2d9", background: isSelected?"#1a1814":"#fff", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isSelected?"#fff":"#1a1814" }}>{size.label}</div>
                    <div style={{ fontSize:11, color: isSelected?"#d0ccc4":"#9a9690", marginTop:2 }}>{formatCurrency(product.price + size.priceAdd)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons — only rendered if this product type has relevant ones */}
        {availableAddons.length > 0 && (
          <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
            {sec("Add-ons")}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {availableAddons.map(addon => {
                const isSelected = !!selectedAddons.find(a => a.id === addon.id);
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
        )}

        {/* Pickup Time */}
        <div style={{ background:"#fff", borderRadius:12, padding:16 }}>
          {sec("Pickup Time")}
          {isClosed ? (
            <div style={{ padding:"12px 14px", background:"#fef3cd", borderRadius:10, fontSize:13, color:"#92400e", fontWeight:500 }}>
              ⏰ Sorry, we're closed for orders right now. Come back tomorrow!
            </div>
          ) : (
            <>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none", zIndex:1 }}>🕐</span>
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  style={{ width:"100%", padding:"12px 40px 12px 36px", borderRadius:10, border:"1.5px solid #d4c9f0", background:"#f0ecfc", color:"#4a3d8f", fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:"pointer", appearance:"none", WebkitAppearance:"none", outline:"none", boxSizing:"border-box" }}>
                  {pickupSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
                <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#4a3d8f", pointerEvents:"none" }}>▼</span>
              </div>
              <div style={{ fontSize:11, color:"#9a9690", marginTop:8 }}>Slots every 15 min · Minimum 15 min prep time</div>
            </>
          )}
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

      {/* Add to Cart — sits above bottom nav bar */}
      <div style={{ position:"fixed", bottom:70, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"12px 20px", background:"#fff", borderTop:"1px solid #e8e2d9", boxSizing:"border-box", zIndex:50 }}>
        <button onClick={handleAddToCart} disabled={isClosed}
          style={{ width:"100%", padding:"14px", borderRadius:12, background: isClosed?"#d0ccc4":"#1a1814", color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor: isClosed?"not-allowed":"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>Add to Cart · {qty} item{qty>1?"s":""}</span>
          <span>{formatCurrency(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
}