// src/components/ProjectView.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { AxesHelper } from 'three';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function SceneModel({ modelState, onTransform, onAnnotation, modelFile, theme, isTransformEnabled }) {
  const meshRef = useRef();
  const transformRef = useRef();

  useFrame(() => {
    if (meshRef.current && !transformRef.current?.dragging) {
      meshRef.current.position.set(...modelState.position);
      meshRef.current.rotation.set(...modelState.rotation);
      meshRef.current.scale.set(...modelState.scale);
    }
  });

  const handleClick = (e) => {
    if (!isTransformEnabled) return;
    
    e.stopPropagation();
    const text = prompt('Add annotation:');
    if (text) {
      const position = [e.point.x, e.point.y, e.point.z];
      onAnnotation({ 
        position: position, 
        text 
      });
    }
  };

  const handleTransform = (e) => {
    if (!meshRef.current || !isTransformEnabled) return;
    
    const newState = {
      position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
      rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
      scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
    };
    
    onTransform(newState);
  };

  let geometry = null;
  if (modelFile) {
    try {
      const loader = new STLLoader();
      geometry = loader.parse(modelFile);
    } catch (e) {
      console.error('STL load failed', e);
    }
  }

  return (
    <TransformControls
      ref={transformRef}
      mode={modelState.mode}
      object={meshRef}
      enabled={isTransformEnabled}
      onMouseDown={() => isTransformEnabled && transformRef.current?.setMode(modelState.mode)}
      onObjectChange={handleTransform}
    >
      <mesh ref={meshRef} onClick={handleClick}>
        {geometry ? (
          <primitive object={geometry} attach="geometry" />
        ) : (
          <boxGeometry args={[2, 2, 2]} />
        )}
        <meshStandardMaterial color={theme === 'dark' ? "lightblue" : "royalblue"} />
      </mesh>
    </TransformControls>
  );
}

function Annotation({ ann, theme }) {
  const position = Array.isArray(ann.position) ? ann.position : [0, 0, 0];
  
  return (
    <Text
      position={position}
      fontSize={0.2}
      color={theme === 'dark' ? "red" : "darkred"}
      anchorX="center"
      anchorY="middle"
    >
      {ann.text}
    </Text>
  );
}

function CameraSync({ onCameraUpdate }) {
  const { camera } = useThree();
  const lastUpdate = useRef(0);

  useFrame(() => {
    // Throttle camera updates to avoid too many socket events
    const now = Date.now();
    if (now - lastUpdate.current > 100) { // Update every 100ms
      if (onCameraUpdate && camera) {
        onCameraUpdate({
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [0, 0, 0] // You can calculate target based on camera direction
        });
        lastUpdate.current = now;
      }
    }
  });

  return null;
}

