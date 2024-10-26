import React, { useState } from 'react';

function Guidelines() {
  // State to hold the values of each slider
  const [values, setValues] = useState({
    volume: 50,
    brightness: 75,
    contrast: 100,
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Adjust Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Volume Slider */}
        <div>
          <label className="block text-gray-700">Volume: {values.volume}%</label>
          <input
            type="range"
            name="volume"
            min="0"
            max="100"
            value={values.volume}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        {/* Brightness Slider */}
        <div>
          <label className="block text-gray-700">Brightness: {values.brightness}%</label>
          <input
            type="range"
            name="brightness"
            min="0"
            max="100"
            value={values.brightness}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        {/* Contrast Slider */}
        <div>
          <label className="block text-gray-700">Contrast: {values.contrast}%</label>
          <input
            type="range"
            name="contrast"
            min="0"
            max="200"
            value={values.contrast}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}

export default Guidelines;
