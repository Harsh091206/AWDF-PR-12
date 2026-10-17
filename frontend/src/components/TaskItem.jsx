import { useState } from 'react';

function TaskItem({ task, onToggleComplete, onEdit, onDeleteRequest, busy }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const saveEdit = () => {
    if (!title.trim()) return;
    onEdit(task._id, { title, description, completed: task.completed, priority: task.priority });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditing(false);
  };

  const statusClass = task.completed ? 'completed' : 'pending';

  return (
    <div className="task-item">
      {isEditing ? (
        <div className="task-form" style={{ width: '100%' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
          <div className="actions">
            <button className="primary" disabled={busy} onClick={saveEdit}>
              Save
            </button>
            <button className="secondary" disabled={busy} onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="task-meta">
            <div>
              <strong>{task.title}</strong><br/>
              <span>{task.description || 'No description'}</span><br/>
              <span className={`status ${statusClass}`}>{task.completed ? 'completed' : 'pending'}</span>
            </div>
          </div>
          <div className="actions">
            <button className="secondary" disabled={busy} onClick={() =>
                onToggleComplete(task._id, {
                  title: task.title,
                  description: task.description,
                  completed: !task.completed,
                  priority: task.priority
                })
              }>
              Toggle
            </button>
            <button className="secondary" disabled={busy} onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button className="danger" disabled={busy} onClick={() => onDeleteRequest(task)}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskItem;
