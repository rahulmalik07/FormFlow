from fastapi import APIRouter, HTTPException
import schemas
import crud

router = APIRouter(prefix="/api/forms/{form_id}/questions", tags=["Questions"])

@router.post("/", response_model=schemas.QuestionOut)
def create_question(form_id: int, question: schemas.QuestionCreate):
    db_q = crud.create_question(form_id, question)
    if not db_q:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.question_to_out(db_q)

@router.put("/reorder")
def reorder_questions(form_id: int, payload: schemas.QuestionReorder):
    if not crud.reorder_questions(form_id, payload.question_ids):
        raise HTTPException(status_code=400, detail="Invalid question IDs")
    return {"detail": "Questions reordered"}

@router.put("/{question_id}", response_model=schemas.QuestionOut)
def update_question(form_id: int, question_id: int, question: schemas.QuestionUpdate):
    db_q = crud.update_question(question_id, question)
    if not db_q or db_q.form_id != form_id:
        raise HTTPException(status_code=404, detail="Question not found")
    return crud.question_to_out(db_q)

@router.delete("/{question_id}")
def delete_question(form_id: int, question_id: int):
    # Check question belongs to form
    q = crud.update_question(question_id, schemas.QuestionUpdate())
    if not q or q.form_id != form_id:
        raise HTTPException(status_code=404, detail="Question not found")
    crud.delete_question(question_id)
    return {"detail": "Question deleted"}
