import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Home from "./components/home/Home";
import ProductDetail from "./components/product/ProductDetail";
import Cart from "./components/cart/Cart";
import Orders from "./components/orders/Orders";
import OrderTracking from "./components/orders/OrderTracking";
import Profile from "./components/profile/Profile";
import BottomNav from "./components/common/BottomNav";
import OtpVerification from "./components/auth/OtpVerification";

function ProtectedRoute({ children }) {
  const { customer, loading } = useAuth();
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:16, color:"#1a1814" }}>
      ☕ Loading...
    </div>
  );
  const otpVerified =
    sessionStorage.getItem("otpVerified") === "true";

if (!customer || !otpVerified)
    return <Navigate to="/login" />;
  
  return children;
}

export default function App() {
  const { customer } = useAuth();
  const otpVerified =
  sessionStorage.getItem("otpVerified") === "true";

  return (
    <div style={{ paddingBottom: customer ? 70 : 0 }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/verify-otp" element={<OtpVerification />} />
      </Routes>
      {customer && otpVerified && <BottomNav />}
    </div>
  );
}