import React, { useRef, useEffect } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  previewUrls: string[];
  onFileRemove: (index: number) => void;
  maskUrls?: (string | null)[];
  onMaskClick?: (index: number) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onFilesChange, 
  previewUrls, 
  onFileRemove,
  maskUrls = [],
  onMaskClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesChange(Array.from(files));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };


  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const files = event.clipboardData?.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          onFilesChange(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFilesChange]);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesChange(Array.from(files));
    }
     // Reset the input value to allow re-selecting the same file
    event.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Ảnh gốc (Upload để chỉnh sửa)
      </label>
      
      <div
        className={`w-full ${previewUrls.length > 0 ? 'min-h-[200px]' : 'h-64'} border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-gray-50 transition-colors duration-300 p-6 bg-gray-50/30`}
        onClick={handleClick}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          multiple // Allow multiple file selection
        />
        
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {previewUrls.map((url, index) => (
              <div 
                key={index} 
                className="relative group aspect-square bg-gray-100 border border-gray-300 rounded-lg shadow-inner overflow-hidden flex items-center justify-center p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={url} 
                  alt={`Xem trước ${index + 1}`} 
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                />
                
                <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium w-fit">
                    Ảnh {index + 1}
                  </div>
                  {maskUrls[index] && (
                    <div className="bg-teal-500/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium w-fit flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Đã tạo vùng chọn
                    </div>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMaskClick?.(index);
                    }}
                    className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 tooltip"
                    title="Tạo vùng chọn (Mask)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(index);
                    }}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Xóa ảnh"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {previewUrls.length < 3 && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-500 transition-colors bg-white/50">
                <UploadIcon className="h-8 w-8 mb-2" />
                <span className="text-xs font-medium">Thêm ảnh</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <div className="bg-teal-50 p-4 rounded-full inline-block mb-4">
              <UploadIcon className="h-10 w-10 text-teal-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">Tải ảnh lên để bắt đầu</p>
            <p className="mt-1 text-sm text-gray-500">Nhấp để chọn, kéo thả hoặc dán (Ctrl+V)</p>
            <div className="mt-4 flex gap-2 justify-center">
               <span className="px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-400 font-mono">PNG</span>
               <span className="px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-400 font-mono">JPG</span>
               <span className="px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-400 font-mono">WEBP</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
