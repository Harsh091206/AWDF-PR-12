const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');
const { taskCache, cacheStats, getTaskCacheKey, ttlSeconds } = require('../cache');
const taskEvents = require('../events');

const ALL_TASKS_CACHE_KEY = 'all_tasks';

// Protect all task routes
router.use(protect);

// GET /tasks - get all tasks
router.get('/', async (req, res, next) => {
  try {
    const cachedTasks = taskCache.get(ALL_TASKS_CACHE_KEY);
    if (cachedTasks !== undefined) {
      cacheStats.hits += 1;
      return res.status(200).json(cachedTasks);
    }

    cacheStats.misses += 1;
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    taskCache.set(ALL_TASKS_CACHE_KEY, tasks);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/debug/cache-stats - inspect process-local cache usage
router.get('/debug/cache-stats', (req, res) => {
  const total = cacheStats.hits + cacheStats.misses;
  res.status(200).json({
    ttlSeconds,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    hitRate: total === 0 ? 0 : Number((cacheStats.hits / total).toFixed(4)),
    cachedEntries: taskCache.keys().length
  });
});

// GET /tasks/:id - get a single task
router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = getTaskCacheKey(req.params.id);
    const cachedTask = taskCache.get(cacheKey);
    if (cachedTask !== undefined) {
      cacheStats.hits += 1;
      return res.status(200).json(cachedTask);
    }

    cacheStats.misses += 1;
    const task = await Task.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    taskCache.set(cacheKey, task);
    res.status(200).json(task);
  } catch (err) {
    // Malformed ObjectId also lands here -> treat as "not found" for the client
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(err);
  }
});

// POST /tasks - create a task
router.post('/', validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // We no longer manually validate title here as validateTask handles it.
    const task = await Task.create({ title, description, completed, priority });
    taskCache.del(ALL_TASKS_CACHE_KEY);
    res.status(201).json(task);
    const createdAt = new Date().toISOString();
    console.log(`[API] Response sent at ${createdAt}`);
    taskEvents.emit('task-created', {
      taskId: task._id.toString(),
      title: task.title,
      createdAt,
      userId: req.user.id
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// PUT /tasks/:id - update a task
router.put('/:id', validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, completed, priority },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    taskCache.del([ALL_TASKS_CACHE_KEY, getTaskCacheKey(req.params.id)]);
    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(err);
  }
});

// DELETE /tasks/:id - delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    taskCache.del([ALL_TASKS_CACHE_KEY, getTaskCacheKey(req.params.id)]);
    res.status(200).json({ message: 'Task deleted', id: req.params.id });
    taskEvents.emit('task-deleted', {
      taskId: task._id.toString(),
      title: task.title,
      deletedAt: new Date().toISOString(),
      userId: req.user.id
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(err);
  }
});

module.exports = router;
