import React, { useState, useMemo } from 'react';
import { Task } from '../services/taskService';
import ImageGrid from './ImageGrid';
import ImageModal from './ImageModal';

interface TaskHistoryProps {
  tasks: Task[];
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ tasks }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const allImages = useMemo(() => {
    return tasks.flatMap(task => task.outputImageUrls);
  }, [tasks]);

  const getGlobalIndex = (taskIndex: number, imageIndex: number) => {
    let count = 0;
    for (let i = 0; i < taskIndex; i++) {
      count += tasks[i].outputImageUrls.length;
    }
    return count + imageIndex;
  };

  const openModal = (taskIndex: number, imageIndex: number) => {
    const globalIndex = getGlobalIndex(taskIndex, imageIndex);
    setSelectedImageIndex(globalIndex);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImageIndex(null);
  };

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

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Các phiên làm việc gần đây</h2>
      {tasks.length === 0 ? (
         <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
            <p className="text-gray-500">Bạn chưa tạo hình ảnh nào. Các tác phẩm trước đây của bạn sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {tasks.map((task, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{task.productName}</h3>
                <p className="text-sm text-gray-500 flex-shrink-0">{formatDate(task.timestamp)}</p>
                </div>

                {(task.seoTitle || (task.seoTags && task.seoTags.length > 0)) && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {task.seoTitle && (
                            <div className="mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tiêu đề SEO</span>
                                <p className="text-sm text-gray-800 mt-1">{task.seoTitle}</p>
                            </div>
                        )}
                        
                        {task.seoTags && task.seoTags.length > 0 && (
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Tags</span>
                                <div className="flex flex-wrap gap-1">
                                    {task.seoTags.map((tag, i) => (
                                        <span key={i} className="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <ImageGrid 
                  images={task.outputImageUrls} 
                  onImageClick={(imgIndex) => openModal(index, imgIndex)}
                />
            </div>
            ))}
        </div>
      )}

      {modalOpen && selectedImageIndex !== null && (
        <ImageModal 
          images={allImages}
          initialIndex={selectedImageIndex}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TaskHistory;
