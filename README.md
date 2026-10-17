# Practical 6: Full Stack Integration (React + Node + MongoDB)

[![CI Pipeline](https://github.com/actions/workflows/ci.yml/badge.svg)](https://github.com)

Task Manager app wiring a React (Vite) frontend to a Node/Express/MongoDB backend,
built on top of Practicals 1–5.

## Project structure

```
practical6/
├── backend/     Express + Mongoose API (port 5000)
└── frontend/    React + Vite app      (port 5173)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `MONGO_URI` to either:
- a local MongoDB instance: `mongodb://127.0.0.1:27017/taskmanager`
- or a MongoDB Atlas connection string

Run the server:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start
```

The API will run at `http://localhost:5000`. Verify it in the browser or Postman:
- `GET http://localhost:5000/tasks` → `[]` (empty array on first run)

## 2. Frontend setup

Open a **second terminal** (the backend must stay running in the first one):

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173`.

## 3. Test the full flow

1. Open `http://localhost:5173` in the browser.
2. Add a task — it appears instantly (optimistic update), then confirms against the server.
3. Toggle its checkbox to mark complete/incomplete.
4. Click **Edit** to change title/description, **Save** to persist via `PUT`.
5. Click **Delete** → confirm in the dialog → task is removed via `DELETE`.
6. **Refresh the browser** — all changes should still be there, proving persistence in MongoDB.
7. Stop the backend server and try creating a task — you should see a red error toast and,
   on the next page load, the error state with a **Retry** button, proving errors are handled
   on every API interaction, not just the initial GET.

## Key integration points implemented

- `backend/server.js` — `app.use(cors())` so the Vite dev server (5173) can call Express (5000).
- `frontend/src/api.js` — single source of truth for the backend base URL and all fetch calls.
- `frontend/src/App.jsx` — after every POST/PUT/DELETE, local state is updated from the
  **server's response**, never assumed; loading and error state are tracked per-operation
  (`creating`, `busyTaskId`) in addition to the initial-load state.
- Optimistic UI: new tasks appear immediately and are rolled back if the `POST` fails.
- Confirmation dialog before delete.
- Toast notifications after every create/update/delete (success or failure).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| CORS error in console | `cors` not enabled on Express | Confirm `app.use(cors())` runs before routes in `server.js` |
| "Failed to fetch" | Backend not running | Start it with `npm run dev` in `backend/` |
| Data disappears after refresh | Backend not connected to MongoDB | Check terminal for "MongoDB connected"; verify `MONGO_URI` |
| Port 5173/5000 already in use | Old process still running | Kill it, or change the port in `vite.config.js` / `.env` |

## Practical 9: In-Memory Caching

The backend uses `node-cache` to cache the authenticated `GET /tasks` response
and individual `GET /tasks/:id` responses. The TTL defaults to 60 seconds and
can be changed with `CACHE_TTL_SECONDS` in `backend/.env`. A cache miss reads
from MongoDB; later requests return the cached result. Successful task
creation, update, and deletion invalidate the list cache, and update/deletion
also invalidate that task's individual cache entry.

### Cache debug endpoint

With a valid bearer token, send `GET http://localhost:5000/tasks/debug/cache-stats`
to see the configured TTL, process-lifetime cache hits and misses, hit rate,
and current number of cached entries. Counters are shared for list and
single-task reads and reset when the backend process restarts.

### Measure response times

Use Postman or Thunder Client with the same valid bearer token for every request.
Record the response **Time** value in milliseconds. For cached samples, send one
warm-up `GET /tasks` request first, then record three more requests while the
cache is valid. For uncached samples, temporarily bypass the cache check and
cache write in `backend/routes/tasks.js`, restart the backend, record three
requests, and then restore the cache code. Do not use invented or estimated
numbers; fill in the table with your own measurements.

| Condition | Sample 1 (ms) | Sample 2 (ms) | Sample 3 (ms) | Average (ms) |
|---|---:|---:|---:|---:|
| Uncached (MongoDB on every request) | — | — | — | — |
| Cached (after warm-up) | — | — | — | — |

### Observations and analysis

- **Invalidation:** Every successful write can change the list returned by
  `GET /tasks`. Deleting the cached list after a write ensures the next read
  reflects MongoDB rather than stale data.
- **TTL:** 60 seconds is a reasonable starting point. API writes invalidate
  affected entries immediately; TTL still bounds how long an entry can remain
  if an invalidation is missed or data changes outside this process. A longer
  TTL can improve cache reuse but increases that possible stale-data window;
  a shorter TTL reduces the window but causes more database reads.
- **Deployment limitation:** `node-cache` stores data in this Node.js process.
  Multiple server instances have separate caches, so one instance's
  invalidation does not clear another instance's cached data. A shared cache
  such as Redis is needed for coordinated multi-instance deployments.

### TTL experiment

Run the same authenticated GET requests against the same task data for each TTL
value. Set `CACHE_TTL_SECONDS` in `backend/.env` to `5`, `30`, and `60` in turn,
restarting the backend after each change. For each setting, warm the cache,
record three cached response times, and use
`GET /tasks/debug/cache-stats` to verify that repeated requests produce hits.
To observe expiry, wait longer than that setting's TTL after warming the cache,
then request the same task/list again and confirm a miss. Keep API writes out of
this test because they intentionally invalidate the entries immediately.

| TTL (seconds) | Cached samples (ms) | Average (ms) | Requests after expiry | Observed freshness / notes |
|---:|---|---:|---|---|
| 5 | — / — / — | — | — | Short expiry; note observed cache misses |
| 30 | — / — / — | — | — | Medium expiry; enter your observation |
| 60 | — / — / — | — | — | Longer reuse window; enter your observation |

Do not enter expected timings as measured results. In general, shorter TTLs
expire entries sooner and require more MongoDB reads; longer TTLs allow more
reuse between expiry and can leave old data cached longer when changes bypass
the API's invalidation logic.

## Practical 10: Asynchronous Event-Driven Processing

The backend uses Node.js's built-in `EventEmitter` through
`backend/events.js`. The task-created listener is registered at startup by
`backend/listeners.js`. After a successful task save, `POST /tasks` sends the
201 response, logs its timestamp, and emits `task-created` with the task ID,
title, creation timestamp, and authenticated user ID. The listener defers work
with `setImmediate` and simulates a slow notification with a two-second timer;
its completion is logged separately and does not delay the HTTP response.

The supplementary `task-deleted` event logs a separate deletion notification.
Errors in the asynchronous task-created handler are caught and sent through a
registered `error` listener so they are logged instead of becoming unhandled
EventEmitter errors.

### Verify event processing

1. Start the backend and keep its terminal visible.
2. With a valid bearer token, create a task using `POST /tasks`.
3. Confirm Postman receives HTTP 201 promptly.
4. In the backend terminal, observe `[API] Response sent` first and the
   `[Notification]` completion log about two seconds later. Both logs include
   timestamps and the authenticated user ID.
5. Optionally delete a task and observe the distinct task-deleted notification.

`emit()` invokes listeners synchronously; it does not make their work
asynchronous automatically. This implementation keeps the listener's
time-consuming work out of the request path by scheduling it with
`setImmediate` and completing the simulated delay asynchronously. This
process-local EventEmitter is appropriate for a small lab application, but it
does not persist or distribute events across processes and is not a durable
production message queue.
