import os

base_dir = r"c:\Users\RAHUL\Documents\antigravity\quick-davinci\backend"
os.makedirs(base_dir, exist_ok=True)
os.makedirs(os.path.join(base_dir, "routers"), exist_ok=True)

def write_file(path, content):
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

write_file("requirements.txt", """
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.2
python-multipart==0.0.6
""")

write_file("database.py", """
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./formflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""")

write_file("models.py", """
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

class Form(Base):
    __tablename__ = 'forms'
    id = Column(Integer, primary_key=True, autoincrement=True)
    public_id = Column(String(12), unique=True, nullable=False, default=lambda: uuid.uuid4().hex[:12])
    title = Column(String(500), default='Untitled Form')
    description = Column(Text, nullable=True)
    status = Column(String(20), default='draft')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("FormResponse", back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = 'questions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('forms.id'), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(1000), default='Untitled Question')
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False)
    options = Column(JSON, nullable=True)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class FormResponse(Base):
    __tablename__ = 'form_responses'
    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey('forms.id'), nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = 'answers'
    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey('form_responses.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    value = Column(Text, nullable=True)
    
    response = relationship("FormResponse", back_populates="answers")
    question = relationship("Question", back_populates="answers")
""")

write_file("schemas.py", """
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
""")

write_file("crud.py", """
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
import uuid
from typing import List, Optional

def get_response_count(db: Session, form_id: int) -> int:
    return db.query(models.FormResponse).filter(models.FormResponse.form_id == form_id).count()

def create_form(db: Session, form_data: schemas.FormCreate) -> models.Form:
    db_form = models.Form(title=form_data.title, description=form_data.description)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

def get_forms(db: Session) -> List[models.Form]:
    return db.query(models.Form).order_by(models.Form.updated_at.desc()).all()

def get_form(db: Session, form_id: int) -> Optional[models.Form]:
    return db.query(models.Form).filter(models.Form.id == form_id).first()

def get_form_by_public_id(db: Session, public_id: str) -> Optional[models.Form]:
    return db.query(models.Form).filter(models.Form.public_id == public_id).first()

def update_form(db: Session, form_id: int, form_data: schemas.FormUpdate) -> Optional[models.Form]:
    db_form = get_form(db, form_id)
    if db_form:
        update_data = form_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_form, key, value)
        db.commit()
        db.refresh(db_form)
    return db_form

def delete_form(db: Session, form_id: int) -> bool:
    db_form = get_form(db, form_id)
    if db_form:
        db.delete(db_form)
        db.commit()
        return True
    return False

def duplicate_form(db: Session, form_id: int) -> Optional[models.Form]:
    original_form = get_form(db, form_id)
    if not original_form:
        return None
    new_form = models.Form(
        title=original_form.title + " (Copy)",
        description=original_form.description,
        status="draft",
        public_id=uuid.uuid4().hex[:12]
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    
    for q in original_form.questions:
        new_q = models.Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            order_index=q.order_index,
            options=q.options,
            settings=q.settings
        )
        db.add(new_q)
    db.commit()
    db.refresh(new_form)
    return new_form

def create_question(db: Session, form_id: int, question_data: schemas.QuestionCreate) -> Optional[models.Question]:
    form = get_form(db, form_id)
    if not form:
        return None
    max_order = db.query(func.max(models.Question.order_index)).filter(models.Question.form_id == form_id).scalar()
    next_order = (max_order or 0) + 1
    db_q = models.Question(
        form_id=form_id,
        order_index=next_order,
        **question_data.model_dump()
    )
    db.add(db_q)
    db.commit()
    db.refresh(db_q)
    return db_q

def update_question(db: Session, question_id: int, question_data: schemas.QuestionUpdate) -> Optional[models.Question]:
    db_q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if db_q:
        update_data = question_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_q, key, value)
        db.commit()
        db.refresh(db_q)
    return db_q

def delete_question(db: Session, question_id: int) -> bool:
    db_q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if db_q:
        form_id = db_q.form_id
        db.delete(db_q)
        db.commit()
        
        remaining = db.query(models.Question).filter(models.Question.form_id == form_id).order_by(models.Question.order_index).all()
        for idx, q in enumerate(remaining, 1):
            q.order_index = idx
        db.commit()
        return True
    return False

def reorder_questions(db: Session, form_id: int, question_ids: List[int]) -> bool:
    questions = db.query(models.Question).filter(models.Question.form_id == form_id).all()
    q_dict = {q.id: q for q in questions}
    
    if len(q_dict) != len(question_ids) or set(q_dict.keys()) != set(question_ids):
        return False
        
    for idx, q_id in enumerate(question_ids, 1):
        if q_id in q_dict:
            q_dict[q_id].order_index = idx
        
    db.commit()
    return True

def submit_response(db: Session, form_id: int, response_data: schemas.ResponseSubmit) -> models.FormResponse:
    db_resp = models.FormResponse(form_id=form_id)
    db.add(db_resp)
    db.commit()
    db.refresh(db_resp)
    
    for ans in response_data.answers:
        db_ans = models.Answer(
            response_id=db_resp.id,
            question_id=ans.question_id,
            value=ans.value
        )
        db.add(db_ans)
    db.commit()
    db.refresh(db_resp)
    return db_resp

def get_responses(db: Session, form_id: int) -> List[models.FormResponse]:
    return db.query(models.FormResponse).filter(models.FormResponse.form_id == form_id).all()

def get_response(db: Session, response_id: int) -> Optional[models.FormResponse]:
    return db.query(models.FormResponse).filter(models.FormResponse.id == response_id).first()

def get_form_stats(db: Session, form_id: int) -> dict:
    form = get_form(db, form_id)
    if not form:
        return None
        
    total_responses = get_response_count(db, form_id)
    questions_stat = []
    
    for q in form.questions:
        answers = db.query(models.Answer).filter(models.Answer.question_id == q.id).all()
        total_answers = len([a for a in answers if a.value])
        
        distribution = None
        if q.type in ['multiple_choice', 'dropdown', 'yes_no', 'rating']:
            distribution = {}
            for a in answers:
                if a.value:
                    distribution[a.value] = distribution.get(a.value, 0) + 1
                    
        questions_stat.append({
            "question_id": q.id,
            "question_title": q.title,
            "question_type": q.type,
            "total_answers": total_answers,
            "answer_distribution": distribution
        })
        
    return {
        "form_id": form_id,
        "total_responses": total_responses,
        "questions": questions_stat
    }
""")

