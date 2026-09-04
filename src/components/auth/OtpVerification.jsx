import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginFirebaseOnly } from "../../services/customerService";
import toast from "react-hot-toast";

export default function OtpVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const savedOTP = sessionStorage.getItem("loginOTP");

    if (!savedOTP) {
      toast.error("OTP expired. Please login again.");
      navigate("/login");
      return;
    }

    if (otp !== savedOTP) {
      toast.error("Invalid OTP.");
      return;
    }

    try {
      setLoading(true);

      const email = sessionStorage.getItem("loginEmail");
      const password = sessionStorage.getItem("loginPassword");

      await loginFirebaseOnly(email, password);

      sessionStorage.setItem("otpVerified", "true");

      sessionStorage.removeItem("loginOTP");
      sessionStorage.removeItem("pendingCustomer");
      sessionStorage.removeItem("loginEmail");
      sessionStorage.removeItem("loginPassword");

      const redirectTarget = sessionStorage.getItem("redirectAfterLogin") || "/";
      sessionStorage.removeItem("redirectAfterLogin");

      toast.success("Login verified!");

      setTimeout(() => {
        navigate(redirectTarget);
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error("Unable to complete login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1814",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 15,
          width: 360,
        }}
      >
        <h2 style={{ textAlign: "center" }}>Email Verification</h2>

        <p style={{ textAlign: "center", color: "#666" }}>
          Enter the 6-digit OTP sent to your email.
        </p>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 18,
            textAlign: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "#1a1814",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </div>
  );
}