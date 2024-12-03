import React, { useState } from 'react';
import Breadcrumb from '../components/breadcrumb';

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


    return (
        <div className="flex flex-col m-h-screen my-12 mx-auto w-4/5">
            {/* Breadcrumb */}
            <Breadcrumb />

            {/* Main Content */}
            <div className="flex flex-grow gap-x-10">
                {/* Main View Area */}
                <div className="w-4/5 bg-white relative border-black border-2">
                    {/* Main View */}
                    <div className="flex-grow flex justify-center items-center p-4">
                        {view === "connection" ? (
                            <div>artwork connection</div>
                        ) : (
                            <div>floorplan w safety guidelines</div>
                        )}
                    </div>

                    {/* Switch View Button */}
                    <button
                        onClick={toggleView}
                        className="absolute top-0 right-0 bg-brand text-white px-4 py-2 rounded-0 transition"
                    >
                        Switch View
                    </button>
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
            </div>
        </div>
    );
};

export default ExhibitDetail;
