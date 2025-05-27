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
    // Existing SortableJS for calendar view and other lists (keep if still used elsewhere)
    const dayColumns = document.querySelectorAll('.calendar-day-column');
    const otherTasksListOriginal = document.getElementById('other-tasks-list'); // Renamed to avoid conflict
    const sortableListsOriginal = Array.from(dayColumns);
    if (otherTasksListOriginal) { sortableListsOriginal.push(otherTasksListOriginal); }

    sortableListsOriginal.forEach(listEl => {
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
                    // This console log might be for the old lists if they are still active
                    console.log(`Task reordered in list ${toList.id || 'day-column-' + toList.dataset.date}. New order:`, taskIdsInOrder);
                    // The fetch call here is fine as it's generic for reordering
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
                        console.log('Task order updated successfully (original sorter):', data);
                        alert(`Task order updated for "${taskName}". Refreshing view.`);
                        location.reload();
                    })
                    .catch((error) => {
                        console.error('Error updating task order (original sorter):', error);
                        alert(`Error updating task order for "${taskName}" (original sorter): ${error.error || error.message}. View may be inconsistent; please refresh.`);
                    });
                } else { 
                    // This part is for moving between different date columns in the old view
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
                        console.log('Task limitDate updated successfully (original sorter):', updatedTask);
                        const index = tasksData.findIndex(t => t.id === parseInt(updatedTask.id)); 
                        if (index !== -1) { tasksData[index] = updatedTask; }
                        alert(`Task "${taskName}" limit date changed. Refreshing view.`);
                        location.reload();
                    })
                    .catch((error) => {
                        console.error('Error updating task limitDate (original sorter):', error);
                        alert(`Error updating task "${taskName}" (original sorter): ${error.error || error.message}. View may be inconsistent; please refresh.`);
                    });
                }
            }
        });
    });

    // New SortableJS instance for the main #sortableTaskList
    const mainTaskListEl = document.getElementById('sortableTaskList');
    if (mainTaskListEl) {
        new Sortable(mainTaskListEl, {
            animation: 150,
            draggable: '.task-card', // Individual tasks are draggable
            group: 'mainTaskListGroup', // Can be its own group if not dragging between different lists
            onEnd: function(evt) {
                const itemEl = evt.item; // dragged HTMLElement
                const taskIdsInOrder = Array.from(mainTaskListEl.children)
                    .map(card => card.dataset.taskId)
                    .filter(id => id !== undefined); // Filter out any undefined if non-task elements are somehow there

                console.log('New task order in main list:', taskIdsInOrder);

                // AJAX POST request to update task order
                fetch('/api/tasks/update_order', { // Using the existing, adapted backend route
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ task_ids_in_order: taskIdsInOrder }) // Ensure key matches backend
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw (err || { error: 'Server error' }); });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Task order updated successfully:', data);
                    // Optionally, provide user feedback e.g., a success message
                    // For now, a page reload will show the new order from server
                    // location.reload(); // Reload to see changes, or update UI dynamically
                    alert('Task order saved! Refreshing to show new order.');
                    location.reload();

                })
                .catch(error => {
                    console.error('Error updating task order:', error);
                    alert('Error updating task order: ' + (error.message || error.error || 'Unknown error'));
                    // Optionally, revert optimistic UI changes or prompt user
                });
            }
        });
    }

    // --- Logic for the new Task Detail/Edit Popup (Subtask Implementation) ---
    const detailPopupContainer = document.getElementById('detailPopupContainer');
    const mainTaskListArea = document.getElementById('taskListArea'); // Using the main task list area for clicks
    const endedTasksListArea = document.getElementById('ended-tasks-list'); // For ended tasks
    const deletedTasksListArea = document.getElementById('deleted-tasks-list'); // For deleted tasks


    // Helper function to open detail popup (extracted from previous subtask logic)
    async function openDetailPopup(taskId) {
        if (!detailPopupContainer) return;

        try {
            detailPopupContainer.innerHTML = `
                <form id="detailEditForm" method="POST">
                    <input type="hidden" name="taskId" id="detailTaskId">
                    <div>
                        <label for="detailName">Name (タスク名):</label>
                        <input type="text" name="name" id="detailName" required>
                    </div>
                    <div>
                        <label for="detailLimitDate">Limit date (期限日):</label>
                        <input type="date" name="limitDate" id="detailLimitDate">
                    </div>
                    <div>
                        <label for="detailText">Detail (詳細):</label>
                        <textarea name="detail" id="detailText" rows="3"></textarea>
                    </div>
                    <div>
                        <input type="checkbox" name="notMain" id="detailNotMain">
                        <label for="detailNotMain">[not Main]</label>
                    </div>
                    <hr>
                    <p>Status Information:</p>
                    <div>
                        <p>Current Status: <span id="detailCurrentStatus">N/A</span></p>
                        <p>Start Date: <span id="detailStartDateDisplay">N/A</span></p>
                        <p>End Date: <span id="detailEndDateDisplay">N/A</span></p>
                    </div>
                    <hr>
                    <p>Actions:</p>
                    <div>
                        <button type="button" id="detailStartButton">Start</button>
                        <button type="button" id="detailEndButton">End</button>
                        <button type="button" id="detailDeleteButton">Delete</button>
                    </div>
                    <hr>
                    <p>Operations:</p>
                    <div>
                        <button type="submit" id="detailSaveButton">Save</button>
                        <button type="button" id="detailCancelButton">Cancel</button>
                    </div>
                </form>
            `;

            const taskDetailsResponse = await fetch(`/get_task_details/${taskId}`);
            if (!taskDetailsResponse.ok) {
                const errorData = await taskDetailsResponse.json();
                throw new Error(errorData.error || 'Failed to fetch task details');
            }
            const task = await taskDetailsResponse.json();

            document.getElementById('detailTaskId').value = task.id;
            document.getElementById('detailName').value = task.name || '';
            document.getElementById('detailLimitDate').value = task.limitDate || '';
            document.getElementById('detailText').value = task.detail || '';
            document.getElementById('detailNotMain').checked = !task.isMainTask;
            
            document.getElementById('detailCurrentStatus').textContent = task.status || 'N/A';
            document.getElementById('detailStartDateDisplay').textContent = task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A';
            document.getElementById('detailEndDateDisplay').textContent = task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A';

            detailPopupContainer.style.display = 'block';

            // Wire up event listeners for the buttons within the loaded form
            const detailEditFormInPopup = detailPopupContainer.querySelector('#detailEditForm');
            if (detailEditFormInPopup) {
                detailEditFormInPopup.onsubmit = async function(e) {
                    e.preventDefault();
                    const formData = new FormData(detailEditFormInPopup);
                    const currentTaskId = formData.get('taskId');
                    try {
                        const updateResponse = await fetch(`/update_task/${currentTaskId}`, {
                            method: 'POST',
                            body: formData
                        });
                        const result = await updateResponse.json();
                        if (updateResponse.ok && result.status === 'success') {
                            alert(result.message);
                            detailPopupContainer.style.display = 'none';
                            detailPopupContainer.innerHTML = '';
                            location.reload();
                        } else {
                            throw new Error(result.message || 'Failed to update task');
                        }
                    } catch (err) {
                        console.error('Error updating task:', err);
                        alert('Error updating task: ' + err.message);
                    }
                };
            }

            const cancelButtonInPopup = detailPopupContainer.querySelector('#detailCancelButton');
            if (cancelButtonInPopup) {
                cancelButtonInPopup.onclick = function() {
                    detailPopupContainer.style.display = 'none';
                    detailPopupContainer.innerHTML = '';
                };
            }

            const startButtonInPopup = detailPopupContainer.querySelector('#detailStartButton');
            if (startButtonInPopup) {
                startButtonInPopup.onclick = async function() {
                    const currentTaskId = document.getElementById('detailTaskId').value;
                    try {
                        const startResponse = await fetch(`/task/${currentTaskId}/start`, { method: 'POST' });
                        const result = await startResponse.json();
                        if (startResponse.ok && result.status === 'success') {
                            alert(result.message);
                            document.getElementById('detailCurrentStatus').textContent = result.task.status;
                            document.getElementById('detailStartDateDisplay').textContent = result.task.startDate ? new Date(result.task.startDate).toLocaleDateString() : 'N/A';
                            document.getElementById('detailEndDateDisplay').textContent = result.task.endDate ? new Date(result.task.endDate).toLocaleDateString() : 'N/A';
                            location.reload();
                        } else {
                            throw new Error(result.message || 'Failed to start task');
                        }
                    } catch (err) {
                        console.error('Error starting task:', err);
                        alert('Error starting task: ' + err.message);
                    }
                };
            }
            
            const endButtonInPopup = detailPopupContainer.querySelector('#detailEndButton');
            if (endButtonInPopup) {
                endButtonInPopup.onclick = async function() {
                    const currentTaskId = document.getElementById('detailTaskId').value;
                     if (!confirm('Are you sure you want to mark this task as ended?')) return;
                    try {
                        const endResponse = await fetch(`/task/${currentTaskId}/end`, { method: 'POST' });
                        const result = await endResponse.json();
                        if (endResponse.ok && result.status === 'success') {
                            alert(result.message);
                            document.getElementById('detailCurrentStatus').textContent = result.task.status;
                            document.getElementById('detailEndDateDisplay').textContent = result.task.endDate ? new Date(result.task.endDate).toLocaleDateString() : 'N/A';
                            location.reload();
                        } else {
                            throw new Error(result.message || 'Failed to end task');
                        }
                    } catch (err) {
                        console.error('Error ending task:', err);
                        alert('Error ending task: ' + err.message);
                    }
                };
            }

            const deleteButtonInPopup = detailPopupContainer.querySelector('#detailDeleteButton');
            if (deleteButtonInPopup) {
                deleteButtonInPopup.onclick = function() { // This is the part that needs to be modified for this subtask
                    const currentTaskIdInDetailPopup = document.getElementById('detailTaskId').value;
                    if (!currentTaskIdInDetailPopup) {
                        alert('Error: Task ID not found in detail popup.');
                        return;
                    }
                    detailPopupContainer.style.display = 'none';
                    detailPopupContainer.innerHTML = '';
                    const deleteConfirmContainer = document.getElementById('deleteConfirmPopupContainer');
                    if (deleteConfirmContainer) {
                        deleteConfirmContainer.innerHTML = `
                            <div>
                                <input type="hidden" name="taskId" id="deleteConfirmTaskId">
                                <div>
                                    <label for="deleteReasonInput">Reason for delete (削除理由):</label>
                                    <input type="text" name="reasonForDelete" id="deleteReasonInput" style="width: 90%;">
                                </div>
                                <p style="margin-top: 15px; margin-bottom: 15px;">Truly delete? Yes. (本当に削除しますか？ はい。)</p>
                                <div>
                                    <button type="button" id="confirmDeleteYesButton" style="margin-right: 10px;">Yes (はい)</button>
                                    <button type="button" id="confirmDeleteCancelButton">Cancel (キャンセル)</button>
                                </div>
                            </div>
                        `;
                        const deleteConfirmTaskIdInput = deleteConfirmContainer.querySelector('#deleteConfirmTaskId');
                        if (deleteConfirmTaskIdInput) {
                            deleteConfirmTaskIdInput.value = currentTaskIdInDetailPopup;
                        }
                        deleteConfirmContainer.style.display = 'block';
                        const yesButton = deleteConfirmContainer.querySelector('#confirmDeleteYesButton');
                        const cancelButtonDel = deleteConfirmContainer.querySelector('#confirmDeleteCancelButton'); // Renamed to avoid conflict
                        const reasonInput = deleteConfirmContainer.querySelector('#deleteReasonInput');
                        if (yesButton) {
                            yesButton.onclick = async function() {
                                const taskIdToDelete = deleteConfirmTaskIdInput ? deleteConfirmTaskIdInput.value : null;
                                const reasonForDelete = reasonInput ? reasonInput.value : '';
                                if (!taskIdToDelete) {
                                    alert('Error: Task ID for deletion is missing.');
                                    return;
                                }
                                try {
                                    const response = await fetch(`/task/${taskIdToDelete}/delete_confirm`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reasonForDelete: reasonForDelete })
                                    });
                                    const result = await response.json();
                                    if (response.ok && result.status === 'success') {
                                        alert(result.message);
                                        deleteConfirmContainer.style.display = 'none';
                                        deleteConfirmContainer.innerHTML = '';
                                        location.reload();
                                    } else {
                                        throw new Error(result.message || 'Failed to delete task');
                                    }
                                } catch (err) {
                                    console.error('Error deleting task:', err);
                                    alert('Error deleting task: ' + err.message);
                                }
                            };
                        }
                        if (cancelButtonDel) { // Use renamed variable
                            cancelButtonDel.onclick = function() {
                                deleteConfirmContainer.style.display = 'none';
                                deleteConfirmContainer.innerHTML = '';
                            };
                        }
                    } else {
                         alert('Delete confirmation popup container not found.');
                    }
                };
            }

        } catch (error) {
            console.error('Error in openDetailPopup:', error);
            alert('Error: ' + error.message);
            if (detailPopupContainer) { // Check if detailPopupContainer is still valid
                detailPopupContainer.innerHTML = '<p>Error loading task details.</p>';
                detailPopupContainer.style.display = 'block';
            }
        }
    }

    if (mainTaskListArea && detailPopupContainer) {
        mainTaskListArea.addEventListener('click', async function(event) {
            const taskCard = event.target.closest('.task-card'); // For active tasks
            if (!taskCard) return;

            const taskId = taskCard.dataset.taskId;
            if (!taskId) return;
            openDetailPopup(taskId); // Use the helper function
        });
    }

    // Add event listeners for ended and deleted task sections to open detail popup
    if (endedTasksListArea && detailPopupContainer) {
        endedTasksListArea.addEventListener('click', function(event) {
            const targetElement = event.target;
            // Check if the click was on the span within the li, or the li itself
            const taskItem = targetElement.closest('.ended-task-item');
            if (taskItem && taskItem.dataset.taskId) {
                 // Prevent button click from also triggering this
                if (targetElement.tagName === 'BUTTON' || targetElement.classList.contains('restore-task-btn')) return;
                openDetailPopup(taskItem.dataset.taskId);
            }
        });
    }

    if (deletedTasksListArea && detailPopupContainer) {
        deletedTasksListArea.addEventListener('click', function(event) {
            const targetElement = event.target;
            const taskItem = targetElement.closest('.deleted-task-item');
            if (taskItem && taskItem.dataset.taskId) {
                if (targetElement.tagName === 'BUTTON' || targetElement.classList.contains('restore-deleted-task-btn')) return;
                openDetailPopup(taskItem.dataset.taskId);
            }
        });
    }


    // Modify existing restore logic to use the new /task/<id>/restore route
    // For .restore-task-btn (originally in ended tasks)
    if (endedTasksSection) { // endedTasksSection is the <ul>'s parent div
        endedTasksSection.addEventListener('click', function(event) {
            if (event.target.classList.contains('restore-task-btn')) {
                const taskId = event.target.dataset.taskId;
                if (!confirm('Are you sure you want to restore this task to active?')) return;

                fetch(`/task/${taskId}/restore`, { // Using the new unified restore route
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' } // Though this route doesn't strictly need a body
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw (err || {error: 'Failed to restore task.'}); });
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Task restored successfully:', result);
                    alert(result.message || 'Task restored successfully! Refreshing page.');
                    location.reload();
                })
                .catch(error => {
                    console.error('Error restoring task:', error);
                    alert(`Error restoring task: ${error.error || error.message}`);
                });
            }
        });
    }

    // For .restore-deleted-task-btn (originally in deleted tasks)
    if (deletedTasksSection) { // deletedTasksSection is the <ul>'s parent div
        deletedTasksSection.addEventListener('click', function(event) {
            if (event.target.classList.contains('restore-deleted-task-btn')) {
                const taskId = event.target.dataset.taskId;
                if (!confirm('Are you sure you want to restore this task from deleted items?')) return;

                fetch(`/task/${taskId}/restore`, { // Using the new unified restore route
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw (err || {error: 'Failed to restore deleted task.'}); });
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Deleted task restored successfully:', result);
                    alert(result.message || 'Task restored from deleted items! Refreshing page.');
                    location.reload();
                })
                .catch(error => {
                    console.error('Error restoring deleted task:', error);
                    alert(`Error restoring task: ${error.error || error.message}`);
                });
            }
        });
    }

});
