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
    if (token && token !== "") {
      router.push("/documents"); // Redirect to documents if token exists
    }
  }, [router]);

  const handleLogin = async () => {
    try {
      const res = await axios.post( "/api/login", {
        email,
        password,
      });

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
        <div className="opensource-info">
          <p>
            Open-sourced at{" "}
            <a
              href="https://github.com/harshitsoni05/scrapeIt"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                alt="GitHub"
                style={{ width: "16px", verticalAlign: "middle", marginRight: "4px" }}
              />
              scrapeIt
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
