// src/components/ProjectView.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function SceneModel({ modelState, onTransform, onAnnotation, modelFile, theme }) {
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
    e.stopPropagation();
    const text = prompt('Add annotation:');
    if (text) {
      const position = [e.point.x, e.point.y, e.point.z];
      console.log("Adding annotation at position:", position);
      onAnnotation({ 
        position: position, 
        text 
      });
    }
  };

  const handleTransform = (e) => {
    if (!meshRef.current) return;
    
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
      onMouseDown={() => transformRef.current.setMode(modelState.mode)}
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
  // Ensure position is properly formatted
  const position = Array.isArray(ann.position) ? ann.position : [0, 0, 0];
  
  console.log("Rendering annotation:", ann.text, "at position:", position);
  
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

export default function ProjectView() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [userName] = useState(localStorage.getItem('userName'));
  const [projectData, setProjectData] = useState(null);
  const [modelState, setModelState] = useState({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    mode: 'translate',
  });
  const [annotations, setAnnotations] = useState([]);
  const [modelFile, setModelFile] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'dark'
    return localStorage.getItem('projectViewTheme') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('projectViewTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!userName) navigate('/');
  }, [userName, navigate]);

  useEffect(() => {
    if (!projectId) return;
    
    const loadProjectData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:5000/api/projects/${projectId}`);
        const data = await res.json();
        
        console.log("Full API response:", data);
        
        if (data.success && data.data) {
          const project = data.data;
          console.log("Project data:", project);
          setProjectData(project);
          
          // Load modelState and annotations from root level (not inside scene)
          if (project.modelState) {
            console.log("Loading modelState:", project.modelState);
            setModelState({
              position: project.modelState.position || [0, 0, 0],
              rotation: project.modelState.rotation || [0, 0, 0],
              scale: project.modelState.scale || [1, 1, 1],
              mode: project.modelState.mode || 'translate'
            });
          } else {
            console.log("No modelState found, using defaults");
          }
          
          if (project.annotations && Array.isArray(project.annotations)) {
            console.log("Loading annotations:", project.annotations);
            
            // Fix annotations - ensure they have proper position data
            const fixedAnnotations = project.annotations.map((ann, index) => {
              // If annotation doesn't have position, assign a default position
              if (!ann.position || !Array.isArray(ann.position)) {
                // Create positions around the model in a circle
                const angle = (index / project.annotations.length) * Math.PI * 2;
                const radius = 3;
                const defaultPosition = [
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius,
                  0
                ];
                console.log(`Fixed annotation ${index} position:`, defaultPosition);
                return {
                  ...ann,
                  id: ann.id || `ann-${index}`,
                  position: defaultPosition
                };
              }
              return {
                ...ann,
                id: ann.id || `ann-${index}`
              };
            });
            
            setAnnotations(fixedAnnotations);
          } else {
            console.log("No annotations found or invalid format");
            setAnnotations([]);
          }
          
          // Load model file if URL exists
          if (project.modelUrl) {
            try {
              console.log("Loading model from:", project.modelUrl);
              const stlRes = await fetch(project.modelUrl);
              if (stlRes.ok) {
                const arrayBuffer = await stlRes.arrayBuffer();
                setModelFile(arrayBuffer);
                console.log("Model file loaded successfully");
              }
            } catch (err) {
              console.error('Failed to load model file:', err);
            }
          } else {
            console.log("No modelUrl found");
          }
        } else {
          console.error("API response format error:", data);
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
        modelState: {
          position: modelState.position,
          rotation: modelState.rotation,
          scale: modelState.scale,
          mode: modelState.mode
        },
        annotations: annotations,
        lastSaved: new Date().toISOString()
      };

      console.log("Saving data:", saveData);

      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/scene`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      const result = await res.json();
      console.log("Save response:", result);
      
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
    setModelState(prev => ({
      ...prev,
      ...newState
    }));
  };

  const addAnnotation = (ann) => {
    const newAnn = {
      id: Date.now().toString(),
      ...ann,
      userId: userName,
      createdAt: new Date().toISOString()
    };
    console.log("Adding new annotation:", newAnn);
    setAnnotations(prev => [...prev, newAnn]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.stl')) {
      alert('Only .stl files are supported');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      setModelFile(arrayBuffer);

      const formData = new FormData();
      formData.append('model', file);
      
      const uploadRes = await fetch(`http://localhost:5000/api/projects/${projectId}/model`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      // Auto-save after upload
      await saveScene();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload model');
    }
  };

  const deleteAnnotation = (annotationId) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
  };

  // Debug info
  console.log("Current modelState:", modelState);
  console.log("Current annotations:", annotations);
  console.log("Model file exists:", !!modelFile);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-50">
        <div className="text-white dark:text-gray-900 text-lg">Loading project...</div>
      </div>
    );
  }

  // Theme classes
  const themeClasses = {
    dark: {
      background: 'bg-gray-900',
      toolbar: 'bg-gray-800 text-white',
      infoPanel: 'bg-gray-700 text-white',
      annotationsPanel: 'bg-gray-800 text-white',
      annotationItem: 'bg-gray-700',
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
        back: 'bg-gray-700 hover:bg-gray-600'
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
      annotationItem: 'bg-gray-100 border border-gray-200',
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
        back: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-500'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`flex flex-col h-screen ${currentTheme.background}`}>
      {/* Enhanced Toolbar */}
      <div className={`p-3 flex gap-2 items-center flex-wrap ${currentTheme.toolbar}`}>
        <div className="flex gap-2">
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'translate' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'translate' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
          >
            Move
          </button>
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'rotate' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'rotate' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
          >
            Rotate
          </button>
          <button
            onClick={() => setModelState(p => ({ ...p, mode: 'scale' }))}
            className={`px-3 py-1.5 text-sm rounded ${
              modelState.mode === 'scale' ? currentTheme.button.active : currentTheme.button.inactive
            }`}
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
          Upload STL
          <input type="file" accept=".stl" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
            theme === 'dark' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'
          }`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              Dark
            </>
          )}
        </button>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm">
            Project: {projectData?.title || projectData?.name || 'Untitled'}
          </span>
          <button
            onClick={() => navigate('/projects')}
            className={`px-3 py-1.5 rounded text-sm ${currentTheme.button.back}`}
          >
            Back to Projects
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
            <strong>Model Position:</strong> [{modelState.position?.join(', ')}]
          </div>
          <div>
            <strong>Model File:</strong> {modelFile ? 'Loaded' : 'Not loaded'}
          </div>
          {projectData?.createdAt && (
            <div>
              <strong>Created:</strong> {new Date(projectData.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={theme === 'dark' ? 0.6 : 0.8} />
            <pointLight position={[10, 10, 10]} intensity={theme === 'dark' ? 1 : 1.2} />
            <SceneModel
              modelState={modelState}
              onTransform={handleTransform}
              onAnnotation={addAnnotation}
              modelFile={modelFile}
              theme={theme}
            />
            {annotations.map(ann => (
              <Annotation key={ann.id} ann={ann} theme={theme} />
            ))}
            <OrbitControls enablePan enableZoom enableRotate />
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
          </Canvas>
        </div>

        {/* Annotations Panel */}
        <div className={`w-80 p-4 overflow-y-auto ${currentTheme.annotationsPanel}`}>
          <h3 className="text-lg font-semibold mb-4">Annotations ({annotations.length})</h3>
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
                      {annotation.userId || 'Unknown'}
                    </span>
                    <button
                      onClick={() => deleteAnnotation(annotation.id)}
                      className={`text-red-500 hover:text-red-700 text-sm`}
                    >
                      Delete
                    </button>
                  </div>
                  <p className={currentTheme.text.primary}>{annotation.text}</p>
                  <div className={`text-xs mt-1 ${currentTheme.text.muted}`}>
                    Position: [{annotation.position?.join(', ') || 'N/A'}]
                  </div>
                  {annotation.createdAt && (
                    <div className={`text-xs mt-1 ${currentTheme.text.muted}`}>
                      {new Date(annotation.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}