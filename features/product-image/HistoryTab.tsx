import React, { useState, useEffect } from 'react';
import TaskHistory from './components/TaskHistory';
import { Task, getUserTasks } from './services/taskService';

const USER_HASH = 'default_user';

const HistoryTab: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(getUserTasks(USER_HASH));
    }, []);

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
        </div>
    );
};

export default HistoryTab;
