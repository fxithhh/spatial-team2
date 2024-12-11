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
        {/* <h3 className="text-lg font-['Roboto'] font-bold">Recently Opened</h3> */}
        {/* <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" /> */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2  2xl:grid-cols-3 place-items-center justify-center items-center">
        {exhibits.length > 0 ? (
          exhibits.map((exhibit) => (
            <Link key={exhibit._id} to={`/exhibitions/${exhibit._id}`} className="flex justify-center text-black-500 border-2 border-gray-300 p-4 w-max-[450px] w-96 mb-6 hover:border-brand hover:bg-linkhover hover:text-brand">
              {/* <img
                src={exhibit.floor_plan?.startsWith('data:image')
                  ? exhibit.floor_plan
                  : `/placeholder.jpg`} // Handle Base64 or fallback to placeholder
                alt={exhibit.title || 'Exhibit Image'}
                className="w-full h-48 object-cover mb-4"
              /> */}
              <h2 className="text-xl font-['Roboto'] font-semibold transition-transform duration-300 transform hover:scale-110">
                {exhibit.exhibit_title || 'Untitled Exhibit'} {/* Fallback for missing title */}
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
