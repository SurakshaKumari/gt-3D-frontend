import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import io from 'socket.io-client';

let socket;

export default function ProjectView({ projectId }) {
  const [annotations, setAnnotations] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    socket = io('http://localhost:5000');
    socket.emit('joinProject', projectId);

    socket.on('newAnnotation', (annotation) => {
      setAnnotations(prev => [...prev, annotation]);
    });

    socket.on('newChatMessage', (msg) => {
      setChat(prev => [...prev, msg]);
    });

    // Load initial project data
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(data => {
        setAnnotations(data.annotations || []);
      });

    return () => socket.close();
  }, [projectId]);

const addAnnotation = async (position, text) => {
  const annotation = { 
    position: { x: position.x, y: position.y, z: position.z }, // ensure plain object
    text, 
    userId: userName 
  };

  // 1. Update local state
  setAnnotations(prev => [...prev, annotation]);

  // 2. Broadcast to other users in real-time
  socket.emit('annotationAdded', { projectId, annotation });

  // 3. ✅ PERSIST TO DATABASE
  try {
    await fetch(`/api/projects/${projectId}/annotation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation)
    });
  } catch (err) {
    console.error('Failed to save annotation to DB:', err);
    // Optional: show user error or retry
  }
};

  const sendChat = () => {
    if (message.trim()) {
      const msg = { user: userName, message: message.trim(), timestamp: new Date() };
      socket.emit('chatMessage', { projectId, message: msg });
      setMessage('');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-3/4">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ModelWithAnnotations annotations={annotations} onAddAnnotation={addAnnotation} />
          <OrbitControls enablePan={true} enableZoom={true} />
        </Canvas>
      </div>
      <div className="w-1/4 p-4 border-l overflow-auto">
        <h2 className="text-lg font-bold mb-2">Chat</h2>
        <div className="mb-2 h-64 overflow-y-auto">
          {chat.map((msg, i) => (
            <div key={i} className="mb-1"><strong>{msg.user}:</strong> {msg.message}</div>
          ))}
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          className="border w-full p-1 mb-2"
          placeholder="Type a message..."
        />
        <button onClick={sendChat} className="bg-blue-500 text-white px-2 py-1 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}

function ModelWithAnnotations({ annotations, onAddAnnotation }) {
  const meshRef = useRef();

  const handleClick = (e) => {
    e.stopPropagation();
    const point = e.point;
    const text = prompt('Enter annotation:');
    if (text) onAddAnnotation(point, text);
  };

  return (
    <>
      {/* Fallback primitive: cube */}
      <mesh ref={meshRef} onClick={handleClick}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      {/* Render annotations */}
      {annotations.map((ann, i) => (
        <Text
          key={i}
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