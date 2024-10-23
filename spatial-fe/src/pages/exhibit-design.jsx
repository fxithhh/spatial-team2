import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Canvas from '../components/canvas'

// Example exhibits data (same as in Exhibitions.js, could be from API or database)
const exhibits = [
    { id: 1, title: 'Everyday Practices', description: 'A deep dive into modern art.' },
    { id: 2, title: 'Learning Gallery', description: 'A collection of sculptures.' },
    { id: 3, title: 'ChildISH', description: 'Iconic photography exhibits.' },
];

function ExhibitDetail() {
    const { id } = useParams();
    const exhibit = exhibits.find((exhibit) => exhibit.id === parseInt(id));

    // adding a shape
    const [shapes, setShapes] = useState([]); // State for shapes

    function addShape() {
        // Create a new shape with random position and radius
        const newShape = {
            x: Math.random() * 400, // Adjust this value based on your canvas width
            y: Math.random() * 400, // Adjust this value based on your canvas height
            radius: 30,
        };
        setShapes((prevShapes) => [...prevShapes, newShape]);
    };

    if (!exhibit) {
        return <div className="container mx-auto p-4">Exhibit not found.</div>;
    }

    return (
        <div className='grid grid-cols-2 gap-10 m-4'>
                <Canvas shapes={shapes}/>
            <div className="ml-8">
                <h1 className="text-3xl font-bold mb-4">{exhibit.title}</h1>
                <p className="text-lg text-gray-700">{exhibit.description}</p>
                <p className="text-sm text-gray-500">Exhibit ID: {exhibit.id}</p>
                <button onClick={addShape} className="mt-4 p-2 bg-blue-500 text-white rounded">
                    Add Circle
                </button>
            </div>
        </div>
    );
}

export default ExhibitDetail;
