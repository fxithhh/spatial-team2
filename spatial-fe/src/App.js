import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ExhibitsList from './pages/exhibits-list.jsx';
import ExhibitDesign from './pages/exhibit-design.jsx';
import Guidelines from './pages/guidelines.jsx';
import NavBar from './components/navbar.jsx';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
          <Route index element={<ExhibitsList />} /> {/* Default route for "/" */}
          <Route path="/exhibitions" element={<ExhibitsList />} />
          <Route path="/exhibitions/:id" element={<ExhibitDesign />} />
          <Route path="/guidelines" element={<Guidelines />} />
      </Routes>
    </Router>
  );
}

export default App;
