import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function NavBar({ onSidebarToggle }) {
  return (
    <div className="w-full bg-brand flex justify-between items-center px-8 py-4 font-['Roboto']">
      <div className="flex items-center">
        <div className="w-8 h-8 text-white cursor-pointer" onClick={onSidebarToggle}>
          <Bars3Icon />
        </div>
        <Link to="/">
          <img className="w-64 text-white text-xl font-medium ml-4" src="/spatial-logo.png"></img>
        </Link>
      </div>
      <div className="flex space-x-7">
        <Link to="/" className="text-white text-xl font-medium cursor-pointer transition-colors duration-300 hover:text-linkhover">
          Home
        </Link>
        <div className="text-white text-xl font-medium cursor-pointer transition-colors duration-300 hover:text-linkhover">
          Profile
        </div>
      </div>
    </div>
  );
}

export default NavBar;
