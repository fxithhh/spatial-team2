import React, { useState } from 'react';

function Guidelines() {
    // State to hold the values of each slider
    const [values, setValues] = useState({
        safety_distance: 25,
        corridor_width: 1.1,
        hose_length: 30,
        hose_radius: 300
    });

    // Handler to update state when slider value changes
    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prevValues) => ({
            ...prevValues,
            [name]: Number(value),
        }));
    };

    // Handler to log form values on submit
    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form Values:", values);
    };

    return (
        <div className="my-12 mx-auto w-1/2">
            <h1 className="text-5xl font-semibold mb-4">Guidelines Settings</h1>
            <p className="text-gray-500 text-2xl">Key guidelines for fire safety and emergency exits compliance.</p>
            <div className="my-8">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Safety Travel Distance Slider */}
                    <div className='my-4'>
                        <div className='grid grid-cols-2'>
                            <label className="font-bold text-gray-800 text-xl">Safety Travel Distance:</label>
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
                        <div className='grid grid-cols-2'>
                            <label className="font-bold text-gray-800 text-xl">Corridor Width:</label>
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
                        <div className='grid grid-cols-2'>
                            <label className="font-bold text-gray-800 text-xl">Fire Hose Length:</label>
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
                        <div className='grid grid-cols-2'>
                            <label className="font-bold text-gray-800 text-xl">Fire Hose Bend Radius Length:</label>
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

                    {/* Submit Button */}
                    <div className='mx-auto flex justify-center'>
                        <button
                            type="submit"
                            className="bg-brand text-white py-2 px-8 rounded hover:bg-brandhover"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Guidelines;
