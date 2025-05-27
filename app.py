import os
import json # Added for Gantt data serialization
from flask import Flask, render_template, request, jsonify, redirect, url_for
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
    # Fetch active tasks, ordered by orderIndex, then createdAt
    active_tasks = Task.query.filter_by(status='active').order_by(Task.orderIndex.asc(), Task.createdAt.desc()).all()
    
    # Keep fetching ended and deleted tasks as the existing template structure might use them.
    # The subtask asks for placeholders for these sections in HTML, implying they might be populated.
    # If these are also expected as raw objects by a part of template not touched by this subtask,
    # then .all() should be used instead of to_dict(). For now, let's assume dicts are fine for these.
    ended_tasks_query = Task.query.filter_by(status='ended').order_by(Task.updatedAt.desc()).all()
    ended_tasks_dicts = [task.to_dict() for task in ended_tasks_query]

    deleted_tasks_query = Task.query.filter_by(status='deleted').order_by(Task.updatedAt.desc()).all()
    deleted_tasks_dicts = [task.to_dict() for task in deleted_tasks_query]
    
    today_date = date.today() # Subtask uses 'today_date', existing uses 'today'. Let's use 'today' for consistency with other parts of template.
    
    # The subtask example for task cards implies 'tasks' should be a list of Task objects,
    # not dictionaries, to allow for task.limitDate.strftime('%Y-%m-%d').
    # The existing 'current_sort_by' is not used in the simplified task list for this subtask.
    # We can pass it if other parts of the template rely on it.
    current_sort_by = request.args.get('sort_by', 'createdAt_desc') # Default to new sort for active tasks

    # Prepare data for Gantt chart (needs to be JSON serializable with all fields)
    active_tasks_dicts_for_gantt = [task.to_dict() for task in active_tasks]
    tasks_for_gantt_json = json.dumps(active_tasks_dicts_for_gantt)


    return render_template('index.html', 
                           tasks=active_tasks,  # Pass list of Task objects for task list
                           tasks_for_gantt_json=tasks_for_gantt_json, # Pass JSON string for Gantt JS
                           ended_tasks=ended_tasks_dicts, # Keep as dicts for now
                           deleted_tasks=deleted_tasks_dicts, # Keep as dicts for now
                           today=today_date, # Pass today's date as 'today'
                           timedelta=timedelta, # Keep for other parts of template
                           current_sort_by=current_sort_by) # Keep for other parts of template

@app.route('/add_task', methods=['POST'])
def add_task():
    name = request.form.get('name')
    detail = request.form.get('detail')
    limit_date_str = request.form.get('limitDate')

    limit_date_obj = None
    if limit_date_str:
        try:
            limit_date_obj = datetime.strptime(limit_date_str, '%Y-%m-%d').date()
        except ValueError:
            # Handle error or pass as None if date is invalid
            # For now, we'll let it be None if parsing fails
            pass

    # if 'notMain' is in form, it means checkbox was checked.
    # isMainTask should be True if 'notMain' is NOT checked.
    is_main_task = 'notMain' not in request.form

    if not name:
        # Optional: Add flash message for error
        return redirect(url_for('index')) # Or render a page with an error

    new_task = Task(
        name=name,
        detail=detail,
        limitDate=limit_date_obj,
        isMainTask=is_main_task,
        status='active', # Default status
        orderIndex=0 # Default orderIndex
    )
    db.session.add(new_task)
    db.session.commit()
    return redirect(url_for('index'))

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
                task.updatedAt = datetime.utcnow() # Ensure updatedAt is updated
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

# Routes for Task Detail/Edit Popup
@app.route('/get_task_details/<int:task_id>')
def get_task_details_route(task_id): # Renamed to avoid conflict with any future model methods
    task = Task.query.get(task_id)
    if task:
        return jsonify({
            'id': task.id,
            'name': task.name,
            'detail': task.detail,
            'limitDate': task.limitDate.isoformat() if task.limitDate else None,
            'isMainTask': task.isMainTask,
            'startDate': task.startDate.isoformat() if task.startDate else None,
            'endDate': task.endDate.isoformat() if task.endDate else None,
            'status': task.status,
            'period': task.period # Added period as it's often relevant
        })
    return jsonify({'error': 'Task not found'}), 404

@app.route('/update_task/<int:task_id>', methods=['POST'])
def update_task_details_route(task_id): # Renamed to avoid conflict
    task = Task.query.get_or_404(task_id)
    
    name = request.form.get('name')
    if not name or name.strip() == '':
        return jsonify({'status': 'error', 'message': 'Name cannot be empty'}), 400
    task.name = name
    
    task.detail = request.form.get('detail')
    
    limit_date_str = request.form.get('limitDate')
    if limit_date_str:
        try:
            task.limitDate = datetime.strptime(limit_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Invalid date format for limitDate. Use YYYY-MM-DD.'}), 400
    else:
        task.limitDate = None
        
    task.isMainTask = 'notMain' not in request.form # True if 'notMain' is NOT checked
    
    # Period is not in the detail_edit_popup.html form, but if it were, it would be:
    # task.period = request.form.get('period')

    task.updatedAt = datetime.utcnow() # Explicitly set, though onupdate should also trigger
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Task updated successfully', 'task': task.to_dict()})

@app.route('/task/<int:task_id>/start', methods=['POST'])
def start_task_route(task_id): # Renamed
    task = Task.query.get_or_404(task_id)
    if task.status == 'ended':
        return jsonify({'status': 'error', 'message': 'Task has already ended. Restore it first to start again.'}), 400
    
    task.startDate = date.today()
    task.endDate = None # Clear end date if task is restarted
    task.status = 'active' # Ensure status is active
    task.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Task started', 'task': task.to_dict()})

@app.route('/task/<int:task_id>/end', methods=['POST'])
def end_task_route(task_id): # Renamed
    task = Task.query.get_or_404(task_id)
    if not task.startDate: # Optional: Prevent ending a task that hasn't started
        return jsonify({'status': 'error', 'message': 'Task has not been started yet.'}), 400

    task.endDate = date.today()
    task.status = 'ended'
    task.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Task ended', 'task': task.to_dict()})

@app.route('/task/<int:task_id>/delete_confirm', methods=['POST'])
def confirm_delete_task_route(task_id): # Renamed
    task = Task.query.get_or_404(task_id)
    data = request.get_json() # Assuming JSON is sent
    reason = data.get('reasonForDelete', '') # Get reason, default to empty string

    task.status = 'deleted'
    task.reasonForDelete = reason
    task.endDate = date.today() # Set endDate when deleting as per subtask snippet
    task.updatedAt = datetime.utcnow() # Explicitly set
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Task marked as deleted'})

@app.route('/task/<int:task_id>/restore', methods=['POST'])
def restore_task_route(task_id): # Renamed to avoid conflict with existing /api/tasks/.../restore
    task = Task.query.get_or_404(task_id)
    
    original_status = task.status # For potential specific logic if needed, e.g. logging
    
    task.status = 'active'
    task.endDate = None 
    task.reasonForDelete = None 
    # task.startDate = None # Decided to keep startDate as per subtask note (optional to clear)
    task.updatedAt = datetime.utcnow() # Consistent with other new routes
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Task restored to active from {original_status}'})

if __name__ == '__main__':
    app.run(debug=True)
