import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import Graph from '../components/Graph';
import Canvas from '../components/Canvas';
import OverlayComponent from '../components/OverlayComponent';
import Breadcrumb from '../components/breadcrumb';
import { ArrowsRightLeftIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ArtworkCard from '../components/artwork_card';
import ImportArtWork from '../components/popups/import-artwork';
import config from '../data/config.json';
import { AiOutlinePlus } from "react-icons/ai";

const ExhibitDetail = () => {
    const [view, setView] = useState("connection");
    const [artworks, setArtworks] = useState([]);
    const { id } = useParams();
    const { exhibitId } = useParams();
    const [exhibit, setExhibit] = useState(null);
    const [error, setError] = useState(null);

    // Track overlay viewMode
    const [overlayViewMode, setOverlayViewMode] = useState(0);

    // Toggle between connection and floor plan views
    const toggleView = () => {
        setView((prevView) => (prevView === "connection" ? "floorPlan" : "connection"));
    };

    // State to hold the values of each slider (renamed to match Graph.js props)
    const [values, setValues] = useState({
        narrativeThreshold: 6.0,         // was narrative
        visualThreshold: 4.0,           // was visual
        repulsionStrength: 10,          // was repelling_strength
        springLengthModulator: 0.7,     // was spring_length
        springStiffnessModulator: 0.7,  // was spring_strength
        centralGravity: 0.001,          // newly added to match Graph
        safety_distance: 25, 
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
    const [excelImages, setExcelImages] = useState([]);
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
            console.log("Fetched exhibit data:", data);
            const excelImages = data.excel_images || [];
            console.log("Excel Images at Exhibit Level:", excelImages);
            if (data.artworks && data.artworks.length > 0) {
                data.artworks.forEach((artwork, index) => {
                    console.log(`Artwork ${index} excel_images:`, artwork.excel_images);
                });
            }
            setSelectedExhibit(data);
            setArtworks(data.artworks || []);
            setFloorplanImage(data.floor_plan);
            setExcelImages(excelImages);
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
                    <OverlayComponent
                        visualThreshold={values.visualThreshold}
                        narrativeThreshold={values.narrativeThreshold}
                        springLengthModulator={values.springLengthModulator}
                        springStiffnessModulator={values.springStiffnessModulator}
                        repulsionStrength={values.repulsionStrength}
                        centralGravity={values.centralGravity}
                        onViewModeChange={setOverlayViewMode}
                    />
                </div>

                {/* Side Panel */}
                <aside className="w-1/4 flex flex-col gap-y-10">
                    {/* Settings Panel */}
                    <div className="flex-grow p-4 border-black border-2 overflow-y-auto">
                        {(view === "connection" && overlayViewMode !== 0 && overlayViewMode !== 3) ? (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">Artwork Connections</h2>
                                <p className="text-lg text-gray-800 mb-4 font-['Roboto_Condensed']">
                                Instructions: Click on a node to select it, then press F to fix/unfix its position. Drag fixed nodes to temporarily unfix them. Press H to hide a node, and I to toggle image mode.
                                </p>
                                <div className="space-y-4">
                                    {/* Narrative Connectivity Threshold */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Narrative Connectivity Passing Score</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.narrativeThreshold}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Maximum allowable travel distance in case of an emergency.</p>
                                        <input
                                            type="range"
                                            name="narrativeThreshold"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.narrativeThreshold}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Visual Connectivity Threshold */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Visual Connectivity Passing Score</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.visualThreshold}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Passing score to display edges.</p>
                                        <input
                                            type="range"
                                            name="visualThreshold"
                                            min="0"
                                            max="10"
                                            step={0.1}
                                            value={values.visualThreshold}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Repulsion Strength */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Repulsion Strength</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.repulsionStrength}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="repulsionStrength"
                                            min="0"
                                            max="200"
                                            step={1}
                                            value={values.repulsionStrength}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                    {/* Spring Length Modulator */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Spring Length Modulator</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.springLengthModulator}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="springLengthModulator"
                                            min="0"
                                            max="3.0"
                                            step={0.1}
                                            value={values.springLengthModulator}
                                            onChange={handleChange}
                                            className="w-full accent-brand my-4"
                                        />
                                    </div>

                                    {/* Spring Stiffness Modulator */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Spring Stiffness Modulator</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.springStiffnessModulator}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Subtitle.</p>
                                        <input
                                            type="range"
                                            name="springStiffnessModulator"
                                            min="0.1"
                                            max="3.0"
                                            step={0.1}
                                            value={values.springStiffnessModulator}
                                            onChange={handleChange}
                                            className="w-full accent-brand my-4"
                                        />
                                    </div>

                                    {/* Central Gravity */}
                                    <div className='my-4'>
                                        <div className='grid grid-cols-[3fr_1fr]'>
                                            <label className="font-bold text-gray-800 text-xl">Central Gravity</label>
                                            <p className="font-bold text-gray-800 text-xl text-right">{values.centralGravity.toFixed(4)}</p>
                                        </div>
                                        <p className="text-gray-500 text-lg">Central gravity setting for the graph layout.</p>
                                        <input
                                            type="range"
                                            name="centralGravity"
                                            min="0.0001"
                                            max="0.1"
                                            step="0.0001"
                                            value={values.centralGravity}
                                            onChange={handleChange}
                                            className="w-full accent-brand mt-4"
                                        />
                                    </div>

                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">Fire Safety Guidelines</h2>
                                <p className="text-lg text-gray-800 mb-4 font-['Roboto_Condensed']">
                                    <strong>Tool Hotkeys</strong> 
                                    <br/>
                                    <strong>W: Wall, E: Entrance, F: Fire Escape</strong>
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
                                            setSelectedArtwork(artwork); 
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
                        exhibitionId={exhibitId}
                    />
                )}
            </div>
        </div>
    );
};

export default ExhibitDetail;
