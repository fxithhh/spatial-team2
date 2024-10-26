import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ExhibitsList from './pages/exhibits-list.jsx';
import ExhibitDesign from './pages/exhibit-design.jsx';
import Layout from './Layout'; // Import the Layout component
import Guidelines from './pages/guidelines.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ExhibitsList />} /> {/* Default route for "/" */}
          <Route path="/exhibitions" element={<ExhibitsList />} />
          <Route path="/exhibitions/:id" element={<ExhibitDesign />} />
          <Route path="/guidelines" element={<Guidelines />}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
