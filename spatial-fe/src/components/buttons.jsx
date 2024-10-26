import React, { useState } from 'react';

const Button = ({ size, text }) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="flex p-2 font-['Roboto']">
      <button
        className={`${
          isActive
            ? 'bg-[#E70362] text-white rounded-none'
            : 'bg-white border-2 border-black rounded-none text-black hover:bg-[#E70362] hover:text-white hover:border-transparent'
        } p-3 text-lg font-medium cursor-pointer transition-all duration-300`}
        style={{ width: size.width, height: size.height }}
        onClick={handleClick}
      >
        {text}
      </button>
    </div>
  );
};

export default Button;
