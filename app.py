import os
from flask import Flask, render_template, request, jsonify
from models import db, Task # db is SQLAlchemy instance
from datetime import datetime, date, timedelta
from sqlalchemy import nullslast, nullsfirst # Explicitly import for clarity

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    current_sort_by = request.args.get('sort_by', 'orderIndex')
    order_criteria = []

    if current_sort_by == 'limitDate_asc':
        order_criteria = [Task.limitDate.asc().nullslast(), Task.orderIndex.asc()]
    elif current_sort_by == 'limitDate_desc':
        order_criteria = [Task.limitDate.desc().nullslast(), Task.orderIndex.asc()]
    else: # Default to 'orderIndex' or any other case
        current_sort_by = 'orderIndex' # Ensure it's set for the template
        order_criteria = [Task.orderIndex.asc()]

    active_tasks_query = Task.query.filter_by(status='active').order_by(*order_criteria).all()
    active_tasks_dicts = [task.to_dict() for task in active_tasks_query]
    
    ended_tasks_query = Task.query.filter_by(status='ended').order_by(Task.updatedAt.desc()).all()
    ended_tasks_dicts = [task.to_dict() for task in ended_tasks_query]

    deleted_tasks_query = Task.query.filter_by(status='deleted').order_by(Task.updatedAt.desc()).all()
    deleted_tasks_dicts = [task.to_dict() for task in deleted_tasks_query]
    
    today = date.today()
    
    return render_template('index.html', 
                           tasks=active_tasks_dicts, 
                           ended_tasks=ended_tasks_dicts, 
                           deleted_tasks=deleted_tasks_dicts, 
                           today=today, 
                           timedelta=timedelta,
                           current_sort_by=current_sort_by)

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

@app.route('/api/tasks/<int:task_id>/restore_deleted', methods=['POST'])
def restore_deleted_task(task_id):
    task = Task.query.get_or_404(task_id)
    try:
        task.status = 'active'
        task.reasonForDelete = None
        # task.updatedAt will be handled by onupdate
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e for debugging if necessary
        return jsonify({'error': 'Failed to restore deleted task', 'details': str(e)}), 500

@app.route('/api/tasks/update_order', methods=['POST'])
def update_task_order_route(): # Renamed to avoid conflict with any model methods
    data = request.get_json()
    if not data or 'task_ids_in_order' not in data:
        return jsonify({'error': 'Missing task_ids_in_order'}), 400

    task_ids_in_order = data['task_ids_in_order']
    if not isinstance(task_ids_in_order, list):
        return jsonify({'error': 'task_ids_in_order must be a list'}), 400

    try:
        for index, task_id_str in enumerate(task_ids_in_order):
            task_id = int(task_id_str)
            task = Task.query.get(task_id)
            if task:
                task.orderIndex = index * 10 # Assign order, leaving gaps
            else:
                # Handle case where a task ID might be invalid (e.g., already deleted by another user)
                # Options: skip, or return an error. For now, skip.
                print(f"Task with ID {task_id} not found during reorder.") 
        db.session.commit()
        return jsonify({'message': 'Task order updated successfully'}), 200
    except ValueError:
        db.session.rollback()
        return jsonify({'error': 'Invalid task ID format.'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error updating task order: {e}") # Log the error server-side
        return jsonify({'error': 'Failed to update task order.', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
