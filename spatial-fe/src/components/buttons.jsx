import React, { useState } from 'react';

const Button = ({ size, text, isActive, onClick }) => {

  return (
    <div className="flex font-['Roboto']">
      <button
        className={`text-xl font-bold font-['Roboto_Condensed'] cursor-pointer transition-all duration-300
         bg-brand text-white hover:bg-brandhover`}
        style={{ width: size.width, height: size.height }}
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  );
};

export default Button;
