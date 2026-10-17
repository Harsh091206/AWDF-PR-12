import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import Spinner from './components/Spinner.jsx';

// Lazy loading route-based components (Practical 8)
const TasksPage = React.lazy(() => import('./pages/TasksPage.jsx'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage.jsx'));
const ContactPage = React.lazy(() => import('./pages/ContactPage.jsx'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for unauthorized events to automatically log out (Practical 7)
    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [navigate]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header>
        <div className="header-title">
          <h1>Task Manager</h1>
          <p className="subtitle">Practical 6, 7 & 8 Integrated</p>
        </div>
        <nav>
          <Link to="/">Tasks</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/contact">Contact</Link>
          <button onClick={handleLogout} className="danger" style={{ padding: '8px 16px', marginLeft: '10px' }}>Logout</button>
        </nav>
      </header>

      {/* Suspense wrapper with fallback for lazy loading */}
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spinner label="Loading page module..." /></div>}>
        <Routes>
          <Route path="/" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
