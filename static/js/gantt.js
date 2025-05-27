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
    const MIN_BAR_WIDTH_PX = 5; // Minimum pixel width for any bar to ensure visibility

    let today; // Will be initialized in renderGanttChart after logging todayData
    let viewStartDate;
    let viewEndDate;

    function initializeDates() {
        try {
            console.log('[GANTT_DEBUG] Initializing dates. todayData:', todayData);
            if (typeof todayData !== 'string' || !todayData.match(/^\d{4}-\d{2}-\d{2}$/)) {
                console.error('[GANTT_ERROR] todayData is invalid or not in YYYY-MM-DD format:', todayData);
                // Fallback to prevent further errors, though Gantt might be incorrect
                today = new Date(); 
                today.setHours(0,0,0,0);
            } else {
                today = new Date(todayData + 'T00:00:00');
            }
            console.log('[GANTT_DEBUG] Parsed today object for Gantt:', today);
            if (isNaN(today.getTime())) { // Check if date is valid
                console.error('[GANTT_ERROR] Failed to parse todayData into a valid date. today object is Invalid Date.');
                // Fallback to ensure viewStartDate/viewEndDate are valid dates
                today = new Date(); 
                today.setHours(0,0,0,0);
            }

            viewStartDate = new Date(today);
            viewStartDate.setDate(today.getDate() - 7); 

            viewEndDate = new Date(today);
            viewEndDate.setFullYear(today.getFullYear() + 1); 
            console.log('[GANTT_DEBUG] viewStartDate:', viewStartDate, 'viewEndDate:', viewEndDate);

        } catch (error) {
            console.error('[GANTT_ERROR] Error in initializeDates:', error.message, error.stack);
            // Fallback to safe dates if initialization fails
            today = new Date(); today.setHours(0,0,0,0);
            viewStartDate = new Date(today); viewStartDate.setDate(today.getDate() - 7);
            viewEndDate = new Date(today); viewEndDate.setFullYear(today.getFullYear() + 1);
            console.warn('[GANTT_DEBUG] Using fallback dates due to error.');
        }
    }


    function renderGanttChart() {
        console.log('[GANTT_DEBUG] renderGanttChart() function called.');
        console.log('[GANTT_DEBUG] tasksData available to renderGanttChart:', typeof tasksData !== 'undefined' ? JSON.parse(JSON.stringify(tasksData)) : 'NOT DEFINED');
        // todayData is logged by initializeDates now
        console.log('[GANTT_DEBUG] Current pixelsPerDay:', pixelsPerDay);
        
        initializeDates(); // Ensure dates are initialized/re-initialized if they could change

        if (!timelineHeaderEl || !taskRowsContainerEl) {
            console.error("[GANTT_DEBUG] Gantt timeline header or task rows container not found in renderGanttChart. Aborting render.");
            return;
        }
        
        timelineHeaderEl.innerHTML = '';
        taskRowsContainerEl.innerHTML = '';

        let totalDaysInView, totalWidth;
        try {
            if (isNaN(viewStartDate.getTime()) || isNaN(viewEndDate.getTime())) {
                throw new Error('viewStartDate or viewEndDate is an Invalid Date.');
            }
            totalDaysInView = Math.ceil((viewEndDate - viewStartDate) / (1000 * 60 * 60 * 24));
            if (totalDaysInView < 0) totalDaysInView = 0; // Should not happen if dates are correct
            totalWidth = totalDaysInView * pixelsPerDay;
            console.log('[GANTT_DEBUG] totalDaysInView:', totalDaysInView, 'totalWidth:', totalWidth);

            timelineHeaderEl.style.width = `${totalWidth}px`;
            taskRowsContainerEl.style.width = `${totalWidth}px`;
        } catch (error) {
            console.error('[GANTT_ERROR] Error calculating timeline dimensions:', error.message, error.stack);
            return; // Critical error, cannot proceed
        }

        try {
            // Render Month Headers
            let currentMonthProcessing = new Date(viewStartDate);
            if (isNaN(currentMonthProcessing.getTime())) throw new Error('viewStartDate is invalid for month processing.');

            while(currentMonthProcessing <= viewEndDate) {
                const monthMarker = document.createElement('div');
                monthMarker.className = 'gantt-header-marker gantt-month-marker';
                
                const firstDayOfMonth = new Date(currentMonthProcessing.getFullYear(), currentMonthProcessing.getMonth(), 1);
                const lastDayOfMonth = new Date(currentMonthProcessing.getFullYear(), currentMonthProcessing.getMonth() + 1, 0);
                
                let startOfMarker = (firstDayOfMonth > viewStartDate) ? firstDayOfMonth : viewStartDate;
                let endOfMarker = (lastDayOfMonth < viewEndDate) ? lastDayOfMonth : viewEndDate;
                
                let daysInThisMarker = (endOfMarker.getTime() - startOfMarker.getTime()) / (1000 * 60 * 60 * 24) + 1; 
                daysInThisMarker = Math.max(0, Math.round(daysInThisMarker));

                if (daysInThisMarker > 0) {
                    monthMarker.style.width = `${daysInThisMarker * pixelsPerDay}px`;
                    monthMarker.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'short' })} ${firstDayOfMonth.getFullYear()}`;
                    timelineHeaderEl.appendChild(monthMarker);
                }
                
                currentMonthProcessing.setMonth(currentMonthProcessing.getMonth() + 1);
                if (currentMonthProcessing.getMonth() === 0) { // Wrapped around year
                    currentMonthProcessing.setDate(1); // Ensure it's first of month
                }
                 // Safety break for infinite loop, though less likely with month increments
                if (currentMonthProcessing > new Date(viewEndDate.getFullYear() + 2, 0, 1)) { // Allow buffer
                    console.error("[GANTT_ERROR] Infinite loop detected in month header rendering. Breaking.");
                    break;
                }
            }
            console.log('[GANTT_DEBUG] Successfully rendered month headers.');
        } catch (error) {
            console.error('[GANTT_ERROR] Error rendering month headers:', error.message, error.stack);
            // Can choose to return or continue without headers
        }

        console.log('[GANTT_DEBUG] About to start tasksData processing loop.');
        console.log('[GANTT_DEBUG] Verifying tasksData before loop. IsArray:', Array.isArray(tasksData), 'Length:', tasksData ? tasksData.length : 'N/A');

        let taskVisibleCount = 0;
        if (Array.isArray(tasksData)) {
            tasksData.forEach((task) => { 
                // console.log('[Gantt] Processing task:', JSON.parse(JSON.stringify(task))); // This is the detailed log
            if (!task.startDate) {
                // console.log('[Gantt] Task skipped (no startDate):', task.id, task.name);
                return; 
            }

            const taskStartDate = new Date(task.startDate + 'T00:00:00');
            let effectiveEndDate; // This is the date the task *ends on* (inclusive)

            if (task.endDate) {
                effectiveEndDate = new Date(task.endDate + 'T00:00:00');
            } else if (task.limitDate) {
                effectiveEndDate = new Date(task.limitDate + 'T00:00:00');
            } else { // No end date, no limit date, default to 1 day duration
                effectiveEndDate = new Date(taskStartDate); 
                // Duration is 1 day, so it ends on the same day it starts.
            }
            
            // Ensure effectiveEndDate is not before taskStartDate
            if (effectiveEndDate < taskStartDate) {
                effectiveEndDate = new Date(taskStartDate);
            }

            // For duration calculation, the end of the task bar should be the start of the *next* day
            let effectiveBarEndDateForDurationCalc = new Date(effectiveEndDate);
            effectiveBarEndDateForDurationCalc.setDate(effectiveEndDate.getDate() + 1);

            // Clip task bar to viewable range
            const barActualStart = taskStartDate > viewStartDate ? taskStartDate : viewStartDate;
            const barActualEnd = effectiveBarEndDateForDurationCalc < viewEndDate ? effectiveBarEndDateForDurationCalc : viewEndDate;

            if (barActualStart >= barActualEnd) { // Task is outside the view or has zero duration in view
                // console.log('[Gantt] Task skipped (actualStart >= actualEnd):', task.id, task.name, barActualStart, barActualEnd);
                return;
            }

            const startOffsetDays = (barActualStart - viewStartDate) / (1000 * 60 * 60 * 24);
            let durationDays = (barActualEnd - barActualStart) / (1000 * 60 * 60 * 24);
            
            if (durationDays <= 0) {
                // console.log('[Gantt] Task skipped (duration <= 0 days in view):', task.id, task.name);
                return;
            }

            const taskBarDiv = document.createElement('div');
            taskBarDiv.className = 'gantt-task-bar';
            taskBarDiv.dataset.taskId = task.id;
            
            const barLeft = startOffsetDays * pixelsPerDay;
            let calculatedBarWidth = durationDays * pixelsPerDay;
            
            // Apply 1px gap between bars, ensure min width
            let barWidth = Math.max(calculatedBarWidth - 1, 1); 
            // Enforce a more visible minimum width, but not more than what a single day represents if pixelsPerDay is very small
            barWidth = Math.max(barWidth, Math.min(MIN_BAR_WIDTH_PX, pixelsPerDay > 1 ? pixelsPerDay -1 : pixelsPerDay));


            const barTop = taskVisibleCount * taskRowHeight + taskBarTopMargin;

            taskBarDiv.style.left = `${barLeft}px`;
            taskBarDiv.style.width = `${barWidth}px`;
            taskBarDiv.style.top = `${barTop}px`;
            
            taskBarDiv.textContent = task.name;
            // console.log(`[Gantt] Task: ${task.name}, ID: ${task.id}, StartDate: ${task.startDate}, EndDate (effective): ${effectiveEndDate.toISOString().split('T')[0]}, Bar Left: ${barLeft}px, CalculatedBarWidth: ${calculatedBarWidth}px, FinalBarWidth: ${barWidth}px, Bar Top: ${barTop}px`);
            taskBarDiv.title = `${task.name} (Start: ${task.startDate}, End: ${task.endDate || task.limitDate || task.startDate})`;


            const todayDateObj = new Date(todayData + 'T00:00:00');
            const limitDateObj = task.limitDate ? new Date(task.limitDate + 'T00:00:00') : null;
            const endDateObj = task.endDate ? new Date(task.endDate + 'T00:00:00') : null;

            if (task.status === 'active') {
                if (limitDateObj && limitDateObj < todayDateObj && (!endDateObj || endDateObj >= todayDateObj)) {
                    taskBarDiv.classList.add('gantt-bar-red'); 
                } else if (limitDateObj && limitDateObj >= todayDateObj && limitDateObj <= new Date(todayDateObj.getTime() + 7 * 24 * 60 * 60 * 1000) && (!endDateObj || endDateObj >= todayDateObj)) {
                    taskBarDiv.classList.add('gantt-bar-purple'); 
                } else if (taskStartDate && (!endDateObj || endDateObj >= todayDateObj)) { 
                    taskBarDiv.classList.add('gantt-bar-orange'); 
                } else {
                    taskBarDiv.classList.add('gantt-bar-green'); 
                }
            } else if (task.status === 'ended') {
                 taskBarDiv.classList.add('gantt-bar-grey'); 
            } else { 
                 taskBarDiv.classList.add('gantt-bar-grey');
            }
            
            taskRowsContainerEl.appendChild(taskBarDiv);
            // console.log('[Gantt] Appended task bar for:', task.name, taskBarDiv);
            taskVisibleCount++;
        });

        if (taskVisibleCount === 0 && tasksData.length > 0) {
            // console.log('[Gantt] No tasks were eligible for rendering after filtering (e.g. no startDate, or outside view range).');
            taskRowsContainerEl.innerHTML = '<p style="text-align:center; padding-top:20px;">No tasks with valid start dates within the current view range.</p>';
        }
        taskRowsContainerEl.style.height = `${Math.max(taskVisibleCount * taskRowHeight, taskRowHeight)}px`;
        console.log('[GANTT_DEBUG] Task Rows Container size after render:', taskRowsContainerEl.offsetWidth, taskRowsContainerEl.offsetHeight);
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

    // console.log('[GANTT_DEBUG] Checking conditions to call renderGanttChart().');
    // console.log('[GANTT_DEBUG] typeof tasksData:', typeof tasksData);
    // if (typeof tasksData !== 'undefined') {
    //     console.log('[GANTT_DEBUG] tasksData defined. tasksData.length:', tasksData.length);
    //     console.log('[GANTT_DEBUG] tasksData content at call site:', JSON.parse(JSON.stringify(tasksData)));
    // } else {
    //     console.log('[GANTT_DEBUG] tasksData is undefined at call site.');
    // }
    // console.log('[GANTT_DEBUG] typeof todayData:', typeof todayData);
    //  if (typeof todayData !== 'undefined') {
    //     console.log('[GANTT_DEBUG] todayData content at call site:', todayData);
    // } else {
    //     console.log('[GANTT_DEBUG] todayData is undefined at call site.');
    // }

    if (typeof tasksData !== 'undefined' && tasksData && tasksData.length > 0) {
        // console.log('[GANTT_DEBUG] Condition met: Calling renderGanttChart().');
        renderGanttChart();
    } else {
        // console.warn('[GANTT_DEBUG] Condition NOT met: renderGanttChart() will NOT be called.');
        // ... (detailed reasons) ...
        if(taskRowsContainerEl) {
            taskRowsContainerEl.innerHTML = '<p style="text-align:center; padding-top:20px;">No tasks with start dates to display in Gantt chart (initial check failed).</p>';
        } else {
            // console.error('[GANTT_DEBUG] taskRowsContainerEl not found for displaying initial message.');
        }
    }
});
