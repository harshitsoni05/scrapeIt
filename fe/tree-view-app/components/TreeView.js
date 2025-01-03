import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

const TreeNode = ({ node, path, loadChildren, setFilePath, docId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState(null);

  const handleToggle = async () => {
    if (typeof node === "object") {
      const response = await loadChildren(path, docId);
      setFilePath(path);
      if (response) {
        setChildren(response);
      }
    }
    setIsOpen(!isOpen);
  };

  const hasChildren =
    node && typeof node === "object" && node.children && Object.keys(node.children).length > 0;

  return (
    <div style={{ marginLeft: 22, marginTop: 8 }}>
      <div
        onClick={handleToggle}
        style={{
          cursor: "pointer",
          color: "black",
          textDecoration: "none",
          "font-family": "Arial, sans-serif",
          
        }}
      >
        {true ? (
          <span style={{ color: "#005bb5" }}>
            {isOpen ? "▼"+path.split("/").pop(): "▶"+path.split("/").pop()}{}
          </span>
        ) : (
          <span>*</span>
        )}
        
      </div>
      {isOpen && children && (
        <div>
          {Object.entries(children).map(([key, value]) => (
            <TreeNode
              key={key}
              node={value}
              path={`${path}/${key}`}
              loadChildren={loadChildren}
              setFilePath={setFilePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView = ({ setFilePath, docId }) => {
  const [root, setRoot] = useState(null);
  const router = useRouter();

  const fetchChildren = async (path) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/documents/${docId}/get-children/`,
        {
          params: { path },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (exception) {
      console.log("Error fetching children:", exception);
      //router.push("/"); // Redirect to login on error
    }
  };

  const loadRoot = async () => {
    const data = await fetchChildren("");
    setFilePath("");
    setRoot(data);
  };

  useState(() => {
    loadRoot();
  }, []);

  return (
    <div >
      <h3 style={{ "font-family": "Arial, sans-serif", "marginLeft": "20px", "textDecoration": "underline",marginTop:"6px" }}>
        Website structure
      </h3>

      {root ? (
        Object.entries(root).map(([key, value]) => (
          <TreeNode
            key={key}
            node={value}
            path={key}
            loadChildren={fetchChildren}
            setFilePath={setFilePath}
            docId={docId}
          />
        ))
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default TreeView;
