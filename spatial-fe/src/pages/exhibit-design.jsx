import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

//components
import Canvas from '../components/canvas'; // Ensure the correct import path
import ArtworkCard from '../components/artwork_card';
import Breadcrumb from '../components/breadcrumb';
import ImportArtWork from '../components/popups/import-artwork';
import FullArtworkDetails from '../components/popups/full-artwork-details';

// data
import config from '../data/config.json';

//icons
import { AiOutlineDown } from "react-icons/ai";
import { AiOutlinePlus } from "react-icons/ai";

function ExhibitDetail() {
    const { id } = useParams();
    const exhibit = config.exhibits.find((exhibit) => exhibit.id === parseInt(id));
    const exhibitPaths = [
        "Artwork Connections",
        "Fire & Emergency Plan",
        "Audience POV"
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


    // open and close artwork details popup
    const openArtworkDetails = () => {
        setIsArtworkDetailsOpen(true);
    };

    const closeArtworkDetails = () => {
        setIsArtworkDetailsOpen(false);
    };

    return (
        <div className='mx-20 my-12'>
            <Breadcrumb />
            {/* Choose Exhibit Dropdown */}
            <div className="my-8 flex">
                <h1 className="font-['Roboto_Condensed'] font-bold text-4xl mr-8">Viewing Mode</h1>
                <div>
                    <button
                        onClick={toggleDropdown}
                        className="px-4 py-2 bg-brand text-white font-semibold font-['Roboto_Condensed'] focus:outline-none hover:bg-brandhover active:bg-brandhover"
                        type="button"
                    >
                        <span className='flex items-center'>{selectedPath ? selectedPath : "Select a Pathway"} <AiOutlineDown className='ml-2' /></span>
                    </button>

                    {/* Dropdown menu */}
                    {isOpen && (
                        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-md shadow-lg font-['Roboto_Condensed']">
                            <ul className="max-h-60 overflow-y-auto ">
                                {exhibitPaths.map((path) => (
                                    <li
                                        key={path}
                                        className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            console.log(`Selected exhibit path: ${path}`);
                                            handlePathSelect(path);
                                        }}
                                    >
                                        {path}
                                    </li>
                                ))}

                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* canvas div */}
                <div className="col-span-2">
                    <Canvas floorplanImage={floorplanImage} />
                </div>

                {/* sandbox div */}
                <div>
                    <h2 className="text-2xl font-['Roboto_Condensed'] font-semibold -mt-8 text-center">Museum Sandbox</h2>
                    <div className="border-2 border-black py-4 px-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-['Roboto_Condensed'] font-semibold">List of Artworks</h3>
                            <button
                                onClick={openAddArtwork}
                                className="text-lg font-bold font-['Roboto_Condensed'] cursor-pointer transition-all duration-300 px-4 py-1 bg-brand text-white hover:bg-brandhover">
                                <span className="flex items-center"><AiOutlinePlus className="mr-2" /> Add Artwork</span>
                            </button>
                        </div>

                        {/* toggle between paths */}
                        <div className="flex justify-around mb-4 ">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        handleTabClick(tab.label)
                                        console.log(`Selected generated path: ${tab.label}`)
                                    }
                                    }
                                    className={`w-full ${activeTab === tab.label ? "border-b-4 border-brand" : "border-b-2 border-gray-500 text-gray-500"}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
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
                            <button
                                onClick={openArtworkDetails}
                                className="text-lg font-bold font-['Roboto_Condensed'] cursor-pointer transition-all duration-300 px-4 py-1 bg-brand text-white hover:bg-brandhover">
                                <span>See Full Details</span>
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {selectedArtwork && (
                                <ArtworkCard artwork={selectedArtwork} /> // Pass the selected artwork as a prop
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isAddArtworkOpen && (<ImportArtWork isOpen={isAddArtworkOpen} closeAddArtwork={closeAddArtwork} />)}
            {isArtworkDetailsOpen && (<FullArtworkDetails isOpen={isArtworkDetailsOpen} closeArtworkDetails={closeArtworkDetails} artwork={selectedArtwork} />)}
        </div>
    );
}

export default ExhibitDetail;
