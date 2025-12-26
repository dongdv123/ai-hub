import React, { useState, useMemo } from 'react';
import { Task } from '../services/taskService';
import ImageGrid from './ImageGrid';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ImageModal from './ImageModal';

interface CommunityHistoryProps {
  tasks: Task[];
}

const TASKS_PER_PAGE = 5;

const CommunityHistory: React.FC<CommunityHistoryProps> = ({ tasks }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => b.timestamp - a.timestamp), [tasks]);
  const allImages = useMemo(() => sortedTasks.flatMap(t => t.outputImageUrls), [sortedTasks]);

  const totalPages = Math.ceil(sortedTasks.length / TASKS_PER_PAGE);
  
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  const endIndex = startIndex + TASKS_PER_PAGE;
  const currentTasks = sortedTasks.slice(startIndex, endIndex);
  const USER_HASH = 'default_user';

  const getGlobalIndex = (taskIndexInPage: number, imageIndex: number) => {
    const actualTaskIndex = startIndex + taskIndexInPage;
    let count = 0;
    for (let i = 0; i < actualTaskIndex; i++) {
        count += sortedTasks[i].outputImageUrls.length;
    }
    return count + imageIndex;
  };

  const openModal = (taskIndexInPage: number, imageIndex: number) => {
      const globalIndex = getGlobalIndex(taskIndexInPage, imageIndex);
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

  const goToPage = (pageNumber: number) => {
      setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Tác phẩm từ cộng đồng</h2>
      {tasks.length === 0 ? (
         <div className="bg-gray-50 rounded-xl p-8 border border-slate-200 text-center">
            <p className="text-slate-500">Chưa có tác phẩm nào từ cộng đồng. Hãy là người đầu tiên tạo ra hình ảnh!</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentTasks.map((task, index) => (
                <div key={`${task.timestamp}-${index}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-slate-200 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 line-clamp-1">{task.productName}</h3>
                            {task.userHash === USER_HASH && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Của bạn</span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(task.timestamp)}</p>
                    </div>

                    <div className="flex-grow mb-4">
                        <ImageGrid 
                            images={task.outputImageUrls} 
                            onImageClick={(imgIdx) => openModal(index, imgIdx)}
                        />
                    </div>

                    {(task.seoTitle || (task.seoTags && task.seoTags.length > 0)) && (
                        <div className="mt-auto pt-3 border-t border-slate-100">
                            {task.seoTitle && (
                                <p className="text-xs text-slate-600 line-clamp-2 italic mb-2">"{task.seoTitle}"</p>
                            )}
                            {task.seoTags && task.seoTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {task.seoTags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] text-slate-400">#{tag}</span>
                                    ))}
                                    {task.seoTags.length > 3 && <span className="text-[10px] text-slate-400">...</span>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                ))}
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        onClick={() => goToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-full bg-white/70 border border-slate-200 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                        aria-label="Trang trước"
                    >
                        <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <span className="text-slate-600 font-medium text-sm">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => goToPage(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full bg-white/70 border border-slate-200 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                        aria-label="Trang tiếp theo"
                    >
                        <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                    </button>
                </div>
            )}
        </>
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

export default CommunityHistory;
