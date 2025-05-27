document.addEventListener('DOMContentLoaded', function() {
    const addTaskModal = document.getElementById('add-task-modal');
    const addNewTaskBtn = document.getElementById('add-new-task-btn');
    const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn'); 
    const addTaskForm = document.getElementById('add-task-form');

    // For "Task Detail/Edit" pop-up
    const detailEditTaskModal = document.getElementById('detail-edit-task-modal');
    const cancelEditTaskBtn = document.getElementById('cancel-edit-task-btn');
    const detailEditTaskForm = document.getElementById('detail-edit-task-form');
    const taskListArea = document.getElementById('task-list-area'); // For event delegation
    const startTaskBtn = document.getElementById('start-task-btn');
    const endTaskBtn = document.getElementById('end-task-btn');
    const endedTasksSection = document.getElementById('ended-tasks-section');

    // For "Delete Task" confirmation pop-up
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteConfirmBtn = document.getElementById('cancel-delete-confirm-btn');
    const taskIdToDeleteInput = document.getElementById('task-id-to-delete');
    const deleteReasonInput = document.getElementById('delete-reason');
    const deleteTaskBtn = document.getElementById('delete-task-btn'); // From detail/edit modal


    if (deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', function() {
            const taskId = document.getElementById('edit-task-id').value; // From detail/edit form
            if (taskId) {
                taskIdToDeleteInput.value = taskId;
                deleteReasonInput.value = ''; // Clear reason from previous deletions
                if (deleteConfirmModal) { // Check if modal exists
                    deleteConfirmModal.style.display = 'block';
                    deleteConfirmModal.classList.remove('hidden');
                }
                if (typeof detailEditTaskModal !== 'undefined' && detailEditTaskModal) { 
                    detailEditTaskModal.style.display = 'none'; 
                    detailEditTaskModal.classList.add('hidden');
                }
            } else {
                alert('Task ID not found.');
            }
        });
    }

    if (cancelDeleteConfirmBtn) {
        cancelDeleteConfirmBtn.addEventListener('click', function() {
            if (deleteConfirmModal) { // Check if modal exists
               deleteConfirmModal.style.display = 'none';
               deleteConfirmModal.classList.add('hidden');
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const taskId = taskIdToDeleteInput.value;
            const reason = deleteReasonInput.value;

            fetch(`/api/tasks/${taskId}/delete_confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reasonForDelete: reason })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw (err || {error: 'Failed to delete task.'}); });
                }
                return response.json();
            })
            .then(deletedTask => {
                console.log('Task deleted successfully:', deletedTask);
                if (deleteConfirmModal) {
                    deleteConfirmModal.style.display = 'none';
                    deleteConfirmModal.classList.add('hidden');
                }
                
                const index = tasksData.findIndex(t => t.id === parseInt(deletedTask.id)); // Ensure ID is integer for comparison
                if (index !== -1) {
                    tasksData[index] = deletedTask; 
                }
                
                alert('Task marked as deleted! Refreshing page.');
                location.reload(); 
            })
            .catch(error => {
                console.error('Error deleting task:', error);
                alert(`Error deleting task: ${error.error || error.message}`);
            });
        });
    }


    if (endedTasksSection) {
        endedTasksSection.addEventListener('click', function(event) {
            if (event.target.classList.contains('restore-task-btn')) {
                const taskId = event.target.dataset.taskId;
                
                if (!confirm('Are you sure you want to restore this task to active?')) {
                    return;
                }

                fetch(`/api/tasks/${taskId}/restore`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw (err || {error: 'Failed to restore task.'}); });
                    }
                    return response.json();
                })
                .then(restoredTask => {
                    console.log('Task restored successfully:', restoredTask);
                    // Update tasksData (add it back or update status)
                    const index = tasksData.findIndex(t => t.id === restoredTask.id);
                    if (index !== -1) {
                       tasksData[index] = restoredTask;
                    } else {
                       // If it was fully removed from tasksData when ended, add it back
                       // For consistency, we assume tasksData holds all tasks from initial load,
                       // and their status is the source of truth for filtering in JS if needed.
                       // However, since we're reloading, this client-side update of tasksData
                       // is more for immediate state consistency if we weren't reloading.
                       tasksData.push(restoredTask); 
                    }
                    
                    alert('Task restored! Refreshing page.');
                    location.reload();
                })
                .catch(error => {
                    console.error('Error restoring task:', error);
                    alert(`Error restoring task: ${error.error || error.message}`);
                });
            }
        });
    }

    if (endTaskBtn) {
        endTaskBtn.addEventListener('click', function() {
            const taskId = document.getElementById('edit-task-id').value;
            if (!taskId) {
                alert('No task selected or ID missing.');
                return;
            }

            // Optional: Add a confirmation dialog
            if (!confirm('Are you sure you want to mark this task as ended?')) {
                return;
            }

            fetch(`/api/tasks/${taskId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw (err || {error: 'Failed to end task.'}); });
                }
                return response.json();
            })
            .then(updatedTask => {
                console.log('Task ended successfully:', updatedTask);
                
                const index = tasksData.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) {
                    tasksData[index] = updatedTask; 
                }

                // Immediate UI update: remove the card and its Gantt bar
                const taskCard = document.querySelector(`.task-card[data-task-id="${updatedTask.id}"]`);
                if (taskCard) {
                    taskCard.remove();
                }
                const ganttRow = document.querySelector(`.gantt-task-row[data-task-id="${updatedTask.id}"]`);
                if (ganttRow) {
                    ganttRow.remove();
                }
                
                // Close the modal
                if (typeof detailEditTaskModal !== 'undefined' && detailEditTaskModal.style.display === 'block') {
                   detailEditTaskModal.style.display = 'none';
                   detailEditTaskModal.classList.add('hidden');
                }
                if (typeof detailEditTaskForm !== 'undefined') {
                   detailEditTaskForm.reset();
                }

                alert('Task marked as ended! Refreshing page to update lists.');
                location.reload(); 
            })
            .catch(error => {
                console.error('Error ending task:', error);
                alert(`Error ending task: ${error.error || error.message}`);
            });
        });
    }

    if (startTaskBtn) {
        startTaskBtn.addEventListener('click', function() {
            const taskId = document.getElementById('edit-task-id').value;
            if (!taskId) {
                alert('No task selected or ID missing.');
                return;
            }

            fetch(`/api/tasks/${taskId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw (err || {error: 'Failed to start task.'}); });
                }
                return response.json();
            })
            .then(updatedTask => {
                console.log('Task started successfully:', updatedTask);
                
                // Update tasksData array
                const index = tasksData.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) {
                    tasksData[index] = updatedTask;
                } else {
                    tasksData.push(updatedTask); // Should ideally be found
                }

                // Immediate UI update
                const taskCard = document.querySelector(`.task-card[data-task-id="${updatedTask.id}"]`);
                if (taskCard) {
                    taskCard.classList.remove('overdue', 'due-soon', 'default-color');
                    taskCard.classList.add('started');
                }
                const ganttBar = document.querySelector(`.gantt-task-row[data-task-id="${updatedTask.id}"] .gantt-task-bar`);
                if (ganttBar) {
                    ganttBar.classList.remove('overdue', 'due-soon', 'default-color');
                    ganttBar.classList.add('started');
                }
                
                // We are not closing the modal here, user might want to perform other actions or see the updated state.
                // detailEditTaskModal.style.display = 'none'; 
                // detailEditTaskForm.reset(); 

                alert('Task started! Refreshing page to ensure all dependent UI elements are updated.');
                location.reload(); 
            })
            .catch(error => {
                console.error('Error starting task:', error);
                alert(`Error starting task: ${error.error || error.message}`);
            });
        });
    }

    if (addNewTaskBtn) {
        addNewTaskBtn.addEventListener('click', function() {
            addTaskModal.classList.remove('hidden');
            addTaskModal.style.display = 'block'; 
        });
    }

    // Event listener for "Save Changes" in the "Detail/Edit" modal
    if (detailEditTaskForm) {
        detailEditTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const taskId = document.getElementById('edit-task-id').value;
            const name = document.getElementById('edit-task-name').value;
            const detail = document.getElementById('edit-task-detail').value;
            const limitDate = document.getElementById('edit-task-limit-date').value;
            const period = document.getElementById('edit-task-period').value;
            const isNotMainChecked = document.getElementById('edit-task-not-main').checked;
            const isMainTask = !isNotMainChecked;

            if (!name.trim()) {
                alert('Task name cannot be empty.');
                return;
            }

            const taskDataToUpdate = {
                name: name,
                detail: detail,
                limitDate: limitDate || null, // Send null if date field is empty
                period: period,
                isMainTask: isMainTask
            };

            fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskDataToUpdate),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { 
                        // Try to parse error from backend, default if not available
                        let errorMsg = 'Failed to update task.';
                        if (err && err.error) {
                            errorMsg = err.error;
                            if (err.details) errorMsg += ` Details: ${err.details}`;
                        }
                        throw new Error(errorMsg);
                    });
                }
                return response.json();
            })
            .then(updatedTask => {
                console.log('Task updated successfully:', updatedTask);
                detailEditTaskModal.style.display = 'none'; 
                detailEditTaskModal.classList.add('hidden'); // Ensure hidden class is re-added
                detailEditTaskForm.reset();
                
                // Update tasksData array
                const index = tasksData.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) {
                    tasksData[index] = updatedTask;
                } else {
                    tasksData.push(updatedTask); 
                }
                
                alert('Task updated successfully! Refreshing page.');
                location.reload(); 
            })
            .catch((error) => {
                console.error('Error updating task:', error);
                alert(`Error: ${error.message}`);
            });
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

    // Event listener for the "Cancel" button in the "Detail/Edit" modal
    if (cancelEditTaskBtn) {
        cancelEditTaskBtn.addEventListener('click', function() {
            detailEditTaskModal.style.display = 'none';
            detailEditTaskModal.classList.add('hidden');
            detailEditTaskForm.reset();
        });
    }

    // Adjusted window click listener to handle both modals
    window.addEventListener('click', function(event) {
        if (event.target == addTaskModal) {
            addTaskModal.style.display = 'none';
            addTaskModal.classList.add('hidden');
            addTaskForm.reset(); 
        }
        if (event.target == detailEditTaskModal) {
            detailEditTaskModal.style.display = 'none';
            detailEditTaskModal.classList.add('hidden');
            detailEditTaskForm.reset();
        }
        if (deleteConfirmModal && event.target == deleteConfirmModal) { // Add this
            deleteConfirmModal.style.display = 'none';
            deleteConfirmModal.classList.add('hidden');
        }
    });
    
    // Event delegation for clicking on task cards in the task list
    if (taskListArea) {
        taskListArea.addEventListener('click', function(event) {
            const taskCard = event.target.closest('.task-card');
            if (taskCard) {
                const taskId = parseInt(taskCard.dataset.taskId);
                // Assuming tasksData is available globally from the script tag in HTML
                const task = tasksData.find(t => t.id === taskId);

                if (task) {
                    // Populate the form
                    document.getElementById('edit-task-id').value = task.id;
                    document.getElementById('edit-task-name').value = task.name || '';
                    document.getElementById('edit-task-detail').value = task.detail || '';
                    
                    // Dates from tasksData are expected to be 'YYYY-MM-DD' strings
                    // or null/undefined. Input type="date" handles these correctly.
                    document.getElementById('edit-task-limit-date').value = task.limitDate || '';
                    
                    document.getElementById('edit-task-period').value = task.period || '';
                    
                    // "[not Main]" checkbox: checked if isMainTask is false
                    document.getElementById('edit-task-not-main').checked = !task.isMainTask; 
                    
                    detailEditTaskModal.classList.remove('hidden');
                    detailEditTaskModal.style.display = 'block';
                } else {
                    console.error('Task not found in tasksData for ID:', taskId);
                    alert('Could not find task details.');
                }
            }
        });
    }


    function getTaskDates(task) {
        // Helper to parse dates, assuming YYYY-MM-DD format from backend
        // For 'createdAt', 'updatedAt', they might have time components if not handled by tojson
        // The Task model uses .date() for limitDate, startDate, endDate, so they should be fine.
        // For this step, we only care about limitDate for coloring.
        let limitDt = null;
        if (task.limitDate) {
            // Dates from taskData via tojson might be strings already.
            // Ensure they are comparable (e.g., Date objects or consistent string format for comparison)
            // For simplicity in comparison, we'll work with date parts.
             limitDt = new Date(task.limitDate + 'T00:00:00'); // Ensure it's parsed as local date
        }
        return { limitDt };
     }

     function renderGanttChart(tasks, todayString) {
         const ganttRowsContainer = document.querySelector('#gantt-chart-area .gantt-chart-rows');
         if (!ganttRowsContainer) return;

         ganttRowsContainer.innerHTML = ''; // Clear placeholder or old content

         if (!tasks || tasks.length === 0) {
             ganttRowsContainer.innerHTML = '<p>No tasks to display in Gantt chart.</p>';
             return;
         }

         const today = new Date(todayString + 'T00:00:00'); // Parse today's date string
         const sevenDaysFromToday = new Date(today);
         sevenDaysFromToday.setDate(today.getDate() + 7);

         tasks.forEach(task => {
             const taskRow = document.createElement('div');
             taskRow.className = 'gantt-task-row';
             taskRow.setAttribute('data-task-id', task.id);

             const taskBar = document.createElement('div');
             taskBar.className = 'gantt-task-bar';
             taskBar.textContent = task.name; // Display task name on the bar

             // Apply color coding similar to task cards
             const { limitDt } = getTaskDates(task);
             let barClass = 'default-color';
             if (limitDt) {
                 if (limitDt < today) {
                     barClass = 'overdue';
                 } else if (limitDt > today && limitDt <= sevenDaysFromToday) {
                     barClass = 'due-soon';
                 }
             }
             // The 'started' orange color will be added in a later step when 'startDate' is handled for Gantt bars.
             taskBar.classList.add(barClass);


             taskRow.appendChild(taskBar);
             ganttRowsContainer.appendChild(taskRow);
         });
     }

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

    // Render Gantt Chart if data is available
    if (typeof tasksData !== 'undefined' && typeof todayData !== 'undefined') {
        renderGanttChart(tasksData, todayData);
    }
});
