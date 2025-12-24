import React, { useState } from 'react';
import { Task } from '../services/taskService';
import ImageModal from './ImageModal';

interface TaskHistoryProps {
  tasks: Task[];
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ tasks }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskImages, setSelectedTaskImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const openModal = (taskImages: string[], imageIndex: number) => {
    setSelectedTaskImages(taskImages);
    setSelectedImageIndex(imageIndex);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTaskImages([]);
    setSelectedImageIndex(null);
  };

  return (
    <div className="mt-16 animate-fade-in">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">Lịch sử tạo của bạn</h2>
      {tasks.length === 0 ? (
         <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-500">Bạn chưa tạo hình ảnh nào. Các tác phẩm trước đây của bạn sẽ xuất hiện ở đây để dễ dàng truy cập.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {tasks.map((task, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{task.productName}</h3>
                <p className="text-sm text-gray-500 flex-shrink-0">{formatDate(task.timestamp)}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {task.outputImageUrls.map((url, imgIndex) => (
                    <div
                    key={imgIndex}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105 border border-gray-200"
                    onClick={() => openModal(task.outputImageUrls, imgIndex)}
                    >
                    <img src={url} alt={`Ảnh đã tạo ${imgIndex + 1}`} className="w-full h-full object-cover" />
                    </div>
                ))}
                </div>
            </div>
            ))}
        </div>
      )}

      {modalOpen && selectedImageIndex !== null && (
         <ImageModal 
          images={selectedTaskImages}
          initialIndex={selectedImageIndex}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TaskHistory;
