import React, { useState } from 'react';
import { Task } from '../services/taskService';
import ImageGrid from './ImageGrid';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface CommunityHistoryProps {
  tasks: Task[];
}

const TASKS_PER_PAGE = 5;

const CommunityHistory: React.FC<CommunityHistoryProps> = ({ tasks }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTasks = [...tasks].sort((a, b) => b.timestamp - a.timestamp);
  const totalPages = Math.ceil(sortedTasks.length / TASKS_PER_PAGE);
  
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  const endIndex = startIndex + TASKS_PER_PAGE;
  const currentTasks = sortedTasks.slice(startIndex, endIndex);

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
            <div className="space-y-8">
                {currentTasks.map((task, index) => (
                <div key={`${task.timestamp}-${index}`} className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 sm:mb-0">{task.productName}</h3>
                    <p className="text-sm text-slate-500 flex-shrink-0">{formatDate(task.timestamp)}</p>
                    </div>

                    {(task.seoTitle || (task.seoTags && task.seoTags.length > 0)) && (
                        <div className="mb-4 bg-white/50 p-3 rounded-lg border border-slate-100">
                            {task.seoTitle && (
                                <div className="mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tiêu đề SEO</span>
                                    <p className="text-sm text-slate-800 mt-1">{task.seoTitle}</p>
                                </div>
                            )}
                            
                            {task.seoTags && task.seoTags.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Tags</span>
                                    <div className="flex flex-wrap gap-1">
                                        {task.seoTags.map((tag, i) => (
                                            <span key={i} className="inline-block px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <ImageGrid images={task.outputImageUrls} />
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
    </div>
  );
};

export default CommunityHistory;
