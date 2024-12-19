import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { io } from "socket.io-client";
import {
  FaBold,
  FaItalic,
  FaHeading,
  FaListUl,
  FaListOl,
  FaUndo,
  FaRedo,
} from "react-icons/fa"; // Import icons from react-icons

let socket;

const DocumentEditor = ({ docId, filePath }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>This particular component doesn't have content</p>", // Initial content
    onUpdate: ({ editor }) => {
      if (socket) {
        const content = editor.getJSON();
        const token = localStorage.getItem("token");
        socket.emit("update", { docId, content, filePath, token: "Bearer " + token });
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Socket.IO connected");
      const content = editor.getJSON();
      const token = localStorage.getItem("token");
      socket.emit("join", { docId, content, filePath, token: "Bearer " + token });
    });

    socket.on("update", (data) => {
      if (data.docId === docId) {
        editor?.commands.setContent(data.content);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [docId, editor, filePath]);

  const handleButtonClick = (action) => {
    if (!editor) return;

    switch (action) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "heading":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "undo":
        editor.chain().focus().undo().run();
        break;
      case "redo":
        editor.chain().focus().redo().run();
        break;
      default:
        break;
    }
  };

  if (!editor) {
    return <p>Loading editor...</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: "7px", display: "flex",gap: "4px" }}>
        <button
          onClick={() => handleButtonClick("bold")}
          title="Bold"
          style={buttonStyles}
        >
          <FaBold />
        </button>
        <button
          onClick={() => handleButtonClick("italic")}
          title="Italic"
          style={buttonStyles}
        >
          <FaItalic />
        </button>
        <button
          onClick={() => handleButtonClick("heading")}
          title="Heading"
          style={buttonStyles}
        >
          <FaHeading />
        </button>
        <button
          onClick={() => handleButtonClick("bulletList")}
          title="Bullet List"
          style={buttonStyles}
        >
          <FaListUl />
        </button>
        <button
          onClick={() => handleButtonClick("orderedList")}
          title="Ordered List"
          style={buttonStyles}
        >
          <FaListOl />
        </button>
        <button
          onClick={() => handleButtonClick("undo")}
          title="Undo"
          style={buttonStyles}
        >
          <FaUndo />
        </button>
        <button
          onClick={() => handleButtonClick("redo")}
          title="Redo"
          style={buttonStyles}
        >
          <FaRedo />
        </button>
      </div>

      <EditorContent
        editor={editor}
        style={{
          border: "3.5px solid #ccc",
          padding: "10px",
          minHeight: "430px",
        }}
      />
    </div>
  );
};

const buttonStyles = {
  backgroundColor: "#f8f8f8",
  border: "1px solid #ccc",
  borderRadius: "4px",
  padding: "5px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  color: "#333",
  transition: "background-color 0.2s",
};

export default DocumentEditor;
