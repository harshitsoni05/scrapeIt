import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface DocumentEditorProps {
  docId: string;
}
let socket: Socket;
const DocumentEditor = ({ docId }: DocumentEditorProps) => {
    console.log("dococo - "+docId)
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Loading...</p>', // Initial loading content
    onUpdate: ({ editor }) => {
        
      // Send editor updates to the backend
      if (socket) {
        const content = editor.getJSON();
        socket.emit('update', { docId, content });
      }
    },
  });

  // Define and initialize the Socket.IO client


  useEffect(() => {
    // Connect to the Socket.IO backend
    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      // Join the document room
      const content = editor.getJSON();
      socket.emit('join', { docId , content});
    });

    socket.on('update', (data) => {
      // Handle incoming updates
      if (data.docId === docId) {
        editor?.commands.setContent(data.content);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [docId, editor]);

  if (!editor) {
    return <p>Loading editor..jbkwe.</p>;
  }

  return (
    <div>
      <h1>Editing Document: {docId}</h1>
      <EditorContent editor={editor} />
      <h5>hella</h5>
    </div>
  );
};

export default DocumentEditor;
