const taskEvents = require('./events');

taskEvents.on('task-created', (task) => {
  setImmediate(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!task || typeof task.title !== 'string' || !task.userId) {
        throw new Error('Task-created notification is missing required task details');
      }

      console.log(
        `[Notification] Task "${task.title}" processed at ${new Date().toISOString()} for user ${task.userId}`
      );
    } catch (error) {
      taskEvents.emit('error', error, {
        event: 'task-created',
        taskId: task && task.taskId
      });
    }
  });
});

taskEvents.on('task-deleted', (task) => {
  setImmediate(() => {
    console.log(
      `[Notification] Task "${task.title}" deleted at ${task.deletedAt} by user ${task.userId}`
    );
  });
});

taskEvents.on('error', (error, context) => {
  console.error(
    `[Event Error] ${context.event} handler failed for task ${context.taskId || 'unknown'}:`,
    error
  );
});
