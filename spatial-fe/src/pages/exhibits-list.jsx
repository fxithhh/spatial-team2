import React from 'react';
import { Link } from 'react-router-dom';

// Example exhibits data
const exhibits = [
  { id: 1, title: 'Everyday Practices', description: 'A deep dive into modern art.' },
  { id: 2, title: 'Learning Gallery', description: 'A collection of sculptures.' },
  { id: 3, title: 'ChildISH', description: 'Iconic photography exhibits.' },
];

function ExhibitsList() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Exhibitions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exhibits.map((exhibit) => (
          <div key={exhibit.id} className="border p-4 rounded-lg shadow-md hover:bg-gray-100">
            <Link to={`/exhibitions/${exhibit.id}`} className="text-blue-500">
              <h2 className="text-xl font-semibold">{exhibit.title}</h2>
              <p className="text-gray-600">{exhibit.description}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>

  );
}

export default ExhibitsList;
