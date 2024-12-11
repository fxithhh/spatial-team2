import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';

function ExhibitsList() {
  const [exhibits, setExhibits] = useState([]);
  const navigate = useNavigate();

  // Fetch exhibits from the backend API on component mount
  useEffect(() => {
    const fetchExhibits = async () => {
      try {
        const response = await fetch('http://localhost:5000/exhibits'); // API endpoint to get the list of exhibits
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched exhibits:", data); // Debug the fetched data
        setExhibits(data); // Update state with fetched exhibits
      } catch (error) {
        console.error("Error fetching exhibits:", error);
      }
    };
    fetchExhibits();
  }, []);

  const handleCreateExhibit = () => {
    navigate("/create-exhibit");
  };

  return (
    <div className="mx-auto w-[70%]">
      <div className="flex justify-between w-full mt-32 h-[65px] mb-4">
        <h1 className="text-4xl font-bold font-['Roboto_Condensed'] h-[65px]">Exhibitions</h1>
        <Button
          size={{ width: '12em', height: '2.5em' }}
          text="Create New Exhibit"
          onClick={handleCreateExhibit}
        />
      </div>
      <h2 className="text-2xl font-['Roboto_Condensed'] font-light text-[#979797] mb-16">
        Streamline your exhibition planning, manage effortlessly, and simplify your exhibition process.
      </h2>
      <div className="flex justify-between items-center pb-6">
        <h3 className="text-lg font-['Roboto'] font-bold">Recently Opened</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
        {exhibits.length > 0 ? (
          exhibits.map((exhibit) => (
            <Link key={exhibit._id} to={`/exhibitions/${exhibit._id}`} className="text-black-500">
              <img
                src={exhibit.floor_plan?.startsWith('data:image')
                  ? exhibit.floor_plan
                  : `/placeholder.jpg`} // Handle Base64 or fallback to placeholder
                alt={exhibit.title || 'Exhibit Image'}
                className="w-full h-48 object-cover mb-4"
              />
              <h2 className="text-xl font-['Roboto'] font-semibold transition-transform duration-300 transform group-hover:scale-110">
                {exhibit.title || 'Untitled Exhibit'} {/* Fallback for missing title */}
              </h2>
            </Link>
          ))
        ) : (
          <p className="text-gray-600">No exhibits available.</p>
        )}
      </div>
    </div>
  );
}

export default ExhibitsList;
