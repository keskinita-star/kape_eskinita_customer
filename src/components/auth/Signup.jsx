import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupCustomer } from "../../services/customerService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Signup() {
  const { setCustomer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await signupCustomer(form);
      const { getCustomer } = await import("../../services/customerService");
      const { auth } = await import("../../services/firebase");
      const customer = await getCustomer(auth.currentUser.uid);
      setCustomer(customer);
      toast.success(`Welcome to Kape Eskinita, ${form.name}! ☕`);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to create account.");
    } finally { setLoading(false); }
  };

  const inp = { width:"100%", padding:"12px 14px", border:"1px solid #e8e2d9", borderRadius:10, fontSize:14, outline:"none", background:"#faf9f6" };
  const lbl = { fontSize:11, fontWeight:600, color:"#9a9690", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" };

  return (
    <div style={{ minHeight:"100vh", background:"#1a1814", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>☕</div>
        <div style={{ fontSize:24, fontWeight:700, color:"#f5f3ee", letterSpacing:"-0.5px" }}>Kape Eskinita</div>
        <div style={{ fontSize:13, color:"#6b6860", marginTop:4 }}>Create your account</div>
      </div>

      <div style={{ width:"100%", maxWidth:380, background:"#fff", borderRadius:20, padding:28 }}>
        <form onSubmit={handleSignup} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={lbl}>Full Name</label>
            <input style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Juan Dela Cruz" required />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input type="email" style={inp} value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@email.com" required />
          </div>
          <div>
            <label style={lbl}>Password</label>
            <input type="password" style={inp} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" disabled={loading}
            style={{ marginTop:6, padding:"13px", borderRadius:10, background: loading?"#d0ccc4":"#1a1814", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor: loading?"not-allowed":"pointer" }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={{ textAlign:"center", fontSize:13, color:"#9a9690", marginTop:18 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"#1a1814", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}