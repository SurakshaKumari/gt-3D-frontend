// src/components/ProjectView.jsx
import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import io from 'socket.io-client';

let socket;

export default function ProjectView() {
  const { id: projectId } = useParams(); // ✅ Get :id from URL
  const navigate = useNavigate();
  const [annotations, setAnnotations] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const userName = localStorage.getItem('userName');

  // Redirect if no user is logged in
  useEffect(() => {
    if (!userName) {
      navigate('/');
    }
  }, [userName, navigate]);

  // Socket and data setup
  useEffect(() => {
    if (!projectId || !userName) return;

    // Initialize socket only if needed
    socket = io('http://localhost:5000');

    // Join the project room
    socket.emit('joinProject', projectId);

    // Listen for new annotations
    const handleNewAnnotation = (annotation) => {
      setAnnotations(prev => [...prev, annotation]);
    };

    // Listen for new chat messages
    const handleNewChatMessage = (msg) => {
      setChat(prev => [...prev, msg]);
    };

    socket.on('newAnnotation', handleNewAnnotation);
    socket.on('newChatMessage', handleNewChatMessage);

    // Load existing annotations
    const loadProjectData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.annotations || []);
        } else {
          console.warn('Project not found');
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    };

    loadProjectData();

    // Cleanup on unmount or projectId change
    return () => {
      socket?.off('newAnnotation', handleNewAnnotation);
      socket?.off('newChatMessage', handleNewChatMessage);
      socket?.close();
    };
  }, [projectId, userName]);

  const addAnnotation = async (position, text) => {
    if (!projectId || !userName) return;

    const annotation = {
      position: { x: position.x, y: position.y, z: position.z },
      text,
      userId: userName,
    };

    // Optimistic UI update
    setAnnotations(prev => [...prev, annotation]);

    // Real-time broadcast
    socket?.emit('annotationAdded', { projectId, annotation });

    // Persist to backend
    try {
      await fetch(`/api/projects/${projectId}/annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      });
    } catch (err) {
      console.error('Failed to save annotation to DB:', err);
      // Optional: revert optimistic update or show error
    }
  };

  const sendChat = () => {
    if (!projectId || !userName || !message.trim()) return;

    const msg = {
      user: userName,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    socket?.emit('chatMessage', { projectId, message: msg });
    setMessage('');
  };

  return (
    <div className="flex h-screen">
      {/* 3D Viewer */}
      <div className="w-3/4">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ModelWithAnnotations annotations={annotations} onAddAnnotation={addAnnotation} />
          <OrbitControls enablePan={true} enableZoom={true} />
        </Canvas>
      </div>

      {/* Chat Sidebar */}
      <div className="w-1/4 p-4 border-l overflow-auto bg-white">
        <h2 className="text-lg font-bold mb-2">Chat ({chat.length})</h2>
        <div className="mb-2 h-64 overflow-y-auto border rounded p-2 bg-gray-50">
          {chat.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet...</p>
          ) : (
            chat.map((msg, i) => (
              <div key={i} className="mb-1 text-sm">
                <strong className="text-blue-600">{msg.user}:</strong> {msg.message}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            className="border p-2 w-full text-sm rounded"
            placeholder="Type a message..."
            disabled={!projectId}
          />
          <button
            onClick={sendChat}
            disabled={!message.trim() || !projectId}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Separate component for the 3D model and annotations
function ModelWithAnnotations({ annotations, onAddAnnotation }) {
  const handleClick = (e) => {
    e.stopPropagation();
    const point = e.point;
    const text = prompt('Enter annotation:');
    if (text && onAddAnnotation) {
      onAddAnnotation(point, text);
    }
  };

  return (
    <>
      {/* Clickable cube as placeholder model */}
      <mesh onClick={handleClick}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="lightblue" transparent opacity={0.9} />
      </mesh>

      {/* Render all annotations */}
      {annotations.map((ann, i) => (
        <Text
          key={`${ann.userId}-${i}`} // better key if possible; consider adding unique ID later
          position={ann.position}
          fontSize={0.2}
          color="red"
          anchorX="center"
          anchorY="middle"
        >
          {ann.text}
        </Text>
      ))}
    </>
  );
}