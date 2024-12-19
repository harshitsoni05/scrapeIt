import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

function DocumentsPage() {
  const [createdDocuments, setCreatedDocuments] = useState([]);
  const [invitedDocuments, setInvitedDocuments] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect to login if no token
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res && res.data && res.data.documents) {
          setCreatedDocuments(res.data.documents.createdDocuments);
          setInvitedDocuments(res.data.documents.invitedDocuments);
        }
      } catch (exception) {
        console.error(exception);
        localStorage.removeItem("token");
        router.push("/");
      }
    };

    fetchDocuments();
  }, [router]);

  const handleDocumentClick = (uuid) => {
    router.push(`/documents/${uuid}`);
  };

  return (
    <div className="documents-container">
      <div className="documents-section">
        <h1>Your Created Documents</h1>
        {createdDocuments.length > 0 ? (
          <div className="documents-list">
            {createdDocuments.map((doc, index) => (
              <div
                key={index}
                className="document-card"
                onClick={() => handleDocumentClick(doc.uuid)}
              >
                <h3>{doc.title}</h3>
                <p>Created on: {new Date(doc.createDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>You don't have any created documents yet.</p>
        )}
      </div>
      <div className="documents-section">
        <h1>Your Invited Documents</h1>
        {invitedDocuments.length > 0 ? (
          <div className="documents-list">
            {invitedDocuments.map((doc, index) => (
              <div
                key={index}
                className="document-card"
                onClick={() => handleDocumentClick(doc.uuid)}
              >
                <h3>{doc.title}</h3>
                <p>Created on: {new Date(doc.createDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>You don't have any invited documents yet.</p>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
