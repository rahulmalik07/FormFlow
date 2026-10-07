from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class QuestionBase(BaseModel):
    type: str
    title: str = 'Untitled Question'
    description: Optional[str] = None
    required: bool = False
    options: Optional[List[str]] = None
    settings: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    options: Optional[List[str]] = None
    settings: Optional[Dict[str, Any]] = None
    type: Optional[str] = None

class QuestionReorder(BaseModel):
    question_ids: List[int]

class QuestionOut(QuestionBase):
    id: int
    order_index: int
    model_config = ConfigDict(from_attributes=True)

class FormBase(BaseModel):
    title: str = 'Untitled Form'
    description: Optional[str] = None

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class FormListOut(FormBase):
    id: int
    public_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    response_count: int
    model_config = ConfigDict(from_attributes=True)

class FormOut(FormListOut):
    questions: List[QuestionOut]
    model_config = ConfigDict(from_attributes=True)

class AnswerSubmit(BaseModel):
    question_id: int
    value: Optional[str] = None

class ResponseSubmit(BaseModel):
    answers: List[AnswerSubmit]

class AnswerOut(BaseModel):
    id: int
    question_id: int
    value: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ResponseOut(BaseModel):
    id: int
    form_id: int
    submitted_at: datetime
    answers: List[AnswerOut]
    model_config = ConfigDict(from_attributes=True)

class PublicFormOut(BaseModel):
    title: str
    description: Optional[str] = None
    public_id: str
    questions: List[QuestionOut]
    model_config = ConfigDict(from_attributes=True)

class QuestionStat(BaseModel):
    question_id: int
    question_title: str
    question_type: str
    total_answers: int
    answer_distribution: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)

class FormStatsOut(BaseModel):
    form_id: int
    total_responses: int
    questions: List[QuestionStat]
    model_config = ConfigDict(from_attributes=True)
