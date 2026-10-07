import datetime
import uuid
from typing import List, Optional, Dict, Any
import models
import schemas

def get_response_count(form_id: int) -> int:
    return models.FormResponse.select().where(models.FormResponse.form == form_id).count()

def form_to_out(form: models.Form, include_questions: bool = True) -> dict:
    data = {
        "id": form.id,
        "public_id": form.public_id,
        "title": form.title,
        "description": form.description,
        "status": form.status,
        "created_at": form.created_at,
        "updated_at": form.updated_at,
        "response_count": get_response_count(form.id),
    }
    if include_questions:
        qs = models.Question.select().where(models.Question.form == form.id).order_by(models.Question.order_index)
        data["questions"] = [question_to_out(q) for q in qs]
    return data

def question_to_out(q: models.Question) -> dict:
    return {
        "id": q.id,
        "form_id": q.form_id,
        "type": q.type,
        "title": q.title,
        "description": q.description,
        "required": q.required,
        "order_index": q.order_index,
        "options": q.options,
        "settings": q.settings,
    }

def create_form(form_data: schemas.FormCreate) -> models.Form:
    public_id = uuid.uuid4().hex[:12]
    now = datetime.datetime.utcnow()
    form = models.Form.create(
        public_id=public_id,
        title=form_data.title or "Untitled Form",
        description=form_data.description,
        status="draft",
        created_at=now,
        updated_at=now
    )
    return form

def get_forms() -> List[dict]:
    forms = models.Form.select().order_by(models.Form.updated_at.desc())
    return [form_to_out(f, include_questions=False) for f in forms]

def get_form(form_id: int) -> Optional[models.Form]:
    try:
        return models.Form.get_by_id(form_id)
    except models.Form.DoesNotExist:
        return None

def get_form_by_public_id(public_id: str) -> Optional[models.Form]:
    try:
        return models.Form.get(models.Form.public_id == public_id)
    except models.Form.DoesNotExist:
        return None

def update_form(form_id: int, form_data: schemas.FormUpdate) -> Optional[models.Form]:
    form = get_form(form_id)
    if not form:
        return None
    data = form_data.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        form.title = data["title"]
    if "description" in data:
        form.description = data["description"]
    if "status" in data and data["status"] is not None:
        form.status = data["status"]
    form.updated_at = datetime.datetime.utcnow()
    form.save()
    return form

def delete_form(form_id: int) -> bool:
    form = get_form(form_id)
    if not form:
        return False
    form.delete_instance(recursive=True)
    return True

def duplicate_form(form_id: int) -> Optional[models.Form]:
    original = get_form(form_id)
    if not original:
        return None
    new_public_id = uuid.uuid4().hex[:12]
    now = datetime.datetime.utcnow()
    new_form = models.Form.create(
        public_id=new_public_id,
        title=f"{original.title} (Copy)",
        description=original.description,
        status="draft",
        created_at=now,
        updated_at=now
    )
    # Duplicate questions
    questions = models.Question.select().where(models.Question.form == original.id).order_by(models.Question.order_index)
    for q in questions:
        models.Question.create(
            form=new_form,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            order_index=q.order_index,
            options=q.options,
            settings=q.settings,
            created_at=now
        )
    return new_form

def create_question(form_id: int, question_data: schemas.QuestionCreate) -> Optional[models.Question]:
    form = get_form(form_id)
    if not form:
        return None
    max_order = models.Question.select(models.Question.order_index).where(models.Question.form == form_id).order_by(models.Question.order_index.desc()).first()
    next_order = (max_order.order_index + 1) if max_order else 1

    q = models.Question.create(
        form=form,
        type=question_data.type,
        title=question_data.title or "Untitled Question",
        description=question_data.description,
        required=question_data.required,
        order_index=next_order,
        options=question_data.options,
        settings=question_data.settings,
        created_at=datetime.datetime.utcnow()
    )
    form.updated_at = datetime.datetime.utcnow()
    form.save()
    return q

def update_question(question_id: int, question_data: schemas.QuestionUpdate) -> Optional[models.Question]:
    try:
        q = models.Question.get_by_id(question_id)
    except models.Question.DoesNotExist:
        return None
    data = question_data.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(q, field, val)
    q.save()
    q.form.updated_at = datetime.datetime.utcnow()
    q.form.save()
    return q

def delete_question(question_id: int) -> bool:
    try:
        q = models.Question.get_by_id(question_id)
    except models.Question.DoesNotExist:
        return False
    form_id = q.form_id
    q.delete_instance(recursive=True)

    # Reindex remaining questions
    remaining = models.Question.select().where(models.Question.form == form_id).order_by(models.Question.order_index)
    for idx, question in enumerate(remaining, start=1):
        question.order_index = idx
        question.save()
    return True

def reorder_questions(form_id: int, question_ids: List[int]) -> bool:
    qs = list(models.Question.select().where(models.Question.form == form_id))
    q_dict = {q.id: q for q in qs}
    if len(q_dict) != len(question_ids) or set(q_dict.keys()) != set(question_ids):
        return False
    for idx, q_id in enumerate(question_ids, start=1):
        q = q_dict[q_id]
        q.order_index = idx
        q.save()
    return True

def submit_response(form_id: int, response_data: schemas.ResponseSubmit) -> models.FormResponse:
    form = get_form(form_id)
    resp = models.FormResponse.create(
        form=form,
        submitted_at=datetime.datetime.utcnow()
    )
    for ans in response_data.answers:
        models.Answer.create(
            response=resp,
            question=ans.question_id,
            value=ans.value
        )
    return resp

def get_responses(form_id: int) -> List[dict]:
    responses = models.FormResponse.select().where(models.FormResponse.form == form_id).order_by(models.FormResponse.submitted_at.desc())
    out = []
    for r in responses:
        answers = models.Answer.select().where(models.Answer.response == r.id)
        out.append({
            "id": r.id,
            "form_id": form_id,
            "submitted_at": r.submitted_at,
            "answers": [{
                "id": a.id,
                "question_id": a.question_id,
                "value": a.value
            } for a in answers]
        })
    return out

def get_response(response_id: int) -> Optional[dict]:
    try:
        r = models.FormResponse.get_by_id(response_id)
        answers = models.Answer.select().where(models.Answer.response == r.id)
        return {
            "id": r.id,
            "form_id": r.form_id,
            "submitted_at": r.submitted_at,
            "answers": [{
                "id": a.id,
                "question_id": a.question_id,
                "value": a.value
            } for a in answers]
        }
    except models.FormResponse.DoesNotExist:
        return None

def get_form_stats(form_id: int) -> Optional[dict]:
    form = get_form(form_id)
    if not form:
        return None
    total_responses = get_response_count(form_id)
    questions = models.Question.select().where(models.Question.form == form_id).order_by(models.Question.order_index)
    questions_stat = []
    for q in questions:
        answers = models.Answer.select().where(models.Answer.question == q.id)
        valid_answers = [a.value for a in answers if a.value is not None and str(a.value).strip() != ""]
        total_answers = len(valid_answers)
        distribution = None
        if q.type in ['multiple_choice', 'dropdown', 'yes_no', 'rating']:
            distribution = {}
            for v in valid_answers:
                distribution[v] = distribution.get(v, 0) + 1
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
