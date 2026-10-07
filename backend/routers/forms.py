from fastapi import APIRouter, HTTPException
from typing import List
import schemas
import crud

router = APIRouter(prefix="/api/forms", tags=["Forms"])

@router.post("/", response_model=schemas.FormOut)
def create_form(form: schemas.FormCreate):
    db_form = crud.create_form(form)
    return crud.form_to_out(db_form)

@router.get("/", response_model=List[schemas.FormListOut])
def get_forms():
    return crud.get_forms()

@router.get("/{form_id}", response_model=schemas.FormOut)
def get_form(form_id: int):
    form = crud.get_form(form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(form)

@router.put("/{form_id}", response_model=schemas.FormOut)
def update_form(form_id: int, form: schemas.FormUpdate):
    db_form = crud.update_form(form_id, form)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(db_form)

@router.delete("/{form_id}")
def delete_form(form_id: int):
    if not crud.delete_form(form_id):
        raise HTTPException(status_code=404, detail="Form not found")
    return {"detail": "Form deleted"}

@router.post("/{form_id}/duplicate", response_model=schemas.FormOut)
def duplicate_form(form_id: int):
    db_form = crud.duplicate_form(form_id)
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(db_form)

@router.post("/{form_id}/publish", response_model=schemas.FormOut)
def publish_form(form_id: int):
    db_form = crud.update_form(form_id, schemas.FormUpdate(status="published"))
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(db_form)

@router.post("/{form_id}/unpublish", response_model=schemas.FormOut)
def unpublish_form(form_id: int):
    db_form = crud.update_form(form_id, schemas.FormUpdate(status="draft"))
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(db_form)
