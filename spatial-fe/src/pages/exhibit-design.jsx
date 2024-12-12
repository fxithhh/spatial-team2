import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import Graph from '../components/Graph'; // Adjust the path if necessary
import Breadcrumb from '../components/breadcrumb';
import { ArrowsRightLeftIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import OverlayComponent from '../components/OverlayComponent';
import ArtworkCard from '../components/artwork_card';
import ImportArtWork from '../components/popups/import-artwork';
import config from '../data/config.json';
import { AiOutlinePlus } from "react-icons/ai";

const ExhibitDetail = () => {
    const [view, setView] = useState("connection");
    const [artworks, setArtworks] = useState([]);
    const { id } = useParams();
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

    // Removed: isArtworkLibraryOpen state and toggle function

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
            <div className="flex justify-between items-center">
                <Breadcrumb />
                {/* Removed: Artwork Library toggle button */}
            </div>

            {/* Main Content */}
            <div className="flex flex-grow gap-x-10 z-0">
                {/* Main View Area */}
                <div className="flex w-3/4 bg-white relative">
                    {/* Main View */}
                    <div className="flex-grow flex justify-center items-center">
                        <OverlayComponent/>
                    </div>
                </div>

                {/* Side Panel */}
                <aside className="w-1/4 flex flex-col gap-y-10">
                    {/* Artwork Library */}
                    <div className="flex-grow p-4 border-black border-2 overflow-y-auto">
                        <h2 className="font-bold text-2xl mb-2">Artwork Library</h2>
                        <button
                            onClick={openAddArtwork}
                            className="text-lg font-bold font-['Roboto_Condensed'] cursor-pointer transition-all duration-300 px-4 py-2 bg-brand text-white hover:bg-brandhover mb-4 flex items-center"
                        >
                            <AiOutlinePlus className="mr-2" /> Add Artwork
                        </button>

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

                        {/* Artwork Details Section */}
                        <div className="mt-4 border-2 border-black py-4 px-8 mb-8 h-auto">
                            {selectedArtwork ? (
                                <ArtworkCard artwork={selectedArtwork} />
                            ) : (
                                <p className="text-lg text-red-500">Select an artwork to display its information.</p>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Removed: Separate Artwork Library Sidebar */}
            </div>

            {/* Add Artwork Import Component */}
            {isAddArtworkOpen && (
                <ImportArtWork
                    isOpen={isAddArtworkOpen}
                    closeAddArtwork={closeAddArtwork}
                />
            )}
        </div>
    );
};

export default ExhibitDetail;
