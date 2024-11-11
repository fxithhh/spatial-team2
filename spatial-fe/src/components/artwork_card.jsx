import React from 'react';

function ArtworkCard({ artworks }) {
  return (
    <div className="flex flex-col space-y-[30px]">
      {artworks.map((item) => (
        <div key={item.id} className="w-full h-[135px] border-2 border-black flex flex-row p-0">
          <img  className='w-1/4 object-cover' src={`${process.env.PUBLIC_URL}${item.image}`} alt={item.title} />
          <div className="p-6">
            <h1 className="font-['Roboto_Condensed'] font-bold text-black text-2xl overflow-hidden text-ellipsis whitespace-nowrap">
              {item.title}
            </h1>
            <h2 className="font-['Roboto'] font-extralight text-[#979797] text-xl overflow-hidden text-ellipsis whitespace-nowrap">
              {item.artist}
            </h2>
            <p className="font-['Roboto'] font-bold text-[#979797] text-lg overflow-hidden text-ellipsis whitespace-nowrap">
              {item.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ArtworkCard;
