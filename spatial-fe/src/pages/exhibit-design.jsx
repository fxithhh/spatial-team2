import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Canvas from '../components/canvas';
import ArtworkCard from '../components/artwork_card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import config from '../data/config.json';

function ExhibitDetail() {
    const { id } = useParams();
    const exhibit = config.exhibits.find((exhibit) => exhibit.id === parseInt(id));

    const [shapes, setShapes] = useState([]); // State for shapes

    function addShape() {
        // Create a new shape with random position and radius
        const newShape = {
            x: Math.random() * 400, // Adjust this value based on your canvas width
            y: Math.random() * 400, // Adjust this value based on your canvas height
            radius: 30,
        };
        setShapes((prevShapes) => [...prevShapes, newShape]);
    }

    const [activeButton, setActiveButton] = useState(null);

    const handleButtonClick = (buttonText) => {
        // Set the active button to the clicked one
        if (activeButton === buttonText) {
            setActiveButton(null); // Deselect if the active button is clicked again
        } else {
            setActiveButton(buttonText); // Set new active button
        }
    };

    if (!exhibit) {
        return <div className="container mx-auto p-4">Exhibit not found.</div>;
    }

    return (
        <div>
            <div className='flex flex-row justify-center gap-8 mt-8'>
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Heat Map"
                    isActive={activeButton === "Heat Map"}
                    onClick={() => handleButtonClick("Heat Map")}
                />
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Fire / Emergency Plan"
                    isActive={activeButton === "Fire / Emergency Plan"}
                    onClick={() => handleButtonClick("Fire / Emergency Plan")}
                />
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Audience POV"
                    isActive={activeButton === "Audience POV"}
                    onClick={() => handleButtonClick("Audience POV")}
                />
            </div>
            <div className='grid grid-cols-2 m-[75px] gap-[75px]'>
                <Canvas shapes={shapes} className='w-full' />
                {/* <p className="text-lg text-gray-700">{exhibit.description}</p>
                <p className="text-sm text-gray-500">Exhibit ID: {exhibit.id}</p>
                <button onClick={addShape} className="mt-4 p-2 bg-blue-500 text-white rounded">
                    Add Circle
                </button> */}
                <div className="overflow-y-auto max-h-[calc(100vh-150px)] p-4 pt-0 pb-0">
                    <h1 className="text-2xl font-['Roboto'] font-semibold mb-4 text-center">Artworks</h1>
                    <div className="flex justify-center m-4">
                        <Button size={{ width: '275px', height: '75px' }} text="Add Artwork" />
                    </div>
                    <div className='flex flex-row justify-between pb-[15px]'>
                        <h3 className="text-lg font-['Roboto'] font-bold">Existing Artworks</h3>
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
                    </div>
                    <div className="max-h-[475px] overflow-y-auto">
                        <ArtworkCard artworks={config.artworks} />
                    </div>
                    <h1 className="text-2xl font-['Roboto'] font-semibold mb-4 text-center pt-6">Floor Plan</h1>
                    <div className="flex justify-center m-4">
                        <Button size={{ width: '275px', height: '75px' }} text="Import Floor Plan" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExhibitDetail;
