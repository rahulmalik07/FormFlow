import datetime
import uuid
import json
from peewee import (
    Model,
    CharField,
    TextField,
    BooleanField,
    DateTimeField,
    IntegerField,
    ForeignKeyField,
)
from database import db

class JSONField(TextField):
    def db_value(self, value):
        if value is None:
            return None
        return json.dumps(value)

    def python_value(self, value):
        if value is None:
            return None
        try:
            return json.loads(value)
        except Exception:
            return value

class BaseModel(Model):
    class Meta:
        database = db

class Form(BaseModel):
    public_id = CharField(max_length=12, unique=True, index=True)
    title = CharField(max_length=500, default='Untitled Form')
    description = TextField(null=True)
    status = CharField(max_length=20, default='draft') # 'draft' | 'published'
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    class Meta:
        table_name = 'forms'

class Question(BaseModel):
    form = ForeignKeyField(Form, backref='questions', on_delete='CASCADE')
    type = CharField(max_length=50) # 'short_text', 'long_text', 'multiple_choice', etc.
    title = CharField(max_length=1000, default='Untitled Question')
    description = TextField(null=True)
    required = BooleanField(default=False)
    order_index = IntegerField()
    options = JSONField(null=True)
    settings = JSONField(null=True)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    class Meta:
        table_name = 'questions'

class FormResponse(BaseModel):
    form = ForeignKeyField(Form, backref='responses', on_delete='CASCADE')
    submitted_at = DateTimeField(default=datetime.datetime.utcnow)

    class Meta:
        table_name = 'form_responses'

class Answer(BaseModel):
    response = ForeignKeyField(FormResponse, backref='answers', on_delete='CASCADE')
    question = ForeignKeyField(Question, backref='answers', on_delete='CASCADE')
    value = TextField(null=True)

    class Meta:
        table_name = 'answers'
