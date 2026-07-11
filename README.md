# TMA_project-frontend

Next.js (App Router) + TypeScript frontend for a unified Task Management (Kanban) and Image Annotation workspace.

**Live App:** `https://tma-project-frontend-ten.vercel.app/tasks`
**Backend API:** `https://tma-project-backend.onrender.com/admin/`
**Backend Repo:** `https://github.com/rad129ratul/TMA_project-backend`

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `ratul@gmail.com` |
| Password | `test1234#@` |

---

## Tech Stack & Architecture

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, mixed server/client components |
| Language | TypeScript | Compile-time safety across Task/Annotation data shapes |
| Styling | Tailwind CSS v4 (`@theme` design tokens) | Consistent, token-based design system |
| Global state | Zustand | Lightweight shared state for `selectedDate`, no Provider boilerplate |
| Drag & drop | dnd-kit | Actively maintained, hook-based, replaces deprecated react-beautiful-dnd |
| Canvas drawing | react-konva + use-image | Declarative polygon drawing on top of HTML5 Canvas |
| Date picker | react-day-picker + date-fns | Consistent cross-browser calendar UI |
| Auth | JWT stored in `localStorage`, silent refresh on 401 | Matches backend's simplejwt flow |

### Prerequisites

- Node.js **20.x LTS or higher** (`node --version`)
- npm (or yarn/pnpm — this project uses npm)

### Local Setup — Step by Step

```bash
# 1. Clone the repo
git clone <frontend-repo-url>
cd TMA_project-frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# then set:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# 4. Start the dev server
npm run dev
```

Frontend will be running at `http://localhost:3000`.

### Production Environment Variable

Set in the Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com
```

> **Note:** `NEXT_PUBLIC_` variables are baked into the JavaScript bundle at
> **build time** — changing this value in the dashboard requires a manual redeploy to
> take effect.

---

## Application Structure

### Routes
/login                    — public, email + password login
/tasks                    — protected, Kanban board (date-scoped)
/annotate/[taskId]        — protected, dynamic route, per-task annotation workspace

### Component Tree — Task Module
Board (smart container — owns tasks state, fetches by selectedDate)
├── DateSelector (fully independent — reads/writes Zustand store only)
├── Column × 3 (To Do / In Progress / Done — droppable via dnd-kit)
│     └── TaskCard × N (draggable, presentational, navigates to /annotate/[taskId])
├── TaskModal (shared Add/Edit form)
└── Delete confirmation dialog

### Component Tree — Annotation Module
AnnotateTaskPage ([taskId] dynamic route)
├── ImageUploadZone (multi-file, drag-and-drop upload)
├── ImageSlider (thumbnail sidebar, per-task scoped)
└── AnnotationCanvas
├── Konva Stage/Layer (polygon drawing + rendering)
├── Label Input Modal (create/edit label, dark-blurred overlay)
└── Floating action menu (HTML overlay, positioned via shared coordinate math)

### State Management

- **Zustand (`useDateStore`)** — the single piece of truly global state (`selectedDate`),
  shared between `DateSelector` and `Board` without prop-drilling or a Context Provider.
- **Local component state** — everything else (`tasks`, `images`, `annotations`, modal
  visibility) is owned by the nearest common container (`Board`, `AnnotateTaskPage`)
  and passed down as props — a deliberate "lift state up" choice over introducing more
  global stores than the app actually needs.

---

## Difficulties Faced & Solutions

### 1. Canvas Coordinate Normalization (the hardest bug in the project)

**The problem:** When a user draws a polygon on the annotation canvas, Konva's
`stage.getPointerPosition()` returns a **pixel coordinate** relative to the canvas's
current on-screen size (e.g. `x: 340, y: 210` on an 800px-wide canvas). If those raw
pixel values are saved directly to the database, the polygon breaks the moment it's
rendered at a different size — a resized browser window, a different device, even a
sidebar toggling open. The saved `x: 340` has no meaning once the canvas is no longer
exactly 800px wide; the polygon drifts off the image or lands in the wrong spot
entirely.

**The solution — normalize to a 0.0–1.0 fraction, not a pixel:**

```typescript
function toNormalized(point: Point, width: number, height: number): Point {
  return { x: point.x / width, y: point.y / height };
}

function toPixels(point: Point, width: number, height: number): Point {
  return { x: point.x * width, y: point.y * height };
}
```

The flow works in four steps:
1. **Draw:** Konva returns pixel coordinates relative to the *current* canvas size
   (tracked live via `ResizeObserver`).
2. **Save:** the moment a polygon closes, every point is converted to a fraction of
   the current `displayWidth`/`displayHeight` — this value is always between `0.0` and
   `1.0`, regardless of screen size. Only this normalized form is sent to the backend,
   matching the `0.0–1.0` range validation already enforced server-side.
3. **Load:** when annotations are fetched back from the API, the inverse conversion
   (`normalized × currentDisplayWidth`) is applied using **whatever the display width
   happens to be right now** — not the width at draw time.
4. **Result:** the same stored annotation renders correctly on any screen size, because
   the frontend only ever needs to know the *current* display dimensions at render
   time — nothing about the original drawing session is required.

This is a general pattern for any "resolution-independent spatial data" problem
(PDF annotation, video subtitle positioning, responsive image hotspots): never store
an absolute pixel value if that data will be re-rendered in a different context —
store a resolution-independent ratio instead.

### 2. Optimistic UI for Drag-and-Drop

**The problem:** Waiting for the backend `PATCH` response before updating the Kanban
board's UI made every drag feel laggy — the card would sit in its old column for the
duration of the network round-trip, then suddenly "jump" to the new column once the
response arrived.

**The solution — optimistic update with rollback:**

```typescript
async function handleDragEnd(event: DragEndEvent) {
  // ...identify draggedTask and newStatus...

  const previousTasks = tasks;                 // 1. backup current state

  setTasks((prev) =>                            // 2. update UI immediately
    prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
  );

  try {
    const res = await apiFetch(`/api/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error();             // 3. sync with backend
  } catch {
    setTasks(previousTasks);                     // 4. rollback on failure
    setError("Task could not be moved.");
  }
}
```

The UI assumes the backend request will succeed (the common case) and updates
instantly, giving the drag a responsive, native-app feel. If the `PATCH` fails, the
board automatically reverts to the last known-good state and surfaces an error — so
the UI can never permanently desync from the database. This was verified by simulating
an offline network mid-drag and confirming the card snapped back to its original
column.

---

## Design System

The app follows a token-based design system defined in `src/app/globals.css` via
Tailwind v4's CSS-first `@theme` directive — a `primary` (Indigo) palette for brand
actions, `success`/`danger`/`warning` semantic colors for status and priority, and a
custom `shadow-soft-*` scale for card elevation. All components consume these tokens
by class name (`bg-primary-600`, `shadow-soft-md`) rather than raw hex values, so the
entire app's visual language can be updated from a single file.