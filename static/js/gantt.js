// Gantt chart specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('gantt.js loaded');

    if (typeof tasksData === 'undefined' || typeof todayData === 'undefined') {
        console.error('tasksData or todayData is not defined. Ensure they are correctly passed from the template.');
        return;
    }

    const ganttContainer = document.getElementById('ganttContainer');
    const timelineHeaderEl = document.getElementById('ganttTimelineHeader');
    const taskRowsContainerEl = document.getElementById('ganttTaskRowsContainer');

    if (!ganttContainer || !timelineHeaderEl || !taskRowsContainerEl) {
        console.error('Gantt chart container elements not found.');
        return;
    }

    let pixelsPerDay = 20; 
    const taskRowHeight = 30; 
    const taskBarHeight = 20; 
    const taskBarTopMargin = (taskRowHeight - taskBarHeight) / 2;

    const today = new Date(todayData + 'T00:00:00');
    let viewStartDate = new Date(today);
    viewStartDate.setDate(today.getDate() - 7); 

    let viewEndDate = new Date(today);
    viewEndDate.setFullYear(today.getFullYear() + 1); 

    function renderGanttChart() {
        if (!timelineHeaderEl || !taskRowsContainerEl) return;

        timelineHeaderEl.innerHTML = '';
        taskRowsContainerEl.innerHTML = '';

        const totalDays = Math.ceil((viewEndDate - viewStartDate) / (1000 * 60 * 60 * 24));
        const totalWidth = totalDays * pixelsPerDay;

        timelineHeaderEl.style.width = `${totalWidth}px`;
        taskRowsContainerEl.style.width = `${totalWidth}px`;

        let currentMonth = -1;
        for (let i = 0; i < totalDays; i++) {
            const dayDate = new Date(viewStartDate);
            dayDate.setDate(viewStartDate.getDate() + i);

            if (dayDate.getMonth() !== currentMonth) {
                currentMonth = dayDate.getMonth();
                const monthMarker = document.createElement('div');
                monthMarker.className = 'gantt-header-marker gantt-month-marker';
                
                const firstDayOfMonth = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
                const lastDayOfMonth = new Date(dayDate.getFullYear(), dayDate.getMonth() + 1, 0);
                
                let startOfMarker = (firstDayOfMonth > viewStartDate) ? firstDayOfMonth : viewStartDate;
                let endOfMarker = (lastDayOfMonth < viewEndDate) ? lastDayOfMonth : viewEndDate;
                
                // Ensure endOfMarker is inclusive for day calculation
                let endOfMarkerForCalc = new Date(endOfMarker);
                endOfMarkerForCalc.setDate(endOfMarkerForCalc.getDate() + 1);

                let daysVisibleInMarker = (endOfMarkerForCalc - startOfMarker) / (1000 * 60 * 60 * 24);
                daysVisibleInMarker = Math.max(0, Math.round(daysVisibleInMarker));


                if (daysVisibleInMarker > 0) {
                    monthMarker.style.width = `${daysVisibleInMarker * pixelsPerDay}px`;
                    monthMarker.textContent = `${dayDate.toLocaleString('default', { month: 'short' })} ${dayDate.getFullYear()}`;
                    timelineHeaderEl.appendChild(monthMarker);
                }
            }
        }

        let taskVisibleCount = 0;
        tasksData.forEach((task) => { // tasksData should now be properly formatted from app.py
            if (!task.startDate) return; 

            const taskStartDate = new Date(task.startDate + 'T00:00:00');
            let taskEndDate;

            if (task.endDate) {
                taskEndDate = new Date(task.endDate + 'T00:00:00');
            } else if (task.limitDate) {
                taskEndDate = new Date(task.limitDate + 'T00:00:00');
            } else {
                taskEndDate = new Date(taskStartDate);
                taskEndDate.setDate(taskStartDate.getDate() + 1); 
            }
            
            if (taskEndDate < taskStartDate) {
                taskEndDate = new Date(taskStartDate);
                taskEndDate.setDate(taskStartDate.getDate() + 1);
            }

            const barActualStart = taskStartDate > viewStartDate ? taskStartDate : viewStartDate;
            const barActualEnd = taskEndDate < viewEndDate ? taskEndDate : viewEndDate;

            if (barActualStart >= barActualEnd) return; 

            const startOffsetDays = (barActualStart - viewStartDate) / (1000 * 60 * 60 * 24);
            const durationDays = (barActualEnd - barActualStart) / (1000 * 60 * 60 * 24);
            
            if (durationDays <= 0) return;

            const taskBarDiv = document.createElement('div');
            taskBarDiv.className = 'gantt-task-bar';
            taskBarDiv.dataset.taskId = task.id;
            taskBarDiv.style.left = `${startOffsetDays * pixelsPerDay}px`;
            taskBarDiv.style.width = `${Math.max(1, durationDays * pixelsPerDay -1 )}px`; // Ensure at least 1px, and some gap
            
            taskBarDiv.style.top = `${taskVisibleCount * taskRowHeight + taskBarTopMargin}px`;
            
            taskBarDiv.textContent = task.name;
            taskBarDiv.title = `${task.name} (Start: ${task.startDate}, End: ${task.endDate || task.limitDate || 'N/A'})`;

            // Corrected Color coding logic
            const todayDate = new Date(todayData + 'T00:00:00'); // today is from global scope
            const limitDateObj = task.limitDate ? new Date(task.limitDate + 'T00:00:00') : null;
            // taskStartDate is already a Date object
            const endDateObj = task.endDate ? new Date(task.endDate + 'T00:00:00') : null;

            if (task.status === 'active') {
                // Precedence: Red, Purple, Orange, Green
                if (limitDateObj && limitDateObj < todayDate && (!endDateObj || endDateObj >= todayDate)) {
                    taskBarDiv.classList.add('gantt-bar-red'); // Overdue
                } else if (limitDateObj && limitDateObj >= todayDate && limitDateObj <= new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000) && (!endDateObj || endDateObj >= todayDate)) {
                    taskBarDiv.classList.add('gantt-bar-purple'); // Due soon
                } else if (taskStartDate && (!endDateObj || endDateObj >= todayDate)) { // Task is started and not yet ended
                    taskBarDiv.classList.add('gantt-bar-orange'); // Started
                } else {
                    taskBarDiv.classList.add('gantt-bar-green'); // Normal active or other cases
                }
            } else if (task.status === 'ended') {
                 taskBarDiv.classList.add('gantt-bar-grey'); // Ended tasks
            } else { 
                 taskBarDiv.classList.add('gantt-bar-grey'); // Default for others (e.g. 'deleted' not shown)
            }
            
            taskRowsContainerEl.appendChild(taskBarDiv);
            taskVisibleCount++;
        });
        taskRowsContainerEl.style.height = `${taskVisibleCount * taskRowHeight}px`;
    }

    if (ganttContainer) {
        ganttContainer.addEventListener('wheel', function(event) {
            if (event.ctrlKey) {
                event.preventDefault();
                
                const oldPixelsPerDay = pixelsPerDay;
                const mouseXRelativeToContainer = event.clientX - ganttContainer.getBoundingClientRect().left;
                const daysFromViewStartToMouse = (ganttContainer.scrollLeft + mouseXRelativeToContainer) / oldPixelsPerDay;

                if (event.deltaY < 0) { 
                    pixelsPerDay = Math.min(100, pixelsPerDay * 1.2);
                } else { 
                    pixelsPerDay = Math.max(2, pixelsPerDay / 1.2);
                }
                pixelsPerDay = Math.round(pixelsPerDay);

                if (pixelsPerDay !== oldPixelsPerDay) {
                    renderGanttChart();
                    const newScrollLeft = (daysFromViewStartToMouse * pixelsPerDay) - mouseXRelativeToContainer;
                    ganttContainer.scrollLeft = newScrollLeft;
                }
            }
        }, { passive: false }); 
    }

    if (typeof tasksData !== 'undefined' && tasksData && tasksData.length > 0) {
        renderGanttChart();
    } else {
        if(taskRowsContainerEl) taskRowsContainerEl.innerHTML = '<p style="text-align:center; padding-top:20px;">No tasks with start dates to display in Gantt chart.</p>';
    }
});
