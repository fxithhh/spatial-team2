import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import config from '../data/config.json';

function Sidebar() {
  const navigate = useNavigate();

  // State to manage how many exhibits are displayed
  const [visibleExhibits, setVisibleExhibits] = useState(3);

  // Function to handle navigation
  const handleCreateExhibit = () => {
    try {
      console.log("a");
      navigate("/create-exhibit");
    } catch (error) {
      console.error("Navigation Error:", error);
    }
  };

  // Function to load more exhibits in batches of 3
  const handleShowMore = () => {
    setVisibleExhibits((prevCount) => prevCount + 3);
  };

  // Determine if there are more exhibits to show
  const hasMoreExhibits = visibleExhibits < config.exhibits.length;

  return (
    <div className="p-8 bg-white h-[calc(100vh-64px)] w-[355px] font-roboto ease-in-out duration-300 overflow-y-auto">
      <Button
        size={{ width: '20em', height: '3em' }}
        text="Create New Exhibit"
        onClick={handleCreateExhibit}
      />
      <div className="flex items-center justify-between mb-[30px] pt-[50px]">
        <h3 className="text-lg font-['Roboto'] font-bold">Recent Exhibits</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
      </div>
      <ul className="space-y-2 flex flex-col items-center">
        {/* Display only the exhibits up to the current visible count */}
        {config.exhibits.slice(0, visibleExhibits).map((exhibit) => (
          <li
            key={exhibit.id}
            className="w-[275px] h-[75px] border-b border-gray-300 flex items-center justify-center transition duration-300 hover:border-b-4 hover:border-brand"
          >
            <Link
              to={`/exhibitions/${exhibit.id}`}
              className="text-black text-2xl font-500 tracking-wider uppercase text-center font-['Roboto_Condensed']"
            >
              {exhibit.title}
            </Link>
          </li>
        ))}

        {/* Show the "See all" button if there are more exhibits to show */}
        {hasMoreExhibits && (
          <li>
            <button
              onClick={handleShowMore}
              className="text-gray-500 text-center font-['Roboto'] text-lg font-medium mt-[15px] flex items-center justify-center"
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
