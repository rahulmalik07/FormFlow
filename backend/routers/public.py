from fastapi import APIRouter, HTTPException
import schemas
import crud
from routers.responses import submit_response

router = APIRouter(prefix="/api/public", tags=["Public"])

@router.get("/forms/{public_id}", response_model=schemas.PublicFormOut)
def get_public_form(public_id: str):
    form = crud.get_form_by_public_id(public_id)
    if not form or form.status != "published":
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.form_to_out(form)

@router.post("/forms/{public_id}/responses", response_model=schemas.ResponseOut)
def submit_public_response(public_id: str, response: schemas.ResponseSubmit):
    form = crud.get_form_by_public_id(public_id)
    if not form or form.status != "published":
        raise HTTPException(status_code=404, detail="Form not found")

    return submit_response(form.id, response)
