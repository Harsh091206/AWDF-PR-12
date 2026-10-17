import { useEffect, useState, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api.js';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { ToastContainer } from '../components/Toast.jsx';

let toastIdCounter = 0;

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null); 
  const [toasts, setToasts] = useState([]);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const pushToast = useCallback((type, message) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadTasks = useCallback(() => {
    setLoading(true);
    setError(null);
    getTasks()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreate = async (taskInput) => {
    setCreating(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = { ...taskInput, _id: tempId, completed: false, __optimistic: true };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const savedTask = await createTask(taskInput);
      setTasks((prev) => prev.map((t) => (t._id === tempId ? savedTask : t)));
      pushToast('success', 'Task created');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      pushToast('error', `Failed to create task: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id, updates) => {
    setBusyTaskId(id);
    try {
      const updatedTask = await updateTask(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
      pushToast('success', 'Task updated');
    } catch (err) {
      pushToast('error', `Failed to update task: ${err.message}`);
    } finally {
      setBusyTaskId(null);
    }
  };

  const requestDelete = (task) => setConfirmTarget(task);
  const cancelDelete = () => setConfirmTarget(null);

  const confirmDelete = async () => {
    const task = confirmTarget;
    if (!task) return;
    setConfirmTarget(null);
    setBusyTaskId(task._id);
    try {
      await deleteTask(task._id);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      pushToast('success', 'Task deleted');
    } catch (err) {
      pushToast('error', `Failed to delete task: ${err.message}`);
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <>
      <div className="summary">
        <div className="card">
          <h3>Pending</h3>
          <div className="big">{tasks.filter(t => !t.completed && t.priority !== 'high').length}</div>
        </div>
        <div className="card">
          <h3>In Progress</h3>
          <div className="big">{tasks.filter(t => !t.completed && t.priority === 'high').length}</div>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <div className="big">{tasks.filter(t => t.completed).length}</div>
        </div>
      </div>

      <div className="panel">
        <h2>Add Task</h2>
        <TaskForm onCreate={handleCreate} creating={creating} />
      </div>

      <div className="panel">
        <h2>Tasks</h2>
        {loading && <Spinner label="Loading tasks..." />}
        {!loading && error && <ErrorMessage message={error} onRetry={loadTasks} />}
        {!loading && !error && (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleUpdate}
            onEdit={handleUpdate}
            onDeleteRequest={requestDelete}
            busyTaskId={busyTaskId}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete task?"
        message={confirmTarget ? `Are you sure you want to delete "${confirmTarget.title}"? This cannot be undone.` : ''}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
