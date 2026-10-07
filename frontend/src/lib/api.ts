import { Form, Question, FormResponse, FormStats, PublicForm, AnswerSubmit } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API Error ${res.status}: ${body}`)
  }
  // Handle 204 No Content
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Forms ──────────────────────────────────────

export async function getForms(): Promise<Form[]> {
  return fetchAPI('/forms')
}

export async function getForm(id: number): Promise<Form> {
  return fetchAPI(`/forms/${id}`)
}

export async function createForm(data?: { title?: string }): Promise<Form> {
  return fetchAPI('/forms', {
    method: 'POST',
    body: JSON.stringify(data || { title: 'Untitled Form' }),
  })
}

export async function updateForm(id: number, data: Partial<Form>): Promise<Form> {
  return fetchAPI(`/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteForm(id: number): Promise<void> {
  await fetchAPI(`/forms/${id}`, { method: 'DELETE' })
}

export async function duplicateForm(id: number): Promise<Form> {
  return fetchAPI(`/forms/${id}/duplicate`, { method: 'POST' })
}

export async function publishForm(id: number): Promise<Form> {
  return fetchAPI(`/forms/${id}/publish`, { method: 'POST' })
}

export async function unpublishForm(id: number): Promise<Form> {
  return fetchAPI(`/forms/${id}/unpublish`, { method: 'POST' })
}

// ── Questions ──────────────────────────────────

export async function createQuestion(formId: number, data: Partial<Question>): Promise<Question> {
  return fetchAPI(`/forms/${formId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateQuestion(formId: number, questionId: number, data: Partial<Question>): Promise<Question> {
  return fetchAPI(`/forms/${formId}/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteQuestion(formId: number, questionId: number): Promise<void> {
  await fetchAPI(`/forms/${formId}/questions/${questionId}`, { method: 'DELETE' })
}

export async function reorderQuestions(formId: number, questionIds: number[]): Promise<void> {
  await fetchAPI(`/forms/${formId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ question_ids: questionIds }),
  })
}

// ── Responses ──────────────────────────────────

export async function getResponses(formId: number): Promise<FormResponse[]> {
  return fetchAPI(`/forms/${formId}/responses`)
}

export async function getResponse(formId: number, responseId: number): Promise<FormResponse> {
  return fetchAPI(`/forms/${formId}/responses/${responseId}`)
}

export async function getFormStats(formId: number): Promise<FormStats> {
  return fetchAPI(`/forms/${formId}/responses/stats`)
}

// ── Public ─────────────────────────────────────

export async function getPublicForm(publicId: string): Promise<PublicForm> {
  return fetchAPI(`/public/forms/${publicId}`)
}

export async function submitPublicResponse(publicId: string, answers: AnswerSubmit[]): Promise<void> {
  await fetchAPI(`/public/forms/${publicId}/responses`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}
