import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(setProjects);
  }, []);

  const createProject = async () => {
    const res = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ownerId: localStorage.getItem('userName') })
    });
    const project = await res.json();
    navigate(`/project/${project._id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Your Projects</h1>
      <div className="mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
          className="border p-2 mr-2"
        />
        <button onClick={createProject} className="bg-green-500 text-white px-3 py-1 rounded">
          Create
        </button>
      </div>
      <ul>
        {projects.map(p => (
          <li key={p._id} className="mb-2">
            <a href={`/project/${p._id}`} className="text-blue-500">{p.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}