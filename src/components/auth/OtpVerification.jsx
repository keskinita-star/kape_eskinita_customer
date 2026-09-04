import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { loginFirebaseOnly } from "../../services/customerService";
import { generateOTP, sendOTP } from "../../services/emailService";
import toast from "react-hot-toast";

export default function OtpVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const resendOtp = async () => {
    if (countdown > 0) return;

    const email = sessionStorage.getItem("loginEmail");
    const name = JSON.parse(sessionStorage.getItem("pendingCustomer") || "{}")?.name || "Customer";

    if (!email) {
      toast.error("Session expired. Please sign up again.");
      navigate("/signup");
      return;
    }

    try {
      setResendLoading(true);
      const newOtp = generateOTP();
      await sendOTP(email, name, newOtp);
      sessionStorage.setItem("loginOTP", newOtp);
      setCountdown(30);
      toast.success("A new OTP has been sent.");
    } catch (err) {
      console.error(err);
      toast.error("Unable to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    const savedOTP = sessionStorage.getItem("loginOTP");

    if (!savedOTP) {
      toast.error("OTP expired. Please sign up again.");
      navigate("/signup");
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

      if (!auth.currentUser && email && password) {
        await loginFirebaseOnly(email, password);
      }

      sessionStorage.setItem("otpVerified", "true");

      const redirectTarget = sessionStorage.getItem("redirectAfterLogin") || "/cart";

      sessionStorage.removeItem("loginOTP");
      sessionStorage.removeItem("pendingCustomer");
      sessionStorage.removeItem("loginEmail");
      sessionStorage.removeItem("loginPassword");
      sessionStorage.removeItem("redirectAfterLogin");

      toast.success("OTP verified successfully!");

      setTimeout(() => {
        navigate(redirectTarget);
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error("Unable to complete verification.");
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

        <p style={{ textAlign: "center", color: "#666", marginBottom: 8 }}>
          We sent a 6-digit OTP to your email.
        </p>

        <p style={{ textAlign: "center", color: "#9a9690", fontSize: 12, marginBottom: 16 }}>
          Check your inbox and spam folder, then enter the code below.
        </p>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter OTP"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 18,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 12,
            letterSpacing: 4,
          }}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: loading ? "#d0ccc4" : "#1a1814",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={resendOtp}
            disabled={countdown > 0 || resendLoading}
            style={{
              border: "none",
              background: "transparent",
              color: countdown > 0 ? "#9a9690" : "#1a1814",
              fontWeight: 600,
              cursor: countdown > 0 || resendLoading ? "not-allowed" : "pointer",
              fontSize: 12,
            }}
          >
            {resendLoading ? "Sending..." : countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}