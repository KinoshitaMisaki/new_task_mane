import pytest
from app import db as sqlalchemy_db # Direct import for model access within tests
from models import Task # Assuming models.py is at root or adjust path
import json
from datetime import date, timedelta

# Helper to create a task directly for setup if needed
def create_sample_task(name="Sample Task", limitDate=None, status='active', orderIndex=0, startDate=None):
    task = Task(name=name, limitDate=limitDate, status=status, orderIndex=orderIndex, startDate=startDate)
    sqlalchemy_db.session.add(task)
    sqlalchemy_db.session.commit()
    return task

def test_create_task_success(client, app): # Added app fixture for app_context
    response = client.post('/api/tasks', json={'name': 'New Test Task', 'limitDate': '2025-01-01', 'period': '2d'})
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'New Test Task'
    assert data['limitDate'] == '2025-01-01'
    assert data['id'] is not None
    task_id = data['id'] # Get ID for re-fetching
    with app.app_context(): # Use app_context for database operations
        task = sqlalchemy_db.session.get(Task, task_id) # Use task_id
        assert task is not None
        assert task.name == 'New Test Task'

def test_create_task_missing_name(client):
    response = client.post('/api/tasks', json={'limitDate': '2025-01-01'})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert data['error'] == 'Name is required'

def test_get_main_page_with_tasks(client, app): # Added app fixture
    with app.app_context(): # Create tasks within app_context
        create_sample_task(name="Task Alpha", orderIndex=1)
        create_sample_task(name="Task Beta", orderIndex=0)
    
    response = client.get('/')
    assert response.status_code == 200
    assert b"Task Alpha" in response.data # Check if task names are in rendered HTML
    assert b"Task Beta" in response.data
    # Check order (Beta should appear before Alpha if rendered directly by orderIndex)
    # This is tricky to check in HTML without parsing, but good enough for now.

def test_update_task_limit_date(client, app): 
    with app.app_context(): 
        task = create_sample_task(name="Task to Update")
        task_id = task.id 

    new_limit_date = (date.today() + timedelta(days=5)).isoformat()
    response = client.put(f'/api/tasks/{task_id}', json={'limitDate': new_limit_date}) 
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['limitDate'] == new_limit_date 

    with app.app_context():
        updated_task_from_db = sqlalchemy_db.session.get(Task, task_id)
        assert updated_task_from_db is not None
        assert updated_task_from_db.limitDate.isoformat() == new_limit_date

def test_start_task(client, app):
    with app.app_context():
       task = create_sample_task(name="Task to Start")
       task_id = task.id
    
    response = client.post(f'/api/tasks/{task_id}/start')
    assert response.status_code == 200
    data = response.get_json()
    assert data['startDate'] == date.today().isoformat()
    assert data['status'] == 'active'
    
    with app.app_context():
       started_task_from_db = sqlalchemy_db.session.get(Task, task_id)
       assert started_task_from_db is not None
       assert started_task_from_db.startDate == date.today()
       assert started_task_from_db.status == 'active'


def test_end_task(client, app):
   with app.app_context():
       task = create_sample_task(name="Task to End", startDate=date.today()) 
       task_id = task.id

   response = client.post(f'/api/tasks/{task_id}/end')
   assert response.status_code == 200
   data = response.get_json()
   assert data['endDate'] == date.today().isoformat()
   assert data['status'] == 'ended'
   
   with app.app_context():
       ended_task_from_db = sqlalchemy_db.session.get(Task, task_id)
       assert ended_task_from_db is not None
       assert ended_task_from_db.endDate == date.today()
       assert ended_task_from_db.status == 'ended'
       
def test_update_order(client, app):
   with app.app_context():
       task1 = create_sample_task(name="OrderTask 1", orderIndex=0)
       task1_id = task1.id
       task2 = create_sample_task(name="OrderTask 2", orderIndex=10)
       task2_id = task2.id
       task3 = create_sample_task(name="OrderTask 3", orderIndex=20)
       task3_id = task3.id

   new_order_ids = [str(task3_id), str(task1_id), str(task2_id)] 
   response = client.post('/api/tasks/update_order', json={'task_ids_in_order': new_order_ids})
   assert response.status_code == 200
   
   with app.app_context():
       t3_updated = sqlalchemy_db.session.get(Task, task3_id)
       t1_updated = sqlalchemy_db.session.get(Task, task1_id)
       t2_updated = sqlalchemy_db.session.get(Task, task2_id)
       
       assert t3_updated is not None
       assert t1_updated is not None
       assert t2_updated is not None
       
       assert t3_updated.orderIndex == 0 * 10
       assert t1_updated.orderIndex == 1 * 10
       assert t2_updated.orderIndex == 2 * 10
