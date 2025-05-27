from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    detail = db.Column(db.Text, nullable=True)
    limitDate = db.Column(db.Date, nullable=True)
    period = db.Column(db.Text, nullable=True)
    startDate = db.Column(db.Date, nullable=True)
    endDate = db.Column(db.Date, nullable=True)
    status = db.Column(db.Text, nullable=False, default='active')
    isMainTask = db.Column(db.Boolean, nullable=False, default=True)
    reasonForDelete = db.Column(db.Text, nullable=True)
    orderIndex = db.Column(db.Integer, nullable=False, default=0)
    createdAt = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Task {self.name}>'
