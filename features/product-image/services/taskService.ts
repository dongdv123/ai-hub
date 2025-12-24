export interface Task {
  userHash: string;
  timestamp: number;
  outputImageUrls: string[];
  productName: string;
}

const DB_KEY = 'ai_product_generation_tasks';

/**
 * Retrieves all tasks from localStorage.
 * @returns {Task[]} An array of tasks.
 */
export const getTasks = (): Task[] => {
  try {
    const tasksJson = localStorage.getItem(DB_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error("Failed to parse tasks from localStorage", error);
    return [];
  }
};

/**
 * Saves an array of tasks to localStorage.
 * @param {Task[]} tasks The array of tasks to save.
 */
const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage", error);
  }
};

/**
 * Adds a new task to the database.
 * @param {Task} newTask The new task to add.
 */
export const addTask = async (newTask: Task): Promise<void> => {
  const tasks = getTasks();
  tasks.push(newTask);
  saveTasks(tasks);
};

/**
 * Calculates the number of tasks a user has created today.
 * @param {string} userHash The hash of the user to check.
 * @returns {number} The number of tasks created today.
 */
export const getUserDailyUsage = async (userHash: string): Promise<number> => {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the beginning of the current day
  const startOfTodayTimestamp = today.getTime();

  const userTasksToday = tasks.filter(task => 
    task.userHash === userHash && task.timestamp >= startOfTodayTimestamp
  );

  return userTasksToday.length;
};

/**
 * Retrieves all tasks for a specific user, sorted by most recent.
 * @param {string} userHash The hash of the user.
 * @returns {Task[]} An array of the user's tasks.
 */
export const getUserTasks = (userHash: string): Task[] => {
  const allTasks = getTasks();
  return allTasks
    .filter(task => task.userHash === userHash)
    .sort((a, b) => b.timestamp - a.timestamp); // Sort descending
};
