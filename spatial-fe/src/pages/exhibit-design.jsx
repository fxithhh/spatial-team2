import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/breadcrumb';
import { ArrowsRightLeftIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Canvas from '../components/canvas'; // Ensure the correct import path
import ArtworkCard from '../components/artwork_card';
import ImportArtWork from '../components/popups/import-artwork';
import config from '../data/config.json';
import { AiOutlinePlus } from "react-icons/ai";

const ExhibitDetail = () => {
    const [view, setView] = useState("connection");

    // Toggle between connection and floor plan views
    const toggleView = () => {
        setView((prevView) => (prevView === "connection" ? "floorPlan" : "connection"));
    };

    // State to hold the values of each slider
    const [values, setValues] = useState({
        narrative: 4,
        visual: 5,
        repelling_strength: 4,
        spring_length: 4,
        spring_strength: 4,
        selectedExhibit: null,
    });

    // Handler to update state when slider value changes
    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prevValues) => ({
            ...prevValues,
            [name]: Number(value),
        }));
    };

    const [isArtworkLibraryOpen, setIsArtworkLibraryOpen] = useState(false); // Toggle for Artwork Library

    // Toggle Artwork Library Sidebar
    const toggleArtworkLibrary = () => {
        setIsArtworkLibraryOpen((prev) => !prev);
    };
    const { id } = useParams();
    const exhibit = config.exhibits.find((exhibit) => exhibit.id === parseInt(id));
    const exhibitPaths = [
        "Artwork Connections",
        "Fire & Emergency Plan"
    ];

    const tabs = [
        { id: 1, label: "Path 1" },
        { id: 2, label: "Path 2" },
        { id: 3, label: "Path 3" },
    ];

    // react use state hooks
    const [floorplanImage, setFloorplanImage] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState("Artwork Connections");
    const [activeTab, setActiveTab] = useState("Path 1");
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [isAddArtworkOpen, setIsAddArtworkOpen] = useState(false); // add artwork popup
    const [isArtworkDetailsOpen, setIsArtworkDetailsOpen] = useState(false); // artwork details popup

    if (!exhibit) {
        return <div className="container mx-auto p-4">Exhibit not found.</div>;
    }

    // dropdown stuff
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // function to select path to display
    const handlePathSelect = (path) => {
        setSelectedPath(path);
        setIsOpen(false);
    };

    // Function to switch between path tabs
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // select artwork to display details
    // Handle artwork selection
    const handleArtworkSelect = (artwork) => {
        setSelectedArtwork(artwork);
    };

    // open and close add artwork popup
    const openAddArtwork = () => {
        setIsAddArtworkOpen(true);
    };

    const closeAddArtwork = () => {
        setIsAddArtworkOpen(false);
    };

    return (
        <div className="flex flex-col m-h-screen my-12 mx-12">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center mb-4">
                <Breadcrumb />
                <button
                    onClick={toggleArtworkLibrary}
                    className="flex items-center text-black justify-middle gap-2"
                >
                    Artwork Library
                    <ListBulletIcon className="h-6 rotate-180" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-grow gap-x-10">
                {/* Main View Area */}
                <div className="w-4/5 bg-white relative border-black border-2">
                    {/* Main View */}
                    <div className="flex-grow flex justify-center items-center p-4">
                        {view === "connection" ? (
                            <div>artwork connection</div>
                        ) : (
                            <div>
                                floorplan w safety guidelines
                                <Canvas floorplanImage={floorplanImage} />
                            </div>
                        )}
                    </div>

                    {/* Switch View Button */}
                    <div className='flex flex-row-reverse h-5'>
                        <button
                            onClick={toggleView}
                            className="absolute top-0 right-0 bg-brand text-white px-4 py-2 rounded-0 transition flex items-center"
                        >
                            Switch View
                            <ArrowsRightLeftIcon className='h-5 ml-2' />
                        </button>
                    </div>
                </div>

                {/* Side Panel */}
                <aside className="w-1/5 flex flex-col gap-y-10">
                    {/* Preview Box */}
                    <div className="w-full h-80 border-black border-2 flex justify-center items-center p-2 shadow-sm">
                        {view === "connection" ? (
                            <div>floorplan w safety guidelines</div>
                        ) : (
                            <div>artwork connection</div>
                        )}
                    </div>

                    {/* Settings Panel */}
                    <div className="flex-grow p-4 border-black border-2">
                        {view === "connection" ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Artwork Connections</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Settings to adjust connection graphs.
                                </p>
                                <div className="space-y-4">
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Narrative Connectivity Passing Score</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.narrative}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Maximum allowable travel distance in case of an emergency.</p>
                                        <input
                                            type="range"
                                            name="narrative"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.narrative}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Visual Connectivity Passing Score</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.visual}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Passing score to display edges.</p>
                                        <input
                                            type="range"
                                            name="visual"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.visual}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Repelling Strength</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.repelling_strength}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="repelling_strength"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.repelling_strength}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Spring Length Modulator</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.spring_length}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="spring_length"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.spring_length}
                                            onChange={handleChange}
                                            className="w-full accent-brand my-4"
                                        />
                                    </div>

                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Spring Length Modulator</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.spring_strength}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="spring_strength"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.spring_strength}
                                            onChange={handleChange}
                                            className="w-full accent-brand my-4"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Fire Safety Guidelines</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Settings for fire safety & emergency compliance.
                                </p>
                                <div className="space-y-4">
                                    {/* Safety Travel Distance Slider */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Safety Travel Distance</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.safety_distance} m</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Maximum allowable travel distance in case of an emergency.</p>
                                        <input
                                            type="range"
                                            name="safety_distance"
                                            min="0"
                                            max="50"
                                            value={values.safety_distance}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Corridor Width Slider */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Corridor Width</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.corridor_width} m</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Minimum corridor width for safe evacuation.</p>
                                        <input
                                            type="range"
                                            name="corridor_width"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={values.corridor_width}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Fire Hose Length Slider */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Fire Hose Length</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.hose_length} m</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Standard length of fire hose for coverage.</p>
                                        <input
                                            type="range"
                                            name="hose_length"
                                            min="0"
                                            max="100"
                                            value={values.hose_length}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Fire Hose Bend Radius Slider */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Fire Hose Bend Radius Length</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.hose_radius} mm</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Permissible bend radius for fire hoses to maintain water flow.</p>
                                        <input
                                            type="range"
                                            name="hose_radius"
                                            min="0"
                                            max="400"
                                            value={values.hose_radius}
                                            onChange={handleChange}
                                            className="w-full accent-brand my-4"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* Artwork Library Sidebar */}
                {isArtworkLibraryOpen && (
                    <aside className="top-16 right-0 w-1/5 bg-white border-black border-l-2 px-12 z-50 h-[calc(100vh-64px)] ease-in-out duration-300 overflow-y-auto fixed">
                        <div className="flex items-center justify-between mb-8 mt-16">
                            <h2 className="font-bold">Artwork Library</h2>
                            <button
                                onClick={toggleArtworkLibrary}
                                className="text-gray-500 hover:text-black"
                            >
                                <XMarkIcon className="h-6 w-6 rotate-180 color-black" />
                            </button>
                        </div>
                        <div className="border-2 border-black py-4 px-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-['Roboto_Condensed'] font-semibold">List of Artworks</h3>
                                <button
                                    onClick={openAddArtwork}
                                    className="text-lg font-bold font-['Roboto_Condensed'] cursor-pointer transition-all duration-300 px-4 py-1 bg-brand text-white hover:bg-brandhover">
                                    <span className="flex items-center"><AiOutlinePlus className="mr-2" /> Add Artwork</span>
                                </button>
                            </div>

                            {config.artworks.map((artwork) => (
                                <div key={artwork.id}
                                    onClick={() => {
                                        handleArtworkSelect(artwork)
                                        console.log(`Selected generated path: ${artwork.title}`)

                                    }}
                                    className="grid grid-cols-12 py-1 px-2 my-2 border-b-2 cursor-pointer max-h-60 overflow-y-auto hover:border-2 hover:bg-linkhover hover:border-brand">
                                    <span className='col-span-5 capitalize'>{artwork.id}. {artwork.title}</span>
                                    <span className='col-span-3 capitalize'>{artwork.display_type}</span>
                                    <span className='col-span-4 capitalize'>{artwork.dimensions}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 border-2 border-black py-4 px-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-['Roboto_Condensed'] font-semibold">Artwork Details</h3>
                            </div>
                            {selectedArtwork ? (
                                <ArtworkCard artwork={selectedArtwork} /> // Pass the selected artwork as a prop
                            ) : <p className='text-lg text-red-500'>Select an artwork to display its information.</p>}
                        </div>
                    </aside>
                )}
            </div>
            {isAddArtworkOpen && (<ImportArtWork isOpen={isAddArtworkOpen} closeAddArtwork={closeAddArtwork} />)}
        </div >
    );
};

export default ExhibitDetail;
