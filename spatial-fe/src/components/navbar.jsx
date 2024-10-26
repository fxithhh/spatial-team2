import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <div className="w-full h-full relative font-roboto">
      <div className="w-full h-[78px] bg-[#E70362] flex justify-between items-center px-5">
        <div className="flex items-center">
          <div className="h-10 w-10 text-white">
            <Bars3Icon />
          </div>
          <div className="text-white text-2xl font-medium ml-2">Logo</div>
        </div>
        <div className="flex space-x-7">
          <Link to="/" className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-[#ffcccb]">
            Home
          </Link>
          <Link to="/guidelines" className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-[#ffcccb]">
            Guidelines
          </Link>
          <div className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-[#ffcccb]">
            Profile
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
