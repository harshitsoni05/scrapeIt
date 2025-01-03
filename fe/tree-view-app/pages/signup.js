import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Client-side authentication middleware
    const token = localStorage.getItem("token");
    if ((token) && (token!="")) {
      router.push("/documents"); // Redirect to login if no token
    }
  }, [router]);

  const handleSignup = async () => {
    try {
      const res = await axios.post("/api/signup", {
        email,
        password,
        name,
      });
      
      localStorage.setItem("token", res.data.token);
      router.push("/signup");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Signup</h1>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button className="signup-button" onClick={handleSignup}>
          Signup
        </button>
        <p className="login-link">
          Already have an account? <a href="/">Login</a>
        </p>
      </div>
    </div>
  );
}
