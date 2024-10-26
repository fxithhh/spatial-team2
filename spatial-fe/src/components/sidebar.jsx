import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import config from '../data/config.json';

function Sidebar() {
  return (
    <div className="pt-[50px] px-[40px] bg-[#FFFFFF] h-[calc(100vh-78px)] w-[355px] font-roboto ease-in-out duration-300">
      <Button
        size={{ width: '275px', height: '75px' }}
        text="Create New Exhibit"
      />
      <div className="flex items-center justify-between mb-[30px] pt-[50px]">
        <h3 className="text-lg font-bold">Recent Exhibits</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
      </div>
      <ul className="space-y-2 flex flex-col items-center">
        {config.exhibits.map((exhibit) => (
          <li
            key={exhibit.id}
            className="w-[275px] h-[75px] border-b border-gray-300 flex items-center justify-center"
          >
            <Link
              to={`/exhibitions/${exhibit.id}`}
              className="text-black text-[24px] font-500 tracking-wider uppercase text-center font-['Roboto_Condensed']"
            >
              {exhibit.title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            to="/exhibitions"
            className="text-gray-500 text-center font-roboto font-medium mt-[15px] flex items-center justify-center"
          >
            See all
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
