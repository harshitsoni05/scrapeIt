import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

function ScrapePage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); // State to manage loading
  const router = useRouter();

  useEffect(() => {
    // Client-side authentication middleware
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect to login if no token
    }
  }, [router]);

  const handleScrape = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true); // Set loading state

      await axios.post(
        "http://localhost:5000/api/scrape",
        { url, name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(
        "It will take 1 to 5 minutes for the URL to be scraped. It will be visible in the documents section once completed."
      );
      router.push("/documents");
    } catch (err) {
      alert("Error scraping");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Input URL for Scraping</h1>
      <input
        placeholder="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={styles.input}
      />
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />

      {/* Button disabled when loading */}
      <button
        onClick={handleScrape}
        style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
        disabled={loading}
      >
        {loading ? "Scraping..." : "Start Scraping"}
      </button>
    </div>
  );
}

// CSS-in-JS styles for the layout
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "70vh",
  },
  title: {
    fontFamily: "Arial, sans-serif",
    fontSize: "2rem",
    color: "#333",
    marginBottom: "20px",
  },
  input: {
    margin: "10px",
    padding: "10px",
    width: "300px",
    fontSize: "16px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    transition: "opacity 0.3s ease",
  },
};

export default ScrapePage;
