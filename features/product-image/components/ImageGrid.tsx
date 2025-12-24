import React, { useState } from 'react';
import ImageModal from './ImageModal';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface ImageGridProps {
  images: string[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handleCopy = (e: React.MouseEvent, text: string, index: number) => {
    e.stopPropagation(); // Prevent modal from opening
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
        setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
        {images.map((imageSrc, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div 
              className="relative group aspect-square bg-gray-200 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer border border-gray-200"
              onMouseDown={(e) => {
                  if (e.button === 0) {
                      openModal(index);
                  }
              }}
            >
              <img
                src={imageSrc}
                alt={`Góc chụp sản phẩm đã tạo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded">
                Góc {index + 1}
              </div>
              <button
                  onClick={(e) => handleCopy(e, imageSrc, index)}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Sao chép URL dữ liệu hình ảnh"
              >
                  {copiedIndex === index ? (
                      <CheckIcon className="h-5 w-5 text-green-400" />
                  ) : (
                      <ClipboardIcon className="h-5 w-5" />
                  )}
              </button>
            </div>
            <a
              href={imageSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-50 text-teal-600 font-mono text-[10px] p-2 rounded-md border border-gray-300 hover:border-teal-500 truncate transition-colors"
              aria-label={`Xem URL dữ liệu hình ảnh ${index + 1} trong tab mới`}
            >
              {imageSrc}
            </a>
          </div>
        ))}
      </div>

      {modalOpen && selectedImageIndex !== null && (
        <ImageModal 
          images={images}
          initialIndex={selectedImageIndex}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ImageGrid;