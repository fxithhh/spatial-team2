import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import Graph from '../components/Graph'; // Adjust the path if necessary
import Breadcrumb from '../components/breadcrumb';
import { ArrowsRightLeftIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Canvas from '../components/Canvas';
import OverlayComponent from '../components/OverlayComponent';
import ArtworkCard from '../components/artwork_card';
import ImportArtWork from '../components/popups/import-artwork';
import config from '../data/config.json';
import { AiOutlinePlus } from "react-icons/ai";

const ExhibitDetail = () => {
    const [view, setView] = useState("connection");
    const [artworks, setArtworks] = useState([]);
    const { id } = useParams();
    const [exhibit, setExhibit] = useState(null);
    const { exhibitId } = useParams();
    console.log("Exhibit ID:", exhibitId);
    const [error, setError] = useState(null);

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
        safety_distance: 25, // Added to match the settings in the UI
        corridor_width: 2.5,
        hose_length: 50,
        hose_radius: 200,
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

    const tabs = [
        { id: 1, label: "Path 1" },
        { id: 2, label: "Path 2" },
        { id: 3, label: "Path 3" },
    ];

    // React use state hooks
    const [floorplanImage, setFloorplanImage] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [selectedExhibit, setSelectedExhibit] = useState(null);
    const [isAddArtworkOpen, setIsAddArtworkOpen] = useState(false); // Add artwork popup

    // Dropdown toggle
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Handle artwork selection
    const handleArtworkSelect = (artwork) => {
        setSelectedArtwork(artwork);
    };

    // Open and close add artwork popup
    const openAddArtwork = () => {
        setIsAddArtworkOpen(true);
    };

    const closeAddArtwork = () => {
        setIsAddArtworkOpen(false);
    };

    const fetchArtworks = async () => {
        try {
            const response = await fetch(`http://localhost:5000/exhibits/${exhibitId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch exhibit: ${response.status}`);
            }
            const data = await response.json();

            // Update state with the exhibit and its artworks
            setSelectedExhibit(data);
            setArtworks(data.artworks || []);
        } catch (err) {
            setError('Error fetching exhibit');
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        if (exhibitId) {
            fetchArtworks();
        }
    }, [exhibitId]);

    if (error) return <p>Error: {error}</p>;

    return (
        <div className="flex flex-col min-h-screen my-8 mx-12">
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
            <div className="flex flex-grow gap-x-10 z-0">
                {/* Main View Area */}
                <div className="flex w-3/4 bg-white relative border-black border-2">
                    {/* Main View */}
                    <div className="flex-grow flex justify-center items-center p-4">
                        {view === "connection" ? (
                            <OverlayComponent/>
                        ) : (
                            <Canvas floorplanImage={floorplanImage} />
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
                <aside className="w-1/4 flex flex-col gap-y-10">
                    {/* Preview Box */}
                    <div className="w-full h-80 border-black border-2 flex justify-center items-center p-2 shadow-sm">
                        {/* Option 1: Using Size Props */}
                        {view === "connection" ? (
                            <Canvas
                                floorplanImage={floorplanImage}
                                width="300px"  // Specify desired width
                                height="200px" // Specify desired height
                            />
                        ) : (
                            <Graph
                                width="300px"  // Specify desired width
                                height="500px%" // Specify desired height
                            />
                        )}

                        {/* Option 2: Using CSS Transform Scale */}
                        {/*
                        <div className="transform scale-75 origin-top-left">
                            {view === "connection" ? (
                                <Canvas floorplanImage={floorplanImage} />
                            ) : (
                                <Graph />
                            )}
                        </div>
                        */}
                    </div>

                    {/* Settings Panel */}
                    <div className="flex-grow p-4 border-black border-2 overflow-y-auto">
                        {view === "connection" ? (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">Artwork Connections</h2>
                                <p className="text-lg text-gray-800 mb-4 font-['Roboto_Condensed']">
                                    Settings to adjust connection graphs.
                                </p>
                                <div className="space-y-4">
                                    {/* Narrative Connectivity Passing Score */}
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

                                    {/* Visual Connectivity Passing Score */}
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

                                    {/* Repelling Strength */}
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

                                    {/* Spring Length Modulator */}
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

                                    {/* Spring Strength Modulator */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Spring Strength Modulator</label>
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
                                <h2 className="text-2xl font-bold text-black mb-2">Fire Safety Guidelines</h2>
                                <p className="text-lg text-gray-800 mb-4 font-['Roboto_Condensed']">
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
                    <aside className="top-16 right-0 max-w-1/3 w-[500px] bg-white border-black border-l-2 px-12 z-50 h-[calc(100vh-64px)] ease-in-out duration-300 overflow-y-auto fixed">
                        <div className="flex items-center justify-between mb-8 mt-12">
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

                            {/* Artwork List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {artworks.map((artwork) => (
                                    <div
                                        key={artwork._id}
                                        onClick={() => {
                                            setSelectedArtwork(artwork); // Pass artwork data to ArtworkCard
                                            console.log(`Selected artwork: ${artwork.title || "Untitled"}`);
                                        }}
                                        className="grid grid-rows-3 px-2 py-2 border-b-2 cursor-pointer overflow-y-auto items-center hover:border-2 hover:bg-linkhover hover:border-brand"
                                    >
                                        <span className="font-semibold text-xl text-black mr-4 font-['Roboto_Condensed']">
                                            {artwork.title || "Untitled"}
                                        </span>
                                        <span className="font-normal text-base text-brand mr-4 font-['Roboto']">
                                            {artwork.artist || "Unknown Artist"}
                                        </span>
                                        <span className="font-normal text-sm text-gray-400 mr-4 font-['Roboto']">
                                            {artwork.dimension || "Unknown Dimensions"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/*Artwork Details Section*/}
                        <div className="mt-4 border-2 border-black py-4 px-8 mb-8 h-auto">
                            {selectedArtwork ? (
                                <ArtworkCard artwork={selectedArtwork} />
                            ) : (
                                <p className="text-lg text-red-500">Select an artwork to display its information.</p>
                            )}
                        </div>
                    </aside>
                )}

                {/* Add Artwork Import Component */}
                {isAddArtworkOpen && (
                    <ImportArtWork
                        isOpen={isAddArtworkOpen}
                        closeAddArtwork={closeAddArtwork}
                    />
                )}
            </div>
        </div>
    );
};

export default ExhibitDetail;
