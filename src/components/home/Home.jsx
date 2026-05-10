import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { rtdb } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency } from "../../utils/formatters";
import ProductCard from "../common/ProductCard";

// Fetches products and cross-checks ingredient stock to compute availability
const loadProducts = async () => {
  const [productSnap, ingredientSnap] = await Promise.all([
    get(ref(rtdb, "products")),
    get(ref(rtdb, "ingredients")),
  ]);

  if (!productSnap.exists()) return [];

  const ingredients = ingredientSnap.exists()
    ? Object.entries(ingredientSnap.val()).map(([id, val]) => ({ id, ...val }))
    : [];

  const products = Object.entries(productSnap.val()).map(([id, val]) => ({ id, ...val }));

  // Mirror what checkProductAvailability does in the admin app
  return products.map(product => {
    if (!product.ingredients || product.ingredients.length === 0) {
      // No ingredient requirements — available as long as stock > 0
      return { ...product, available: product.stock > 0, blockedBy: [] };
    }

    const blockedBy = [];
    for (const req of product.ingredients) {
      const ing = ingredients.find(i => i.id === req.ingredientId || i.name === req.name);
      if (!ing || ing.stock < (req.qty || 1)) {
        blockedBy.push(req.name || req.ingredientId);
      }
    }

    return {
      ...product,
      available: blockedBy.length === 0 && product.stock > 0,
      blockedBy,
    };
  });
};

export default function Home() {
  const { customer } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts().then(list => {
      setProducts(list);
      setLoading(false);
    });
  }, []);

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products
    .filter(p => category === "All" || p.category === category)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const featured = products.filter(p => (p.onSale || p.featured) && p.available).slice(0, 3);
  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  return (
    <div style={{ background: "#f5f3ee", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#1a1814", padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b6860" }}>Good {greeting},</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f5f3ee", marginTop: 2 }}>
              {customer?.name?.split(" ")[0]} ☕
            </div>
          </div>
          <button onClick={() => navigate("/cart")}
            style={{ position: "relative", background: "#2c2924", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            {itemCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search drinks & food..."
            style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 12, border: "none", fontSize: 13, background: "#2c2924", color: "#f5f3ee", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ padding: "0 0 80px" }}>
        {/* Featured banner */}
        {featured.length > 0 && (
          <div style={{ padding: "16px 20px 0" }}>
            <div
              style={{ background: "linear-gradient(135deg, #2d2260, #4a3d8f)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", cursor: "pointer" }}
              onClick={() => navigate(`/product/${featured[0].id}`)}>
              <div style={{ position: "absolute", right: -20, top: -20, fontSize: 100, opacity: 0.1 }}>☕</div>
              <div style={{ fontSize: 10, color: "#c4b9f7", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Featured</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{featured[0].name}</div>
              <div style={{ fontSize: 13, color: "#c4b9f7", marginBottom: 12 }}>{featured[0].description}</div>
              <div style={{ display: "inline-block", background: "#fff", color: "#2d2260", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20 }}>
                from {formatCurrency(featured[0].price)}
              </div>
            </div>
          </div>
        )}

        {/* Category chips */}
        <div style={{ display: "flex", gap: 8, padding: "16px 20px 0", overflowX: "auto" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1px solid ${category === c ? "#1a1814" : "#e8e2d9"}`, background: category === c ? "#1a1814" : "#fff", color: category === c ? "#fff" : "#6b6860", whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ padding: "14px 20px 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9a9690", fontSize: 13 }}>Loading menu…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9a9690", fontSize: 13 }}>No items found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filtered.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}