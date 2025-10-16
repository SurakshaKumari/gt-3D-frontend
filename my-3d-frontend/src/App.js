import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Log';
import ProjectList from './components/ProjectList';
import ProjectView from './components/ProjectView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectView />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
