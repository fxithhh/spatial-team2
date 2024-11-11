import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Canvas from '../components/canvas'; // Ensure the correct import path
import ArtworkCard from '../components/artwork_card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import Breadcrumb from '../components/breadcrumb';
import config from '../data/config.json';

function ExhibitDetail() {
    const { id } = useParams();
    const exhibit = config.exhibits.find((exhibit) => exhibit.id === parseInt(id));

    const [floorplanImage, setFloorplanImage] = useState(null);
    const fileInputRef = useRef(null); // Create a ref for the file input

    // Function to handle floorplan image upload
    const handleFloorplanUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFloorplanImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const [activeButton, setActiveButton] = useState(null);

    const handleButtonClick = (buttonText) => {
        if (activeButton === buttonText) {
            setActiveButton(null);
        } else {
            setActiveButton(buttonText);
        }
    };

    if (!exhibit) {
        return <div className="container mx-auto p-4">Exhibit not found.</div>;
    }

    return (
        <div className='m-20'>
            {/* <div className="flex flex-row justify-center gap-8 mt-8">
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Heat Map"
                    isActive={activeButton === 'Heat Map'}
                    onClick={() => handleButtonClick('Heat Map')}
                />
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Fire / Emergency Plan"
                    isActive={activeButton === 'Fire / Emergency Plan'}
                    onClick={() => handleButtonClick('Fire / Emergency Plan')}
                />
                <Button
                    size={{ width: '265px', height: '50px' }}
                    text="Audience POV"
                    isActive={activeButton === 'Audience POV'}
                    onClick={() => handleButtonClick('Audience POV')}
                />
            </div> */}
            <Breadcrumb />
            <h1 className="font-['Roboto_Condensed'] font-bold text-3xl mb-12">Viewing Mode</h1>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <Canvas floorplanImage={floorplanImage} />
                </div>
                <div className="overflow-y-auto p-4 pt-0 pb-0">
                    <h1 className="text-2xl font-['Roboto'] font-semibold mb-4 text-center">Artworks</h1>
                    <div className="flex justify-center m-4">
                        <Button size={{ width: '275px', height: '75px' }} text="Add Artwork" />
                    </div>
                    <div className="flex flex-row justify-between pb-[15px]">
                        <h3 className="text-lg font-['Roboto'] font-bold">Existing Artworks</h3>
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
                    </div>
                    <div className="max-h-[475px] overflow-y-auto">
                        <ArtworkCard artworks={config.artworks} />
                    </div>
                    <h1 className="text-2xl font-['Roboto'] font-semibold mb-4 text-center pt-6">
                        Floor Plan
                    </h1>
                    <div className="flex justify-center m-4">
                        <Button
                            size={{ width: '275px', height: '75px' }}
                            text="Import Floor Plan"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        />
                        <input
                            ref={fileInputRef}
                            id="floorplan-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFloorplanUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExhibitDetail;
