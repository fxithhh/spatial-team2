import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ExhibitsList from './pages/exhibits-list.jsx'
import ExhibitDesign from './pages/exhibit-design.jsx'

function App() {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<ExhibitsList />} />
      <Route path="/exhibitions" element={<ExhibitsList />} />
      <Route path="/exhibitions/:id" element={<ExhibitDesign />} />
    </Routes>
  </Router>
  );
}

export default App;
