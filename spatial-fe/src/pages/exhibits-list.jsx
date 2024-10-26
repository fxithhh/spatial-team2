import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/navbar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';

// Example exhibits data
const exhibits = [
  { id: 1, title: 'Everyday Practices', description: 'A deep dive into modern art.', image: require('../assets/everyday_practices.jpeg') },
  { id: 2, title: 'Learning Gallery', description: 'A collection of sculptures.', image: require('../assets/learning_gallery.jpg') },
  { id: 3, title: 'ChildISH', description: 'Iconic photography exhibits.', image: require('../assets/childish.jpg') },
];

function ExhibitsList() {
  return (
    <div className="mx-auto w-[70%]">
      <div className="flex justify-between w-full mt-32 h-[65px] mb-4">
        <h1 className="text-4xl font-bold font-['Roboto_Condensed'] h-[65px]">Exhibitions</h1>
        <Button size={{ width: '265px', height: '65px' }} text="Create New Exhibit" />
      </div>
      <h2 className="text-2xl font-light text-[#979797] mb-16">Insert Subtitle</h2>
      <div className="flex justify-between items-center pb-6">
        <h3 className="text-xl font-bold">Recently Opened</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
      </div>
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
        {exhibits.map((exhibit) => (
          <div key={exhibit.id} className="group border-2 border-transparent rounded-none text-center p-4 transition-colors duration-300 hover:border-black">
            <Link to={`/exhibitions/${exhibit.id}`} className="text-black-500">
              <img
                src={exhibit.image}
                alt={exhibit.title}
                className="w-full h-48 object-cover rounded-none mb-4 transition-transform duration-300 transform group-hover:scale-105"
              />
              <h2 className="text-xl font-['Roboto'] font-semibold transition-transform duration-300 transform group-hover:scale-105">
                {exhibit.title}
              </h2>
              <p className="text-gray-600 transition-transform duration-300 transform group-hover:scale-105">
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
