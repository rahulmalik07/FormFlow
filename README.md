# FormFlow — Conversational Form Builder (Typeform Clone)

FormFlow is a full-stack, Typeform-inspired conversational form builder and response platform designed with high aesthetic standards, fluid keyboard-first interactions, and full CRUD capabilities.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, `@dnd-kit` (drag & drop), Lucide React, React Hot Toast.
- **Backend**: Python 3.14+, FastAPI, Peewee ORM (configured specifically for robust Windows & cross-platform portability without Cython/C-extension DLL constraints), SQLite database.
- **API Communication**: REST API with real-time submission, validation, analytics calculation, and deterministic seed endpoints.

---

## 🚀 Key Features

### 1. Form Builder (`/forms/[id]`)
- **Visual question list** with drag-and-drop reordering via `@dnd-kit`.
- **All 8 Question Types**:
  1. *Short text*
  2. *Long text*
  3. *Multiple choice* (custom options list)
  4. *Dropdown* (custom options list)
  5. *Email* (format validation)
  6. *Number* (numeric verification)
  7. *Yes/No* (one-click binary choice)
  8. *Rating* (interactive 5-star scale)
- **Inline Title Editing**: Real-time auto-saving on blur.
- **Live Preview & Publish Toggle**: Switch between `draft` and `published` states.
- **One-click Shareable Link**: Direct copy to clipboard.

### 2. Public Respondent Experience (`/respond/[publicId]`)
- **Full-Screen, One-Question-at-a-Time**: Minimalist layout focusing entirely on the respondent.
- **Smooth Animations**: Animated transitions via Framer Motion.
- **Dynamic Progress Bar**: Real-time completion progress tracking at the top edge.
- **Keyboard Navigation**: Advance using `Enter ↵`, quick choice shortcuts (`Y`/`N`), and up/down arrows.
- **Field-Specific Validation**: Instant feedback for required answers, valid emails, and valid numbers.
- **Thank-You Screen**: Friendly confirmation with prompt to create their own form.

### 3. Dashboard (`/`)
- Grid view of all created and seeded forms.
- Badges for status (`published` vs `draft`) and response counts.
- Form management actions: Create, Edit, Duplicate, and Delete.

### 4. Results & Analytics (`/forms/[id]/results`)
- **Dual View**:
  - **Responses Tab**: Expandable table of individual response timestamps and question-by-question breakdown.
  - **Statistics Tab**: Visual percentage bars and answer distributions for multiple choice, ratings, dropdowns, and yes/no questions.

---

## 🏃 Running the Application Locally

### 1. Backend (FastAPI)
```bash
cd backend
python -m pip install fastapi "uvicorn[standard]" peewee pydantic python-multipart
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 2. Frontend (Next.js)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Access the application at `http://localhost:3000`

---

## 🧪 Pre-Seeded Forms
FormFlow automatically seeds realistic demo data on initialization:
1. **Customer Feedback Survey** (8 questions, pre-populated with responses):
   - Public URL: `http://localhost:3000/respond/feedback2024`
2. **Tech Summit 2026 Registration** (7 questions, pre-populated responses):
   - Public URL: `http://localhost:3000/respond/eventreg2024`
3. **Q3 Product Feedback & Feature Requests** (Draft mode)
