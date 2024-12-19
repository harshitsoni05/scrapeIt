import { useRouter } from 'next/router';
import DocumentEditor from '../../components/DocumentEditor';
import { useState, useEffect } from "react";
import TreeView from "../../components/TreeView";
import axios from "axios";

const DocumentPage = ({ filePath, docId }) => {
  
  if (!docId) return <p>Loading...</p>;

  return <DocumentEditor docId={docId} filePath={filePath} />;
};

export default function Home() {
  const [filePath, setFilePath] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { docId } = router.query;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect to login if no token
      return;
    }
  }, [router]);

  // Function to handle invite button click
  const handleInvite = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Authorization token missing");
      return;
    }

    if (!email) {
      alert("Please enter an email address");
      return;
    }

    const postInvite = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `http://127.0.0.1:5000/api/invite`,
            {
              params: { docId,email },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return response.data;
        } catch (exception) {
          console.log("Error posting invite:", exception);
          //router.push("/"); // Redirect to login on error'
          return {}
        }
    };
    try{
    const response = await postInvite();

    alert(response?.message)
    }
    catch(exception){
        
       // console.error("Error fetching children:", exception);
    }
    
  };

  return (
    <div style={{ display: "flex", padding: "20px", position: "relative", flexDirection: "column", height: "70vh" }}>
      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Panel */}
        {docId ? (
          <div
            style={{
              border: "2px solid #ccc",
              borderRadius: "6px",
              paddingTop: "0px",
              padding: "10px",
              width: "25%",
              marginRight: "20px",
              overflowY: "auto",
              height: "520px", // Shift the left panel down to avoid overlap
            }}
          >
            <TreeView setFilePath={setFilePath} docId={docId} />
          </div>
        ) : (
          <></>
        )}

        {/* Right Panel */}
        <div
          style={{
            flex: 1,
            border: "2px solid #ccc",
            borderRadius: "6px",
            padding: "10px",
            overflowY: "auto",
            height: "520px",
          }}
        >
          {filePath != null ? (
            <div>
              <DocumentPage filePath={filePath} docId={docId}></DocumentPage>
            </div>
          ) : (
            <div>Select a component to view its content</div>
          )}
        </div>
      </div>

      {/* Input and Invite Button */}
      <div
        style={{
            display: "flex",
            alignItems: "center",
            padding: "10px",
            marginTop: "7px", // Push the input and button to the bottom
        }}
        >
        <input
            type="email"
            placeholder="Enter an email to share this document"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
            padding: "12px", // Increased padding for height
            marginRight: "10px",
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "16px", // Slightly larger text
            }}
        />
        <button
            onClick={handleInvite}
            style={{
            padding: "12px 20px", // Increased padding for height
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px", // Slightly larger text
            margin: "0rem",
            }}
        >
            Invite
        </button>
        </div>

    </div>
  );
}
