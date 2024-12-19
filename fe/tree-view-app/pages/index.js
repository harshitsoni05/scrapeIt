import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Client-side authentication middleware
    const token = localStorage.getItem("token");
    if ((token) && (token!="")) {
      router.push("/documents"); // Redirect to login if no token
    }
  }, [router]);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", { email, password });
      
      localStorage.setItem("token", res.data.token);
      router.push("/documents");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Login</h1>
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
        <button className="signup-button" onClick={handleLogin}>
          Login
        </button>
        <div className="login-link">
          <a href="/signup">Signup</a>
        </div>
      </div>
    </div>
  );
}
