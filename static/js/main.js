document.addEventListener('DOMContentLoaded', function() {
    const addTaskModal = document.getElementById('add-task-modal');
    const addNewTaskBtn = document.getElementById('add-new-task-btn');
    const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn'); 
    const addTaskForm = document.getElementById('add-task-form');

    if (addNewTaskBtn) {
        addNewTaskBtn.addEventListener('click', function() {
            addTaskModal.classList.remove('hidden');
            addTaskModal.style.display = 'block'; 
        });
    }

    if (cancelAddTaskBtn) {
        cancelAddTaskBtn.addEventListener('click', function() {
            addTaskModal.style.display = 'none'; 
            addTaskModal.classList.add('hidden');
            addTaskForm.reset(); 
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target == addTaskModal) {
            addTaskModal.style.display = 'none';
            addTaskModal.classList.add('hidden');
            addTaskForm.reset(); 
        }
    });

    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('task-name').value;
            const detail = document.getElementById('task-detail').value;
            const limitDate = document.getElementById('task-limit-date').value;
            const period = document.getElementById('task-period').value;
            const isNotMainChecked = document.getElementById('task-not-main').checked;
            const isMainTask = !isNotMainChecked;


            if (!name.trim()) {
                alert('Task name is required.');
                return;
            }

            const taskData = {
                name: name,
                detail: detail,
                limitDate: limitDate || null, 
                period: period,
                isMainTask: isMainTask 
            };

            fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                addTaskModal.style.display = 'none';
                addTaskModal.classList.add('hidden');
                addTaskForm.reset();
                alert('Task added successfully! Refreshing page.'); 
                location.reload(); 
            })
            .catch((error) => {
                console.error('Error:', error);
                let errorMessage = 'Failed to add task.';
                if (error && error.error) {
                    errorMessage += ` Server says: ${error.error}`;
                    if (error.details) {
                         errorMessage += ` Details: ${error.details}`;
                    }
                }
                alert(errorMessage);
            });
        });
    }
});
