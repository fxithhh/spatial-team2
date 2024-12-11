import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';

function Sidebar({ newExhibit }) {
  const [exhibits, setExhibits] = useState([]);
  const [visibleExhibits, setVisibleExhibits] = useState(3);
  const navigate = useNavigate();

  const handleShowMore = () => {
    setVisibleExhibits((prev) => prev + 3);
  };

  const handleCreateExhibit = () => {
    navigate('/create-exhibit');
  };

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

  // Dynamically add new exhibits to the top of the list
  useEffect(() => {
    if (newExhibit) {
      setExhibits((prev) => [newExhibit, ...prev]);
    }
  }, [newExhibit]);

  const hasMoreExhibits = visibleExhibits < exhibits.length;

  return (
    <div className="p-8 bg-white h-[calc(100vh-64px)] w-[355px] font-roboto overflow-y-auto">
      <Button
        size={{ width: '20em', height: '3em' }}
        text="Create New Exhibit"
        onClick={handleCreateExhibit}
      />
      <div className="flex items-center justify-between pt-6">
        {/* <h3 className="text-lg font-bold">Recent Exhibits</h3> */}
        {/* <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" /> */}
      </div>
      <ul className="space-y-2 flex flex-col items-center">
        {exhibits.slice(0, visibleExhibits).map((exhibit) => (
          <li
            key={exhibit._id}
            className="w-[275px] h-[75px] border-b border-gray-300 flex items-center justify-center transition duration-300 hover:border-b-4 hover:border-brand"
          >
            <Link
              to={`/exhibitions/${exhibit._id}`}
              className="text-black text-2xl font-500 tracking-wider uppercase text-center font-['Roboto_Condensed']"
            >
              {exhibit.exhibit_title}
            </Link>
          </li>
        ))}
        {hasMoreExhibits && (
          <li>
            <button
              onClick={handleShowMore}
              className="text-gray-500 text-center text-lg font-medium mt-[15px]"
            >
              See more
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
