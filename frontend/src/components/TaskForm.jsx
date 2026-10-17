import { useState } from 'react';
import { generateAiDescription } from '../api';

function TaskForm({ onCreate, creating }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  const handleGenerateAi = async () => {
    if (!title.trim()) {
      alert('Please enter a task title first before generating a description.');
      return;
    }

    setGeneratingAi(true);
    setAiNotice('');

    try {
      const data = await generateAiDescription(title);
      if (data && data.description) {
        setDescription(data.description);
        if (data.fallback) {
          setAiNotice(data.message || '⚠️ Fallback description used (AI service unavailable).');
        } else {
          setAiNotice('✨ AI-generated suggestion. Please review and edit before saving.');
        }
      } else if (data && data.message) {
        setAiNotice(data.message);
      }
    } catch (err) {
      console.error('Failed to generate AI description:', err);
      setAiNotice('⚠️ Could not connect to AI service. Please enter description manually.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({ title, description, priority });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAiNotice('');
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} style={{ flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Task title (e.g., Deploy Docker container to server)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ flex: 2, minWidth: '220px' }}
        />

        <button
          type="button"
          onClick={handleGenerateAi}
          disabled={generatingAi || !title.trim()}
          style={{
            background: generatingAi ? '#475569' : '#8b5cf6',
            color: 'white',
            cursor: generatingAi || !title.trim() ? 'not-allowed' : 'pointer'
          }}
          title="Auto-generate description using Gemini AI"
        >
          {generatingAi ? '⏳ Generating...' : '✨ Generate with AI'}
        </button>

        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ flex: 1, minWidth: '130px' }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      <div style={{ width: '100%', marginTop: '8px' }}>
        <textarea
          placeholder="Task description (auto-generated with AI or enter manually)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ width: '100%', minHeight: '60px' }}
        />
        {aiNotice && (
          <div style={{
            fontSize: '0.85rem',
            marginTop: '6px',
            color: aiNotice.includes('⚠️') ? '#f59e0b' : '#38bdf8',
            fontWeight: 500
          }}>
            {aiNotice}
          </div>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
