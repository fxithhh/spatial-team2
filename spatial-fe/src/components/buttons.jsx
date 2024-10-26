import React, { useState } from 'react';

const Button = ({ size, text, isActive, onClick }) => {

  return (
    <div className="flex font-['Roboto']">
      <button
      className={`p-3 text-lg font-medium cursor-pointer transition-all duration-300 rounded-none
        ${isActive ? 'bg-brand text-white' : 'bg-white border-2 border-black rounded-none text-black hover:bg-brandhover hover:text-white hover:border-transparent'}
         px-4 py-2`}
        style={{ width: size.width, height: size.height }}
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  );
};

export default Button;
