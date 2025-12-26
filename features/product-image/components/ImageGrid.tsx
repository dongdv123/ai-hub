import React, { useState } from 'react';
import ImageModal from './ImageModal';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import DownloadIcon from './icons/DownloadIcon';

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

  const handleCopy = async (e: React.MouseEvent, imageUrl: string, index: number) => {
    e.stopPropagation(); // Prevent modal from opening
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        setCopiedIndex(index);
        setTimeout(() => {
            setCopiedIndex(null);
        }, 2000);
    } catch (error) {
        console.error("Copy failed", error);
        // Fallback to text copy if image copy fails (optional, but maybe safer not to confuse user)
        // alert("Không thể sao chép hình ảnh. Vui lòng thử lại hoặc tải xuống.");
    }
  };

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, index: number) => {
    e.stopPropagation();
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed", error);
        // Fallback for when fetch fails
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${index + 1}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
        {images.map((imageSrc, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div 
              className="relative group aspect-square bg-gray-200 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer border border-gray-200"
            >
              <div 
                  className="absolute inset-0 z-0"
                  onClick={() => openModal(index)}
              >
                 <img
                    src={imageSrc}
                    alt={`Góc chụp sản phẩm đã tạo ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                 />
              </div>

              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none z-10">
                Góc {index + 1}
              </div>
              
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                      onClick={(e) => handleCopy(e, imageSrc, index)}
                      className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                      title="Sao chép ảnh"
                  >
                      {copiedIndex === index ? (
                          <CheckIcon className="h-4 w-4 text-green-400" />
                      ) : (
                          <ClipboardIcon className="h-4 w-4" />
                      )}
                  </button>
                  <button
                      onClick={(e) => handleDownload(e, imageSrc, index)}
                      className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                      title="Tải ảnh xuống"
                  >
                      <DownloadIcon className="h-4 w-4" />
                  </button>
              </div>
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