write_file("seed.py", """
from database import SessionLocal
import models
import datetime

def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.Form).first():
            return
            
        # Form 1: Customer Feedback Survey
        f1 = models.Form(
            title="Customer Feedback Survey",
            status="published",
            public_id="feedback2024"
        )
        db.add(f1)
        db.commit()
        db.refresh(f1)
        
        q1_1 = models.Question(form_id=f1.id, type="short_text", title="What is your name?", required=True, order_index=1)
        q1_2 = models.Question(form_id=f1.id, type="email", title="What is your email address?", required=True, order_index=2)
        q1_3 = models.Question(form_id=f1.id, type="rating", title="How would you rate our service?", required=True, order_index=3, settings={"max": 5})
        q1_4 = models.Question(form_id=f1.id, type="multiple_choice", title="Which features do you use most?", order_index=4, options=['Dashboard', 'Reports', 'API', 'Mobile App', 'Integrations'])
        q1_5 = models.Question(form_id=f1.id, type="long_text", title="Any additional feedback or suggestions?", order_index=5)
        q1_6 = models.Question(form_id=f1.id, type="yes_no", title="Would you recommend us to a friend?", required=True, order_index=6)
        q1_7 = models.Question(form_id=f1.id, type="dropdown", title="How did you hear about us?", order_index=7, options=['Search Engine', 'Social Media', 'Friend/Colleague', 'Blog/Article', 'Advertisement', 'Other'])
        q1_8 = models.Question(form_id=f1.id, type="number", title="How many years have you been using our product?", order_index=8)
        
        db.add_all([q1_1, q1_2, q1_3, q1_4, q1_5, q1_6, q1_7, q1_8])
        db.commit()
        
        for i in range(5):
            resp = models.FormResponse(form_id=f1.id)
            db.add(resp)
            db.commit()
            db.add_all([
                models.Answer(response_id=resp.id, question_id=q1_1.id, value=f"User {i}"),
                models.Answer(response_id=resp.id, question_id=q1_2.id, value=f"user{i}@example.com"),
                models.Answer(response_id=resp.id, question_id=q1_3.id, value="5"),
                models.Answer(response_id=resp.id, question_id=q1_4.id, value="Dashboard"),
                models.Answer(response_id=resp.id, question_id=q1_6.id, value="Yes"),
            ])
        db.commit()
        
        # Form 2: Event Registration Form
        f2 = models.Form(
            title="Event Registration Form",
            status="published",
            public_id="eventreg2024"
        )
        db.add(f2)
        db.commit()
        db.refresh(f2)
        
        q2_1 = models.Question(form_id=f2.id, type="short_text", title="Full Name", required=True, order_index=1)
        q2_2 = models.Question(form_id=f2.id, type="email", title="Email Address", required=True, order_index=2)
        q2_3 = models.Question(form_id=f2.id, type="dropdown", title="Which session are you interested in?", required=True, order_index=3, options=['Morning Workshop', 'Afternoon Keynote', 'Evening Networking', 'All Sessions'])
        q2_4 = models.Question(form_id=f2.id, type="multiple_choice", title="Dietary requirements", order_index=4, options=['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'])
        q2_5 = models.Question(form_id=f2.id, type="yes_no", title="Do you need parking?", order_index=5)
        q2_6 = models.Question(form_id=f2.id, type="long_text", title="Any questions or special requirements?", order_index=6)
        q2_7 = models.Question(form_id=f2.id, type="number", title="Number of guests (including yourself)", required=True, order_index=7)
        
        db.add_all([q2_1, q2_2, q2_3, q2_4, q2_5, q2_6, q2_7])
        db.commit()
        
        for i in range(3):
            resp = models.FormResponse(form_id=f2.id)
            db.add(resp)
            db.commit()
            db.add_all([
                models.Answer(response_id=resp.id, question_id=q2_1.id, value=f"Attendee {i}"),
                models.Answer(response_id=resp.id, question_id=q2_2.id, value=f"attendee{i}@test.com"),
                models.Answer(response_id=resp.id, question_id=q2_3.id, value="All Sessions"),
                models.Answer(response_id=resp.id, question_id=q2_7.id, value="1"),
            ])
        db.commit()
        
        # Form 3: Product Feedback
        f3 = models.Form(
            title="Product Feedback",
            status="draft",
            public_id="productfb24"
        )
        db.add(f3)
        db.commit()
        db.refresh(f3)
        
        q3_1 = models.Question(form_id=f3.id, type="short_text", title="Your name", order_index=1)
        q3_2 = models.Question(form_id=f3.id, type="rating", title="Overall satisfaction", required=True, order_index=2, settings={"max": 5})
        q3_3 = models.Question(form_id=f3.id, type="multiple_choice", title="What did you like?", order_index=3, options=['Design', 'Performance', 'Features', 'Price', 'Support'])
        q3_4 = models.Question(form_id=f3.id, type="long_text", title="Tell us more", order_index=4)
        
        db.add_all([q3_1, q3_2, q3_3, q3_4])
        db.commit()
        
    finally:
        db.close()
""")

