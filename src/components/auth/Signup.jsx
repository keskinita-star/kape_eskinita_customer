import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupCustomer } from "../../services/customerService";
import { generateOTP, sendOTP } from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
  const { setCustomer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const user = await signupCustomer(form);
      const otp = generateOTP();

      await sendOTP(form.email, form.name, otp);

      sessionStorage.setItem("loginOTP", otp);
      sessionStorage.setItem("pendingCustomer", JSON.stringify({ uid: user.uid, ...form }));
      sessionStorage.setItem("loginEmail", form.email);
      sessionStorage.setItem("loginPassword", form.password);

      const redirectTarget = sessionStorage.getItem("redirectAfterLogin") || "/cart";
      sessionStorage.setItem("redirectAfterLogin", redirectTarget);

      const { getCustomer } = await import("../../services/customerService");
      const { auth } = await import("../../services/firebase");
      const customer = await getCustomer(auth.currentUser.uid);
      setCustomer(customer);

      toast.success(`Welcome to Kape Eskinita, ${form.name}! ☕`);
      toast.success("OTP sent to your email. Please verify to continue.");
      navigate("/verify-otp");
    } catch (err) {
      toast.error(err.message || "Failed to create account.");
    } finally { setLoading(false); }
  };

  const inp = { width:"100%", padding:"12px 14px", border:"1px solid #e8e2d9", borderRadius:10, fontSize:14, outline:"none", background:"#faf9f6" };
  const lbl = { fontSize:11, fontWeight:600, color:"#9a9690", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" };
  const passwordInput = { ...inp, paddingRight:46 };
  const passwordToggle = { position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, border:"none", borderRadius:8, background:"transparent", color:"#6b6860", cursor:"pointer" };

  return (
    <div style={{ minHeight:"100vh", background:"#1a1814", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>☕</div>
        <div style={{ fontSize:24, fontWeight:700, color:"#f5f3ee", letterSpacing:"-0.5px" }}>Kape Eskinita</div>
        <div style={{ fontSize:13, color:"#6b6860", marginTop:4 }}>Create your account</div>
      </div>

      <div style={{ width:"100%", maxWidth:380, background:"#fff", borderRadius:20, padding:28 }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:12, color:"#9a9690", letterSpacing:"0.5px", textTransform:"uppercase", fontWeight:700 }}>Verify your account</div>
          <div style={{ fontSize:13, color:"#6b6860", marginTop:6 }}>We’ll send a one-time OTP to your email before you continue.</div>
        </div>
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
            <div style={{ position:"relative" }}>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" style={passwordInput} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} title={showPassword ? "Hide password" : "Show password"} style={passwordToggle}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={lbl}>Confirm Password</label>
            <div style={{ position:"relative" }}>
              <input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" style={passwordInput} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required minLength={6} />
              <button type="button" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} aria-pressed={showConfirmPassword} title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} style={passwordToggle}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && form.password !== confirmPassword && (
              <div role="status" style={{ fontSize:12, color:"#dc2626", marginTop:6 }}>Passwords do not match.</div>
            )}
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