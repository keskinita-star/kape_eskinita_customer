import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginCustomer, logoutCustomer } from "../../services/customerService";
import { generateOTP, sendOTP } from "../../services/emailService";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const customer = await loginCustomer(email, password);

    const otp = generateOTP();

    console.log("Generated OTP:", otp);

    await sendOTP(customer.email, customer.name, otp);
    await logoutCustomer();

    toast.success("OTP sent successfully! Check your email.");

    sessionStorage.setItem("loginOTP", otp);
    sessionStorage.setItem("pendingCustomer", JSON.stringify(customer));
    sessionStorage.setItem("loginEmail", email);
    sessionStorage.setItem("loginPassword", password);
    navigate("/verify-otp");

  } catch (err) {
    console.error(err);
    toast.error(err.message || "Login failed.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={{ minHeight:"100vh", background:"#1a1814", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>☕</div>
        <div style={{ fontSize:24, fontWeight:700, color:"#f5f3ee", letterSpacing:"-0.5px" }}>Kape Eskinita</div>
        <div style={{ fontSize:13, color:"#6b6860", marginTop:4 }}>Sign in to order your favorites</div>
      </div>

      <div style={{ width:"100%", maxWidth:380, background:"#fff", borderRadius:20, padding:28 }}>
        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"#9a9690", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com"
              style={{ width:"100%", padding:"12px 14px", border:"1px solid #e8e2d9", borderRadius:10, fontSize:14, outline:"none", background:"#faf9f6" }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"#9a9690", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width:"100%", padding:"12px 14px", border:"1px solid #e8e2d9", borderRadius:10, fontSize:14, outline:"none", background:"#faf9f6" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ marginTop:6, padding:"13px", borderRadius:10, background: loading?"#d0ccc4":"#1a1814", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor: loading?"not-allowed":"pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ textAlign:"center", fontSize:13, color:"#9a9690", marginTop:18 }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color:"#1a1814", fontWeight:600, textDecoration:"none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}