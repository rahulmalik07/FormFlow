export interface Form {
  id: number
  public_id: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  questions: Question[]
  response_count: number
}

export interface Question {
  id: number
  form_id: number
  type: QuestionType
  title: string
  description: string | null
  required: boolean
  order_index: number
  options: string[] | null
  settings: Record<string, any> | null
}

export type QuestionType = 'short_text' | 'long_text' | 'multiple_choice' | 'dropdown' | 'email' | 'number' | 'yes_no' | 'rating'

export interface FormResponse {
  id: number
  form_id: number
  submitted_at: string
  answers: Answer[]
}

export interface Answer {
  id: number
  question_id: number
  value: string | null
}

export interface AnswerSubmit {
  question_id: number
  value: string | null
}

export interface QuestionStat {
  question_id: number
  question_title: string
  question_type: string
  total_answers: number
  answer_distribution: Record<string, number> | null
}

export interface FormStats {
  form_id: number
  total_responses: number
  questions: QuestionStat[]
}

export interface PublicForm {
  id: number
  public_id: string
  title: string
  description: string | null
  questions: Question[]
}