write_file("routers/__init__.py", "")

write_file("routers/forms.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, crud

router = APIRouter(prefix="/api/forms", tags=["Forms"])

@router.post("/", response_model=schemas.FormOut)
def create_form(form: schemas.FormCreate, db: Session = Depends(database.get_db)):
    db_form = crud.create_form(db, form)
    return schemas.FormOut(
        **db_form.__dict__,
        response_count=0,
        questions=[]
    )

@router.get("/", response_model=List[schemas.FormListOut])
def get_forms(db: Session = Depends(database.get_db)):
    forms = crud.get_forms(db)
    result = []
    for f in forms:
        rc = crud.get_response_count(db, f.id)
        result.append(schemas.FormListOut(**f.__dict__, response_count=rc))
    return result

@router.get("/{form_id}", response_model=schemas.FormOut)
def get_form(form_id: int, db: Session = Depends(database.get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    rc = crud.get_response_count(db, form_id)
    return schemas.FormOut(**form.__dict__, response_count=rc, questions=form.questions)

@router.put("/{form_id}", response_model=schemas.FormOut)
def update_form(form_id: int, form: schemas.FormUpdate, db: Session = Depends(database.get_db)):
    db_form = crud.update_form(db, form_id, form)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    rc = crud.get_response_count(db, form_id)
    return schemas.FormOut(**db_form.__dict__, response_count=rc, questions=db_form.questions)

@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(database.get_db)):
    if not crud.delete_form(db, form_id):
        raise HTTPException(status_code=404, detail="Form not found")
    return {"detail": "Form deleted"}

@router.post("/{form_id}/duplicate", response_model=schemas.FormOut)
def duplicate_form(form_id: int, db: Session = Depends(database.get_db)):
    db_form = crud.duplicate_form(db, form_id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return schemas.FormOut(**db_form.__dict__, response_count=0, questions=db_form.questions)

@router.post("/{form_id}/publish", response_model=schemas.FormOut)
def publish_form(form_id: int, db: Session = Depends(database.get_db)):
    db_form = crud.update_form(db, form_id, schemas.FormUpdate(status="published"))
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    rc = crud.get_response_count(db, form_id)
    return schemas.FormOut(**db_form.__dict__, response_count=rc, questions=db_form.questions)

@router.post("/{form_id}/unpublish", response_model=schemas.FormOut)
def unpublish_form(form_id: int, db: Session = Depends(database.get_db)):
    db_form = crud.update_form(db, form_id, schemas.FormUpdate(status="draft"))
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    rc = crud.get_response_count(db, form_id)
    return schemas.FormOut(**db_form.__dict__, response_count=rc, questions=db_form.questions)
""")

write_file("routers/questions.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, crud

router = APIRouter(prefix="/api/forms/{form_id}/questions", tags=["Questions"])

@router.post("/", response_model=schemas.QuestionOut)
def create_question(form_id: int, question: schemas.QuestionCreate, db: Session = Depends(database.get_db)):
    db_q = crud.create_question(db, form_id, question)
    if not db_q:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_q

@router.put("/reorder")
def reorder_questions(form_id: int, payload: schemas.QuestionReorder, db: Session = Depends(database.get_db)):
    if not crud.reorder_questions(db, form_id, payload.question_ids):
        raise HTTPException(status_code=400, detail="Invalid question IDs")
    return {"detail": "Questions reordered"}

@router.put("/{question_id}", response_model=schemas.QuestionOut)
def update_question(form_id: int, question_id: int, question: schemas.QuestionUpdate, db: Session = Depends(database.get_db)):
    db_q = crud.update_question(db, question_id, question)
    if not db_q or db_q.form_id != form_id:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_q

@router.delete("/{question_id}")
def delete_question(form_id: int, question_id: int, db: Session = Depends(database.get_db)):
    db_q = crud.update_question(db, question_id, schemas.QuestionUpdate()) # just to check exists and get form_id
    if not db_q or db_q.form_id != form_id:
        raise HTTPException(status_code=404, detail="Question not found")
    crud.delete_question(db, question_id)
    return {"detail": "Question deleted"}
""")

write_file("routers/responses.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import re
import database, schemas, crud, models

router = APIRouter(prefix="/api/forms/{form_id}/responses", tags=["Responses"])

@router.get("/", response_model=List[schemas.ResponseOut])
def list_responses(form_id: int, db: Session = Depends(database.get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_responses(db, form_id)

@router.get("/stats", response_model=schemas.FormStatsOut)
def get_stats(form_id: int, db: Session = Depends(database.get_db)):
    stats = crud.get_form_stats(db, form_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Form not found")
    return stats

@router.get("/{response_id}", response_model=schemas.ResponseOut)
def get_response(form_id: int, response_id: int, db: Session = Depends(database.get_db)):
    resp = crud.get_response(db, response_id)
    if not resp or resp.form_id != form_id:
        raise HTTPException(status_code=404, detail="Response not found")
    return resp

@router.post("/", response_model=schemas.ResponseOut)
def submit_response(form_id: int, response: schemas.ResponseSubmit, db: Session = Depends(database.get_db)):
    form = crud.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.status != "published":
        raise HTTPException(status_code=400, detail="Form is not published")
        
    question_dict = {q.id: q for q in form.questions}
    submitted_dict = {a.question_id: a.value for a in response.answers}
    
    for q in form.questions:
        val = submitted_dict.get(q.id)
        if q.required and (val is None or val.strip() == ""):
            raise HTTPException(status_code=400, detail=f"Question '{q.title}' is required.")
        if val:
            if q.type == "email":
                if not re.match(r"[^@]+@[^@]+\.[^@]+", val):
                    raise HTTPException(status_code=400, detail=f"Invalid email format for '{q.title}'")
            elif q.type == "number":
                try:
                    float(val)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Question '{q.title}' must be a number.")
                    
    return crud.submit_response(db, form_id, response)
""")

write_file("routers/public.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, schemas, crud

router = APIRouter(prefix="/api/public", tags=["Public"])

@router.get("/forms/{public_id}", response_model=schemas.PublicFormOut)
def get_public_form(public_id: str, db: Session = Depends(database.get_db)):
    form = crud.get_form_by_public_id(db, public_id)
    if not form or form.status != "published":
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.post("/forms/{public_id}/responses", response_model=schemas.ResponseOut)
def submit_public_response(public_id: str, response: schemas.ResponseSubmit, db: Session = Depends(database.get_db)):
    form = crud.get_form_by_public_id(db, public_id)
    if not form or form.status != "published":
        raise HTTPException(status_code=404, detail="Form not found")
    
    from routers.responses import submit_response
    return submit_response(form.id, response, db)
""")

write_file("main.py", """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import forms, questions, responses, public
import seed as seed_module

Base.metadata.create_all(bind=engine)

app = FastAPI(title='FormFlow API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(public.router)

@app.on_event('startup')
def startup():
    seed_module.seed_if_empty()

@app.get('/api/health')
def health():
    return {'status': 'ok'}
""")

print("Project files created successfully.")
