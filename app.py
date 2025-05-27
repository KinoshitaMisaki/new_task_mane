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
    ended_tasks = Task.query.filter_by(status='ended').order_by(Task.updatedAt.desc()).all()
    today = date.today()
    return render_template('index.html', tasks=active_tasks, ended_tasks=ended_tasks, today=today, timedelta=timedelta)

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

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    try:
        if 'name' in data:
            if data['name'] is not None and data['name'].strip() == '':
                return jsonify({'error': 'Name cannot be empty'}), 400
            task.name = data['name']
        
        # For fields that can be explicitly set to null or an empty string by the user
        if 'detail' in data:
            task.detail = data['detail']
        
        if 'period' in data:
            task.period = data['period']

        if 'limitDate' in data:
            limit_date_str = data['limitDate']
            if limit_date_str:
                try:
                    task.limitDate = datetime.strptime(limit_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid date format for limitDate. Use YYYY-MM-DD.'}), 400
            else:
                task.limitDate = None 

        if 'isMainTask' in data and data['isMainTask'] is not None:
            task.isMainTask = bool(data['isMainTask'])
        
        # Ensure updatedAt is updated, though onupdate should handle it
        # task.updatedAt = datetime.utcnow() # Generally handled by SQLAlchemy's onupdate

        db.session.commit()
        return jsonify(task.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to update task', 'details': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/start', methods=['POST'])
def start_task_action(task_id): # Renamed to avoid conflict if there's another start_task
    task = Task.query.get_or_404(task_id)
    try:
        task.startDate = date.today()
        task.status = 'active' # Ensure task is marked active
        # task.updatedAt will be handled by onupdate
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to start task', 'details': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/end', methods=['POST'])
def end_task(task_id):
    task = Task.query.get_or_404(task_id)
    try:
        task.endDate = date.today()
        task.status = 'ended'
        # task.updatedAt will be handled by onupdate
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to end task', 'details': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/restore', methods=['POST'])
def restore_task(task_id):
    task = Task.query.get_or_404(task_id)
    try:
        task.status = 'active'
        task.endDate = None
        # task.updatedAt will be handled by onupdate
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to restore task', 'details': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/delete_confirm', methods=['POST'])
def delete_task_confirm(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    reason = data.get('reasonForDelete') if data else None
    
    try:
        task.status = 'deleted'
        task.reasonForDelete = reason
        # task.endDate = date.today() # Removed as per revised instruction
        # task.updatedAt will be handled by onupdate
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to delete task', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