// Chat Modal Component
function ChatModal({ isOpen, onClose, chat, newMessage, setNewMessage, onSendMessage, theme, currentTheme }) {
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col ${currentTheme.chatPanel}`}>
        {/* Modal Header */}
        <div className={`flex justify-between items-center p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            💬 Project Chat
            <span className="text-sm font-normal px-2 py-1 rounded-full bg-blue-500 text-white">
              {chat.length} messages
            </span>
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-opacity-20 ${
              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {chat.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className={currentTheme.text.muted}>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chat.map(message => (
              <div key={message.id} className={`p-3 rounded-lg ${currentTheme.chatItem}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${currentTheme.text.primary}`}>
                      {message.userName}
                    </span>
                    {message.userId.includes('user-') && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500 text-white">
                        Guest
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${currentTheme.text.muted}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={currentTheme.text.primary}>{message.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
              placeholder="Type your message..."
              className={`flex-1 border rounded-lg px-4 py-3 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectView() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : { 
      id: `user-${Date.now()}`, 
      name: `User${Math.floor(Math.random() * 1000)}` 
    };
  });
  const [projectData, setProjectData] = useState(null);
  const [modelState, setModelState] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    mode: 'translate',
  });
  const [annotations, setAnnotations] = useState([]);
  const [chat, setChat] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [modelFile, setModelFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('projectViewTheme') || 'dark');
  const [isTransformEnabled, setIsTransformEnabled] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('projectViewTheme', theme);
  }, [theme]);

  // Socket.io effects
  useEffect(() => {
    if (!projectId) return;

    // Join the project room
    socket.emit('joinProject', projectId);

    // Listen for real-time events
    socket.on('newAnnotation', (annotation) => {
      setAnnotations(prev => [...prev, annotation]);
    });

    socket.on('newChatMessage', (message) => {
      setChat(prev => [...prev, message]);
    });

    socket.on('cameraSync', (cameraData) => {
      // Camera sync would be handled by OrbitControls automatically
      console.log('Camera sync received:', cameraData);
    });

    // User count tracking (basic implementation)
    socket.on('userJoined', (count) => {
      setOnlineUsers(count);
    });

    socket.on('userLeft', (count) => {
      setOnlineUsers(count);
    });

    return () => {
      socket.off('newAnnotation');
      socket.off('newChatMessage');
      socket.off('cameraSync');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, [projectId]);

  // Load project data
  useEffect(() => {
    if (!projectId) return;
    
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:5000/api/projects/${projectId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const project = data.data;
          setProjectData(project);
          
          // Load model state
          if (project.modelState) {
            setModelState(project.modelState);
          }
          
          // Load annotations
          if (project.annotations) {
            setAnnotations(project.annotations);
          }
          
          // Load chat (if exists in your schema)
          if (project.chat) {
            setChat(project.chat);
          }
          
          // Load model file
          if (project.modelPath) {
            try {
              const modelRes = await fetch(`http://localhost:5000/api/projects/${projectId}/model`);
              if (modelRes.ok) {
                const arrayBuffer = await modelRes.arrayBuffer();
                setModelFile(arrayBuffer);
              }
            } catch (err) {
              console.error('Failed to load model file:', err);
            }
          }
        }
      } catch (err) {
        console.error('Load project failed', err);
        alert('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjectData();
  }, [projectId]);

  const saveScene = async () => {
    if (!projectId) return;
    
    setSaveStatus('saving');
    try {
      const saveData = {
        modelState: modelState,
        annotations: annotations
      };

      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/scene`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      const result = await res.json();
      
      if (res.ok && result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save failed', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleTransform = (newState) => {
    if (!isTransformEnabled) return;
    
    const updatedState = { ...modelState, ...newState };
    setModelState(updatedState);
    
    // Auto-save on transform
    saveScene();
  };

  const addAnnotation = (ann) => {
    if (!isTransformEnabled) return;
    
    const newAnn = {
      id: Date.now().toString(),
      ...ann,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    
    // Update local state
    setAnnotations(prev => [...prev, newAnn]);
    
    // Save to backend
    fetch(`http://localhost:5000/api/projects/${projectId}/annotation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnn),
    });
    
    // Broadcast via socket
    socket.emit('annotationAdded', { 
      projectId, 
      annotation: newAnn 
    });
  };

  const handleCameraUpdate = (cameraData) => {
    // Broadcast camera position to other users
    socket.emit('cameraUpdate', { 
      projectId, 
      camera: cameraData 
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      text: newMessage,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString()
    };

    // Update local state
    setChat(prev => [...prev, message]);
    
    // Broadcast via socket
    socket.emit('chatMessage', { 
      projectId, 
      message 
    });
    
    setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.stl')) {
      alert('Only .stl files are supported');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('model', file);
      
      const uploadRes = await fetch(`http://localhost:5000/api/projects/${projectId}/model`, {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const result = await uploadRes.json();
        if (result.success) {
          // Reload the model
          const modelRes = await fetch(`http://localhost:5000/api/projects/${projectId}/model`);
          if (modelRes.ok) {
            const arrayBuffer = await modelRes.arrayBuffer();
            setModelFile(arrayBuffer);
          }
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload model');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const changeUser = () => {
    const name = prompt('Enter your name:', user.name);
    if (name) {
      const newUser = { ...user, name };
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  const toggleChatModal = () => {
    setIsChatModalOpen(!isChatModalOpen);
  };

  // Theme classes
  const themeClasses = {
    dark: {
      background: 'bg-gray-900',
      toolbar: 'bg-gray-800 text-white',
      infoPanel: 'bg-gray-700 text-white',
      annotationsPanel: 'bg-gray-800 text-white',
      chatPanel: 'bg-gray-800 text-white',
      annotationItem: 'bg-gray-700',
      chatItem: 'bg-gray-700',
      button: {
        active: 'bg-blue-600',
        inactive: 'bg-gray-700 hover:bg-gray-600',
        save: {
          saving: 'bg-gray-600',
          saved: 'bg-green-600',
          error: 'bg-red-600',
          default: 'bg-purple-600 hover:bg-purple-700'
        },
        upload: 'bg-green-700 hover:bg-green-600',
        back: 'bg-gray-700 hover:bg-gray-600',
        chat: 'bg-purple-600 hover:bg-purple-700'
      },
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        muted: 'text-gray-400'
      }
    },
    light: {
      background: 'bg-gray-50',
      toolbar: 'bg-white text-gray-800 border-b border-gray-200',
      infoPanel: 'bg-gray-100 text-gray-800 border-b border-gray-200',
      annotationsPanel: 'bg-white text-gray-800 border-l border-gray-200',
      chatPanel: 'bg-white text-gray-800 border-l border-gray-200',
      annotationItem: 'bg-gray-100 border border-gray-200',
      chatItem: 'bg-gray-100 border border-gray-200',
      button: {
        active: 'bg-blue-500 text-white',
        inactive: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        save: {
          saving: 'bg-gray-400 text-white',
          saved: 'bg-green-500 text-white',
          error: 'bg-red-500 text-white',
          default: 'bg-purple-500 text-white hover:bg-purple-600'
        },
        upload: 'bg-green-500 text-white hover:bg-green-600',
        back: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        chat: 'bg-purple-500 text-white hover:bg-purple-600'
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-500'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-50">
        <div className="text-white dark:text-gray-900 text-lg">Loading project...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${currentTheme.background}`}>
      {/* Enhanced Toolbar */}
      <div className={`p-3 flex gap-2 items-center flex-wrap ${currentTheme.toolbar}`}>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransformEnabled(!isTransformEnabled)}
            className={`px-3 py-1.5 text-sm rounded ${
              isTransformEnabled ? currentTheme.button.active : currentTheme.button.inactive
            }`}
          >
            {isTransformEnabled ? '✏️ Editing' : '👀 View Only'}
          </button>
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'translate' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'translate' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
            disabled={!isTransformEnabled}
          >
            Move
          </button>
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'rotate' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'rotate' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
            disabled={!isTransformEnabled}
          >
            Rotate
          </button>
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'scale' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'scale' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
            disabled={!isTransformEnabled}
          >
            Scale
          </button>
        </div>

        {/* Save Scene Button */}
        <button
          onClick={saveScene}
          disabled={saveStatus === 'saving'}
          className={`px-4 py-1.5 text-sm rounded ${
            currentTheme.button.save[saveStatus === 'saving' ? 'saving' : 
            saveStatus === 'saved' ? 'saved' : 
            saveStatus === 'error' ? 'error' : 'default']
          }`}
        >
          {saveStatus === 'saving' ? 'Saving...' : 
           saveStatus === 'saved' ? 'Saved!' : 
           saveStatus === 'error' ? 'Error!' : 'Save Scene'}
        </button>

        {/* Upload STL */}
        <label className={`px-3 py-1.5 rounded text-sm cursor-pointer ${currentTheme.button.upload}`}>
          📤 Upload STL
          <input type="file" accept=".stl" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Chat Button */}
        <button
          onClick={toggleChatModal}
          className={`px-4 py-1.5 rounded text-sm flex items-center gap-2 ${currentTheme.button.chat}`}
        >
          💬 Chat
          {chat.length > 0 && (
            <span className="bg-white text-purple-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {chat.length}
            </span>
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm">👤 {user.name}</span>
          <button
            onClick={changeUser}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
          >
            Change
          </button>
        </div>

        {/* Online Users */}
        <div className="text-sm">
          👥 Online: {onlineUsers || 1}
        </div>

        {/* Share Button */}
        <button
          onClick={copyShareLink}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
        >
          🔗 Share Project
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
            theme === 'dark' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'
          }`}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm">
            📁 Project: {projectData?.title || projectData?.name || 'Untitled'}
          </span>
          <button
            onClick={() => navigate('/projects')}
            className={`px-3 py-1.5 rounded text-sm ${currentTheme.button.back}`}
          >
            ← Back to Projects
          </button>
        </div>
      </div>

      {/* Project Info Panel */}
      <div className={`p-3 text-sm ${currentTheme.infoPanel}`}>
        <div className="flex gap-6 flex-wrap">
          <div>
            <strong>Title:</strong> {projectData?.title || projectData?.name || 'N/A'}
          </div>
          <div>
            <strong>Description:</strong> {projectData?.description || 'No description'}
          </div>
          <div>
            <strong>Status:</strong> {projectData?.status || 'Draft'}
          </div>
          <div>
            <strong>Annotations:</strong> {annotations.length}
          </div>
          <div>
            <strong>Chat Messages:</strong> {chat.length}
          </div>
          <div>
            <strong>Model Position:</strong> [{modelState.position?.join(', ')}]
          </div>
          <div>
            <strong>Model File:</strong> {modelFile ? '✅ Loaded' : '❌ Not loaded'}
          </div>
          {projectData?.createdAt && (
            <div>
              <strong>Created:</strong> {new Date(projectData.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* 3D Viewer - Takes full width on mobile, 2/3 on desktop */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-auto">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={theme === 'dark' ? 0.6 : 0.8} />
            <pointLight position={[10, 10, 10]} intensity={theme === 'dark' ? 1 : 1.2} />
            <SceneModel
              modelState={modelState}
              onTransform={handleTransform}
              onAnnotation={addAnnotation}
              modelFile={modelFile}
              theme={theme}
              isTransformEnabled={isTransformEnabled}
            />
            {annotations.map(ann => (
              <Annotation key={ann.id} ann={ann} theme={theme} />
            ))}
            <OrbitControls 
              enablePan 
              enableZoom 
              enableRotate 
              onChange={() => {
                // Camera changes are handled by CameraSync component
              }}
            />
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
            <CameraSync onCameraUpdate={handleCameraUpdate} />
          </Canvas>
        </div>

        {/* Annotations Panel Only - Chat is now in modal */}
        <div className="w-full lg:w-96 xl:w-80">
          <div className={`h-full p-4 overflow-y-auto ${currentTheme.annotationsPanel}`}>
            <h3 className="text-lg font-semibold mb-4">📝 Annotations ({annotations.length})</h3>
            {annotations.length === 0 ? (
              <p className={`text-sm ${currentTheme.text.muted}`}>
                No annotations yet. Click on the model to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {annotations.map(annotation => (
                  <div key={annotation.id} className={`p-3 rounded-lg ${currentTheme.annotationItem}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm ${currentTheme.text.secondary}`}>
                        👤 {annotation.userName || 'Unknown'}
                      </span>
                    </div>
                    <p className={currentTheme.text.primary}>{annotation.text}</p>
                    <div className={`text-xs mt-1 ${currentTheme.text.muted}`}>
                      📍 Position: [{annotation.position?.join(', ') || 'N/A'}]
                    </div>
                    {annotation.createdAt && (
                      <div className={`text-xs mt-1 ${currentTheme.text.muted}`}>
                        🕒 {new Date(annotation.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={toggleChatModal}
        chat={chat}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={sendMessage}
        theme={theme}
        currentTheme={currentTheme}
      />
    </div>
  );
}