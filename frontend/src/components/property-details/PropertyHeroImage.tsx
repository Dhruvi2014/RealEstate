import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyHeroImageProps {
  images?: string[];
}

const PropertyHeroImage: React.FC<PropertyHeroImageProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use provided images or fallback
  const safeImages = images && images.length > 0 
    ? images 
    : ["https://images.unsplash.com/photo-1622015663381-d2e05ae91b72?w=1200"];
  
  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-[#F2EFE9] py-8">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="relative aspect-[1280/440] rounded-2xl overflow-hidden shadow-xl mb-4 group">
          <img 
            src={safeImages[currentIndex]}
            alt={`Property view ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          
          {/* Navigation Arrows */}
          {safeImages.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {safeImages.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#D4755B]/60 scrollbar-track-transparent">
            {safeImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-40 h-28 flex-shrink-0 rounded-xl overflow-hidden border-[3px] transition-all duration-200 focus:outline-none ${
                  currentIndex === idx 
                    ? 'border-[#D4755B] shadow-lg scale-[1.02]' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyHeroImage;