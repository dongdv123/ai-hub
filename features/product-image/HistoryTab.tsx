import React, { useState, useEffect } from 'react';
import TaskHistory from './components/TaskHistory';
import { Task, getPagedUserTasks } from './services/taskService';

const USER_HASH = 'default_user';
const PAGE_SIZE = 5;

const HistoryTab: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchTasks = (currentPage: number) => {
        setLoading(true);
        const { tasks: fetchedTasks, total } = getPagedUserTasks(USER_HASH, currentPage, PAGE_SIZE);
        
        if (currentPage === 1) {
            setTasks(fetchedTasks);
        } else {
            setTasks(prev => [...prev, ...fetchedTasks]);
        }
        
        setHasMore(currentPage * PAGE_SIZE < total);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTasks(nextPage);
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
             <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">Lịch sử tạo ảnh</h2>
                  <p className="text-gray-600 mt-2">
                    Xem lại các tác phẩm và dự án bạn đã thực hiện.
                  </p>
                </div>
              </div>
            
            <TaskHistory tasks={tasks} />

            {hasMore && (
                <div className="mt-8 text-center">
                    <button 
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
