import React from 'react';

const Legend: React.FC = () => {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2" id="legend">
      <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-green-500 rounded-sm"></div> Ouverte</div>
      <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-yellow-500 rounded-sm"></div> Partiellement ouverte</div>
      <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-red-500 rounded-sm"></div> Fermée</div>
      <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-blue-500 rounded-sm"></div> ZIC</div>
      <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-pink-400 rounded-sm"></div> Zone Amodiée</div>
    </div>
  );
};

export default Legend;