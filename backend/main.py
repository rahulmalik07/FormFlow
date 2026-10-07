from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
import models
from routers import forms, questions, responses, public
import seed as seed_module

db.connect(reuse_if_open=True)
db.create_tables([models.Form, models.Question, models.FormResponse, models.Answer], safe=True)
db.close()

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
