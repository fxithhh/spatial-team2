import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ExhibitsList from './pages/exhibits-list.jsx';
import ExhibitDesign from './pages/exhibit-design.jsx';
import Guidelines from './pages/guidelines.jsx';
import NavBar from './components/navbar.jsx';
import Sidebar from './components/sidebar';
import CreateExhibit from './pages/create-exhibit.jsx';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <NavBar onSidebarToggle={toggleSidebar} />

      {/* Sidebar positioned below the NavBar */}
      <div className={`fixed top-[64px] left-0 z-50 transition-transform ease-in-out duration-500 ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar />
      </div>

      {/* Overlay for the rest of the page */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 z-40"
          style={{
            top: '64px',
            left: '355px',
            height: 'calc(100% - 64px)',
            width: 'calc(100% - 355px)',
          }}
          onClick={toggleSidebar}
        />
      )}

      <div className="flex-1 transition-all duration-300 ml-0">
        <Routes>
          <Route index element={<ExhibitsList />} /> {/* Default route for "/" */}
          <Route path="/exhibitions" element={<ExhibitsList />} />
          <Route path="/create-exhibit" element={<CreateExhibit />} />
          <Route path="/exhibitions/:exhibitId" element={<ExhibitDesign />} />
          <Route path="/guidelines" element={<Guidelines />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
