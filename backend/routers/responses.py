from fastapi import APIRouter, HTTPException
from typing import List
import re
import schemas
import crud

router = APIRouter(prefix="/api/forms/{form_id}/responses", tags=["Responses"])

@router.get("/", response_model=List[schemas.ResponseOut])
def list_responses(form_id: int):
    form = crud.get_form(form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_responses(form_id)

@router.get("/stats", response_model=schemas.FormStatsOut)
def get_stats(form_id: int):
    stats = crud.get_form_stats(form_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Form not found")
    return stats

@router.get("/{response_id}", response_model=schemas.ResponseOut)
def get_response(form_id: int, response_id: int):
    resp = crud.get_response(response_id)
    if not resp or resp["form_id"] != form_id:
        raise HTTPException(status_code=404, detail="Response not found")
    return resp

@router.post("/", response_model=schemas.ResponseOut)
def submit_response(form_id: int, response: schemas.ResponseSubmit):
    form = crud.get_form(form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.status != "published":
        raise HTTPException(status_code=400, detail="Form is not published")

    submitted_dict = {a.question_id: a.value for a in response.answers}

    for q in form.questions:
        val = submitted_dict.get(q.id)
        if q.required and (val is None or str(val).strip() == ""):
            raise HTTPException(status_code=400, detail=f"Question '{q.title}' is required.")
        if val is not None and str(val).strip() != "":
            val_str = str(val).strip()
            if q.type == "email":
                if not re.match(r"[^@]+@[^@]+\.[^@]+", val_str):
                    raise HTTPException(status_code=400, detail=f"Invalid email format for '{q.title}'")
            elif q.type == "number":
                try:
                    float(val_str)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Question '{q.title}' must be a number.")

    db_resp = crud.submit_response(form_id, response)
    return crud.get_response(db_resp.id)
