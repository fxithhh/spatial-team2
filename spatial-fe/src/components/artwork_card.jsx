import React from 'react';

const artwork = [
  { id: 1, title: 'Scanning', artist: 'Amy Lee Sanford', date: '2013', image: require('../assets/everyday_practices.jpeg') },
  { id: 2, title: 'Blinded No More So Immortality We Go', artist: 'Anne Samat', date: '2017', image: require('../assets/learning_gallery.jpg') },
  { id: 3, title: 'Golden Teardrop', artist: 'Arin Rungjang', date: '2013', image: require('../assets/childish.jpg') },
];

function ArtworkCard() {
  return (
    <div className="flex flex-col space-y-[30px]">
      {artwork.map((item) => (
        <div key={item.id} className="w-full h-[135px] border-2 border-black flex flex-row p0"> {/* Added padding for border visibility */}
          <img className="w-[131px] h-[131px]" src={item.image} alt={item.title} /> {/* Reduced image size slightly to prevent overlap */}
          <div className="p-[24px]">
            <h1 className="font-['Roboto_Condensed'] font-bold text-black text-[24px] overflow-ellipsis wh-fit">{item.title}</h1>
            <h2 className="font-['Roboto'] font-extralight text-[#979797] text-[20px] overflow-hidden text-ellipsis wh-fit">{item.artist}</h2>
            <p className="font-['Roboto'] font-bold text-[#979797] text-[16px] overflow-hidden text-ellipsis wh-fit">{item.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ArtworkCard;
