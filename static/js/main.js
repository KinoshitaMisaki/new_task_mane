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
    const deletedTasksSection = document.getElementById('deleted-tasks-section'); 

    // For "Delete Task" confirmation pop-up
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteConfirmBtn = document.getElementById('cancel-delete-confirm-btn');
    const taskIdToDeleteInput = document.getElementById('task-id-to-delete');
    const deleteReasonInput = document.getElementById('delete-reason');
    const deleteTaskBtn = document.getElementById('delete-task-btn'); 


    if (deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', function() {
            const taskId = document.getElementById('edit-task-id').value; 
            if (taskId) {
                taskIdToDeleteInput.value = taskId;
                deleteReasonInput.value = ''; 
                if (deleteConfirmModal) { 
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
            if (deleteConfirmModal) { 
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
                
                const index = tasksData.findIndex(t => t.id === parseInt(deletedTask.id)); 
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


    if (deletedTasksSection) {
        deletedTasksSection.addEventListener('click', function(event) {
            if (event.target.classList.contains('restore-deleted-task-btn')) {
                const taskId = event.target.dataset.taskId;
                
                if (!confirm('Are you sure you want to restore this task from deleted items?')) {
                    return;
                }

                fetch(`/api/tasks/${taskId}/restore_deleted`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw (err || {error: 'Failed to restore deleted task.'}); });
                    }
                    return response.json();
                })
                .then(restoredTask => {
                    console.log('Deleted task restored successfully:', restoredTask);
                    const index = tasksData.findIndex(t => t.id === restoredTask.id);
                    if (index !== -1) {
                       tasksData[index] = restoredTask;
                    } else {
                       tasksData.push(restoredTask);
                    }

                    alert('Task restored from deleted items! Refreshing page.');
                    location.reload();
                })
                .catch(error => {
                    console.error('Error restoring deleted task:', error);
                    alert(`Error restoring task: ${error.error || error.message}`);
                });
            }
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
                    const index = tasksData.findIndex(t => t.id === restoredTask.id);
                    if (index !== -1) {
                       tasksData[index] = restoredTask;
                    } else {
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
            if (!confirm('Are you sure you want to mark this task as ended?')) {
                return;
            }
            fetch(`/api/tasks/${taskId}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', }
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
                document.getElementById('display-task-endDate').textContent = updatedTask.endDate ? new Date(updatedTask.endDate + 'T00:00:00').toLocaleDateString() : 'N/A';
                const taskCard = document.querySelector(`.task-card[data-task-id="${updatedTask.id}"]`);
                if (taskCard) { taskCard.remove(); }
                const ganttRow = document.querySelector(`.gantt-task-row[data-task-id="${updatedTask.id}"]`);
                if (ganttRow) { ganttRow.remove(); }
                if (typeof detailEditTaskModal !== 'undefined' && detailEditTaskModal.style.display === 'block') {
                   detailEditTaskModal.style.display = 'none';
                   detailEditTaskModal.classList.add('hidden');
                }
                if (typeof detailEditTaskForm !== 'undefined') { detailEditTaskForm.reset(); }
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
                headers: { 'Content-Type': 'application/json', }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw (err || {error: 'Failed to start task.'}); });
                }
                return response.json();
            })
            .then(updatedTask => {
                console.log('Task started successfully:', updatedTask);
                const index = tasksData.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) { tasksData[index] = updatedTask; } 
                else { tasksData.push(updatedTask); }
                document.getElementById('display-task-startDate').textContent = updatedTask.startDate ? new Date(updatedTask.startDate + 'T00:00:00').toLocaleDateString() : 'N/A';
                document.getElementById('display-task-endDate').textContent = 'N/A'; 
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

            if (!name.trim()) { alert('Task name cannot be empty.'); return; }

            const taskDataToUpdate = { name, detail, limitDate: limitDate || null, period, isMainTask };
            fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(taskDataToUpdate),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { 
                        let errorMsg = 'Failed to update task.';
                        if (err && err.error) { errorMsg = err.error; if (err.details) errorMsg += ` Details: ${err.details}`; }
                        throw new Error(errorMsg);
                    });
                }
                return response.json();
            })
            .then(updatedTask => {
                console.log('Task updated successfully:', updatedTask);
                detailEditTaskModal.style.display = 'none'; 
                detailEditTaskModal.classList.add('hidden'); 
                detailEditTaskForm.reset();
                const index = tasksData.findIndex(t => t.id === updatedTask.id);
                if (index !== -1) { tasksData[index] = updatedTask; } 
                else { tasksData.push(updatedTask); }
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

    if (cancelEditTaskBtn) {
        cancelEditTaskBtn.addEventListener('click', function() {
            detailEditTaskModal.style.display = 'none';
            detailEditTaskModal.classList.add('hidden');
            detailEditTaskForm.reset();
        });
    }

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
        if (deleteConfirmModal && event.target == deleteConfirmModal) { 
            deleteConfirmModal.style.display = 'none';
            deleteConfirmModal.classList.add('hidden');
        }
    });
    
    if (taskListArea) {
        taskListArea.addEventListener('click', function(event) {
            const taskCard = event.target.closest('.task-card');
            if (taskCard) {
                const taskId = parseInt(taskCard.dataset.taskId);
                const task = tasksData.find(t => t.id === taskId);
                if (task) {
                    document.getElementById('edit-task-id').value = task.id;
                    document.getElementById('edit-task-name').value = task.name || '';
                    document.getElementById('edit-task-detail').value = task.detail || '';
                    document.getElementById('display-task-startDate').textContent = task.startDate ? new Date(task.startDate + 'T00:00:00').toLocaleDateString() : 'N/A';
                    document.getElementById('display-task-endDate').textContent = task.endDate ? new Date(task.endDate + 'T00:00:00').toLocaleDateString() : 'N/A';
                    document.getElementById('edit-task-limit-date').value = task.limitDate || '';
                    document.getElementById('edit-task-period').value = task.period || '';
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

    function parsePeriodToDays(periodString) {
        if (!periodString || typeof periodString !== 'string') return null;
        const period = periodString.toLowerCase().trim();
        const value = parseInt(period);
        if (isNaN(value)) return null;
        if (period.endsWith('d')) { return value; } 
        else if (period.endsWith('w')) { return value * 7; } 
        else if (period.endsWith('m')) { return value * 30; }
        return null; 
    }

    let pixelsPerDay = 20; // Default scale

    function renderGanttChart(tasks, todayString) {
        const headerContainer = document.querySelector('#gantt-chart-area .gantt-chart-header-container');
        const rowsContainer = document.querySelector('#gantt-chart-area .gantt-chart-rows');
        if (!headerContainer || !rowsContainer) return;

        headerContainer.innerHTML = '';
        rowsContainer.innerHTML = '';

        const today = new Date(todayString + 'T00:00:00');
        const timelineStart = new Date(today);
        timelineStart.setDate(today.getDate() - 7); // Show 7 days before today
        const timelineEnd = new Date(today);
        timelineEnd.setFullYear(today.getFullYear() + 1); // Show up to 1 year from today

        let totalDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));
        let totalWidth = totalDays * pixelsPerDay;
        
        // A. Render Header
        for (let i = 0; i < totalDays; i++) {
            const day = new Date(timelineStart);
            day.setDate(timelineStart.getDate() + i);
            const cell = document.createElement('div');
            cell.className = 'gantt-header-cell';
            cell.style.width = pixelsPerDay + 'px';
            cell.textContent = `${day.getDate()}/${day.getMonth() + 1}`; 
            headerContainer.appendChild(cell);
        }
        headerContainer.style.width = totalWidth + 'px';
        rowsContainer.style.width = totalWidth + 'px';

        // B. Render Task Bars
        tasks.forEach(task => {
            let taskStartDate = task.startDate ? new Date(task.startDate + 'T00:00:00') : null;
            if (!taskStartDate || taskStartDate > timelineEnd || (task.endDate && new Date(task.endDate + 'T00:00:00') < timelineStart)) {
                return; 
            }

            let effectiveEndDate;
            if (task.endDate) {
                effectiveEndDate = new Date(task.endDate + 'T00:00:00');
            } else {
                const periodInDays = parsePeriodToDays(task.period);
                effectiveEndDate = new Date(taskStartDate);
                if (periodInDays && periodInDays > 0) {
                    effectiveEndDate.setDate(taskStartDate.getDate() + periodInDays);
                } else {
                    effectiveEndDate.setDate(taskStartDate.getDate() + 1); 
                }
            }
            
            let renderStartDate = taskStartDate < timelineStart ? timelineStart : taskStartDate;
            let renderEndDate = effectiveEndDate > timelineEnd ? timelineEnd : effectiveEndDate;

            if (renderStartDate >= renderEndDate) return; 

            const startOffsetDays = Math.max(0, Math.floor((renderStartDate - timelineStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.ceil((renderEndDate - renderStartDate) / (1000 * 60 * 60 * 24));

            const taskRow = document.createElement('div');
            taskRow.className = 'gantt-task-row';
            taskRow.setAttribute('data-task-id', task.id); 

            const taskBar = document.createElement('div');
            taskBar.className = 'gantt-task-bar'; 
            
            let limitDt = task.limitDate ? new Date(task.limitDate + 'T00:00:00') : null;
            let startDt = task.startDate ? new Date(task.startDate + 'T00:00:00') : null;
            let endDt = task.endDate ? new Date(task.endDate + 'T00:00:00') : null; 
            let barStyleClass = '';
            if (startDt && (!endDt || endDt > today)) { 
                barStyleClass = 'started';
            } else if (limitDt && limitDt < today && (!endDt || endDt >= today)) { // Overdue if not ended before today
                barStyleClass = 'overdue';
            } else if (limitDt && limitDt > today) {
                const sevenDaysFromToday = new Date(today);
                sevenDaysFromToday.setDate(today.getDate() + 7);
                if (limitDt <= sevenDaysFromToday) {
                    barStyleClass = 'due-soon';
                } else {
                    barStyleClass = 'default-color';
                }
            } else {
                barStyleClass = 'default-color';
            }
            taskBar.classList.add(barStyleClass);

            taskBar.style.left = (startOffsetDays * pixelsPerDay) + 'px';
            taskBar.style.width = Math.max(pixelsPerDay, (durationDays * pixelsPerDay - 2)) + 'px'; // Min width of 1 day, -2 for border/padding
            taskBar.textContent = task.name;
            taskBar.setAttribute('title', `${task.name} (${taskStartDate.toLocaleDateString()} - ${effectiveEndDate.toLocaleDateString()})`);
            
            taskRow.appendChild(taskBar);
            rowsContainer.appendChild(taskRow);
        });
    }

    // C. Zoom Functionality
    const ganttArea = document.getElementById('gantt-chart-area');
    if (ganttArea) {
        ganttArea.addEventListener('wheel', function(event) {
            if (event.ctrlKey) {
                event.preventDefault();
                const oldPixelsPerDay = pixelsPerDay;
                const scrollX = ganttArea.scrollLeft;
                const mouseX = event.clientX - ganttArea.getBoundingClientRect().left;
                const daysFromTimelineStartToMouse = (scrollX + mouseX) / oldPixelsPerDay;


                if (event.deltaY < 0) {
                    pixelsPerDay = Math.min(100, pixelsPerDay * 1.1); // Zoom in
                } else {
                    pixelsPerDay = Math.max(5, pixelsPerDay / 1.1);  // Zoom out
                }

                if (pixelsPerDay !== oldPixelsPerDay) {
                    renderGanttChart(tasksData, todayData); 
                    const newScrollX = (daysFromTimelineStartToMouse * pixelsPerDay) - mouseX;
                    ganttArea.scrollLeft = newScrollX;
                }
            }
        }, { passive: false }); 
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

            if (!name.trim()) { alert('Task name is required.'); return; }

            const taskData = { name, detail, limitDate: limitDate || null, period, isMainTask };
            fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(taskData),
            })
            .then(response => {
                if (!response.ok) { return response.json().then(err => { throw err; }); }
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
                if (error && error.error) { errorMessage += ` Server says: ${error.error}`; if (error.details) { errorMessage += ` Details: ${error.details}`;}}
                alert(errorMessage);
            });
        });
    }

    // Initial render call
    if (typeof tasksData !== 'undefined' && typeof todayData !== 'undefined') {
       renderGanttChart(tasksData, todayData);
    }

    // Sort functionality
    const sortBySelect = document.getElementById('sort-by-select');
    if (sortBySelect) {
        // The initial value is set by Jinja's `selected` attribute in the HTML.
        sortBySelect.addEventListener('change', function() {
            const selectedValue = this.value;
            // Preserve other query parameters if any (though not strictly needed for this app yet)
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('sort_by', selectedValue);
            window.location.href = currentUrl.toString();
        });
    }

    // Initialize flatpickr for date inputs
    const taskLimitDateInput = document.getElementById('task-limit-date');
    if (taskLimitDateInput) {
        flatpickr(taskLimitDateInput, {
            dateFormat: "Y-m-d",
            enableTime: false,
            allowInput: true 
        });
    }

    const editTaskLimitDateInput = document.getElementById('edit-task-limit-date');
    if (editTaskLimitDateInput) {
        flatpickr(editTaskLimitDateInput, {
            dateFormat: "Y-m-d",
            enableTime: false,
            allowInput: true
        });
    }

    // SortableJS for drag & drop
    const dayColumns = document.querySelectorAll('.calendar-day-column');
    const otherTasksList = document.getElementById('other-tasks-list');
    const sortableLists = Array.from(dayColumns);
    if (otherTasksList) { sortableLists.push(otherTasksList); }

    sortableLists.forEach(listEl => {
        if (!listEl) return; 
        new Sortable(listEl, {
            group: 'shared-tasks', 
            animation: 150,
            draggable: '.task-card', 
            onEnd: function (evt) {
                const item = evt.item; 
                const taskId = item.dataset.taskId;
                const toList = evt.to; 
                const fromList = evt.from; 
                let taskName = item.querySelector('h3') ? item.querySelector('h3').textContent : 
                               (item.querySelector('strong') ? item.querySelector('strong').textContent : `Task ID ${taskId}`);

                if (fromList === toList) { 
                    const taskIdsInOrder = Array.from(toList.children)
                                              .map(card => card.dataset.taskId)
                                              .filter(id => id !== undefined); 
                    console.log(`Task reordered in list ${toList.id || 'day-column-' + toList.dataset.date}. New order:`, taskIdsInOrder);
                    fetch(`/api/tasks/update_order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', },
                        body: JSON.stringify({ task_ids_in_order: taskIdsInOrder }),
                    })
                    .then(response => {
                        if (!response.ok) { return response.json().then(err => { throw (err || { error: 'Failed to update task order.' }); }); }
                        return response.json(); 
                    })
                    .then(data => {
                        console.log('Task order updated successfully:', data);
                        alert(`Task order updated for "${taskName}". Refreshing view.`);
                        location.reload();
                    })
                    .catch((error) => {
                        console.error('Error updating task order:', error);
                        alert(`Error updating task order for "${taskName}": ${error.error || error.message}. View may be inconsistent; please refresh.`);
                    });
                } else { 
                    let newLimitDate = null;
                    if (toList.classList.contains('calendar-day-column')) { newLimitDate = toList.dataset.date; }
                    console.log(`Task ${taskId} moved. New limitDate: ${newLimitDate}`);
                    fetch(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', },
                        body: JSON.stringify({ limitDate: newLimitDate }),
                    })
                    .then(response => {
                        if (!response.ok) { return response.json().then(err => { throw (err || { error: 'Failed to update task date.' });  }); }
                        return response.json();
                    })
                    .then(updatedTask => {
                        console.log('Task limitDate updated successfully:', updatedTask);
                        const index = tasksData.findIndex(t => t.id === parseInt(updatedTask.id)); 
                        if (index !== -1) { tasksData[index] = updatedTask; }
                        alert(`Task "${taskName}" limit date changed. Refreshing view.`);
                        location.reload();
                    })
                    .catch((error) => {
                        console.error('Error updating task limitDate:', error);
                        alert(`Error updating task "${taskName}": ${error.error || error.message}. View may be inconsistent; please refresh.`);
                    });
                }
            }
        });
    });

});
