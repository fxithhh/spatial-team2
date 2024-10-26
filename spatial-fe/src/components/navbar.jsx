import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function NavBar({ onSidebarToggle }) {
  return (
    <div className="w-full h-[78px] bg-brand flex justify-between items-center px-5 font-['Roboto']">
      <div className="flex items-center">
        <div className="h-10 w-10 text-white cursor-pointer" onClick={onSidebarToggle}>
          <Bars3Icon />
        </div>
        <div className="text-white text-2xl font-medium ml-2">Logo</div>
      </div>
      <div className="flex space-x-7">
        <Link to="/" className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-linkhover">
          Home
        </Link>
        <Link to="/guidelines" className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-linkhover">
          Guidelines
        </Link>
        <div className="text-white text-2xl font-medium cursor-pointer transition-colors duration-300 hover:text-linkhover">
          Profile
        </div>
      </div>
    </div>
  );
}

export default NavBar;
