import React, { useState, useEffect, useCallback } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import DownloadIcon from './icons/DownloadIcon';

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  const goToPrevious = useCallback(() => {
    const isFirst = currentIndex === 0;
    const newIndex = isFirst ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, images.length]);

  const goToNext = useCallback(() => {
    const isLast = currentIndex === images.length - 1;
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, images.length]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const imageUrl = images[currentIndex];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (error) {
        console.error("Copy failed", error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const imageUrl = images[currentIndex];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-image-${currentIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed", error);
        const imageUrl = images[currentIndex];
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `product-image-${currentIndex + 1}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in"
      onClick={(e) => {
        // Only close if the backdrop itself is clicked, not its children (like the image)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Previous Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToPrevious();
        }}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
        aria-label="Hình ảnh trước đó"
      >
        <ChevronLeftIcon className="h-8 w-8" />
      </button>

      {/* Image Display */}
      <div className="relative p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt={`Xem phóng to ${currentIndex + 1}`}
          className="max-w-[85vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
         <div className="absolute bottom-2 right-2 text-center text-sm bg-black/50 text-white px-2 py-1 rounded-md">
            {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-3 z-50">
          <button
            onClick={handleCopy}
            className="h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white/40 transition"
            title="Sao chép ảnh"
          >
             {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={handleDownload}
            className="h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white/40 transition"
            title="Tải ảnh xuống"
          >
             <DownloadIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onClose}
            className="h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-white/40 transition"
            aria-label="Đóng"
          >
            &times;
          </button>
      </div>

      {/* Next Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
        aria-label="Hình ảnh tiếp theo"
      >
        <ChevronRightIcon className="h-8 w-8" />
      </button>
    </div>
  );
};

export default ImageModal;
