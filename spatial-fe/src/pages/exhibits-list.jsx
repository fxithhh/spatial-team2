import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/navbar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';

// Example exhibits data
const exhibits = [
  { id: 1, title: 'Everyday Practices', description: 'A deep dive into modern art.' },
  { id: 2, title: 'Learning Gallery', description: 'A collection of sculptures.' },
  { id: 3, title: 'ChildISH', description: 'Iconic photography exhibits.' },
];

function ExhibitsList() {
  return (
    <div>
      <div className="mx-auto w-[70%]">
        <div className="flex justify-between w-full mt-32 h-[65px] mb-4">
          <h1 className="text-4xl font-bold font-['Roboto_Condensed'] h-[65px]">Exhibitions</h1>
          <Button size={{ width: '265px', height: '65px' }} text="Create New Exhibit" />
        </div>
        <h2 className="text-2xl font-light text-gray-600 mb-16">Insert Subtitle</h2>
        <div className="flex justify-between items-center pb-6">
          <h3 className="text-xl font-bold">Recently Opened</h3>
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exhibits.map((exhibit) => (
            <div key={exhibit.id} className="border border-gray-300 p-4 rounded-lg shadow-md transition-colors duration-300 hover:bg-gray-100">
              <Link to={`/exhibitions/${exhibit.id}`} className="text-blue-500">
                <h2 className="text-xl font-semibold">{exhibit.title}</h2>
                <p className="text-gray-600">{exhibit.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExhibitsList;
