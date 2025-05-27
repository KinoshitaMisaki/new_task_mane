import os
from flask import Flask, render_template, request, jsonify
from .models import db, Task
from datetime import datetime, date, timedelta

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    active_tasks = Task.query.filter_by(status='active').order_by(Task.orderIndex.asc()).all()
    today = date.today()
    return render_template('index.html', tasks=active_tasks, today=today, timedelta=timedelta)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Invalid JSON data or Content-Type header'}), 400

        name = data.get('name')
        if not name:
            return jsonify({'error': 'Name is required'}), 400

        detail = data.get('detail')
        period = data.get('period')
        
        limit_date_obj = None
        limit_date_str = data.get('limitDate')
        if limit_date_str:
            try:
                limit_date_obj = datetime.strptime(limit_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format for limitDate. Use YYYY-MM-DD.'}), 400

        # isMainTask defaults to True as per model and data.get('isMainTask', True)
        # If frontend sends 'isMainTask': false, it becomes False.
        # If frontend sends 'isMainTask': true, it becomes True.
        # If frontend omits 'isMainTask', it becomes True.
        is_main_task_value = data.get('isMainTask', True) 

        new_task = Task(
            name=name,
            detail=detail,
            limitDate=limit_date_obj,
            period=period,
            isMainTask=bool(is_main_task_value) 
            # status will use model default 'active'
            # orderIndex will use model default 0
        )

        db.session.add(new_task)
        db.session.commit()

        return jsonify({
            'id': new_task.id,
            'name': new_task.name,
            'detail': new_task.detail,
            'limitDate': new_task.limitDate.isoformat() if new_task.limitDate else None,
            'period': new_task.period,
            'status': new_task.status,
            'isMainTask': new_task.isMainTask,
            'orderIndex': new_task.orderIndex,
            'createdAt': new_task.createdAt.isoformat(),
            'updatedAt': new_task.updatedAt.isoformat()
        }), 201

    except Exception as e:
        # Log the error e for debugging if necessary
        db.session.rollback() # Rollback in case of error during db operations
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
