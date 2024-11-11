import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import config from '../data/config.json';

function ExhibitsList() {
  return (
    <div className="mx-auto w-[70%]">
      <div className="flex justify-between w-full mt-32 h-[65px] mb-4">
        <h1 className="text-4xl font-bold font-['Roboto_Condensed'] h-[65px]">Exhibitions</h1>
        <Button size={{ width: '265px', height: '65px' }} text="Create New Exhibit" />
      </div>
      <h2 className="text-2xl font-['Roboto_Condensed'] font-light text-[#979797] mb-16">Streamline your exhibition planning, manage effortlessly, and simplify your exhibition process.</h2>
      <div className="flex justify-between items-center pb-6">
        <h3 className="text-lg font-['Roboto'] font-bold">Recently Opened</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
        {config.exhibits.map((exhibit) => (
          <div key={exhibit.id} className="group border-2 border-transparent rounded-none text-center p-4 transition-colors duration-300 hover:border-black">
            <Link to={`/exhibitions/${exhibit.id}`} className="text-black-500">
              <img
                src={`${process.env.PUBLIC_URL}${exhibit.image}`}
                alt={exhibit.title}
                className="w-full h-48 object-cover rounded-none mb-4"
              />
              <h2 className="text-xl font-['Roboto'] font-semibold transition-transform duration-300 transform group-hover:scale-110">
                {exhibit.title}
              </h2>
              <p className="text-gray-600 font-['Roboto'] transition-transform duration-300 transform group-hover:scale-110">
                {exhibit.description}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExhibitsList;
