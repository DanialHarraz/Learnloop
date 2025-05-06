const taskProgressionEndpoint = '/dashboard/task-progression';
const predictiveTaskCompletionEndpoint = '/dashboard/predict-task-completion';

const fetchTaskProgression = async () => {
    try {
        const response = await fetch(taskProgressionEndpoint);
        console.log(taskProgressionEndpoint)
        const data = await response.json();

        // Log the data to inspect the structure
        console.log(data);

        if (!data.taskLifecycle) {
            throw new Error("taskLifecycle data is missing.");
        }

        
        const lifecycleDiv = document.getElementById('task-lifecycle');
        lifecycleDiv.innerHTML = `
            <h3>Task Lifecycle</h3>
            ${data.taskLifecycle.map(status => `
                <p>${status.status}: ${status._count.status}</p>
            `).join('')}
        `;

       
        const transitionDiv = document.getElementById('task-transition');
        transitionDiv.innerHTML = `
            <h3>Task Transitions</h3>
            <p>Transition from Incomplete to Started: ${data.transitionIncompletedToStarted.toFixed(2)}%</p>
            <p>Transition from Started to Completed: ${data.transitionStartedToCompleted.toFixed(2)}%</p>
        `;

       
        const completionVsEstimatedDiv = document.getElementById('task-completion-vs-estimated');
        completionVsEstimatedDiv.innerHTML = `
            <h3>Task Completion vs Estimated Time</h3>
            ${data.taskCompletionVsEstimated.map(item => `
                <p>${item.status}: ${item.percentage.toFixed(2)}% difference</p>
            `).join('')}
        `;

        // Display task dependency completion rate
        const taskDependencyDiv = document.getElementById('task-dependency-completion');
        taskDependencyDiv.innerHTML = `
            <h3>Task Dependency Completion Rate</h3>
            <p>${data.taskDependencyCompletionRate.toFixed(2)}% of tasks have completed dependencies.</p>
        `;

    } catch (error) {
        console.error("Error fetching task progression data:", error);
    }
};

// Fetch and display predictive task completion data
const fetchPredictiveTaskCompletion = async () => {
    try {
        const response = await fetch(predictiveTaskCompletionEndpoint);
        const data = await response.json();

        const predictionDiv = document.getElementById('completion-prediction');
        predictionDiv.innerHTML = `
            <h3>Completion Prediction</h3>
            <p>Average Estimated Duration: ${data.avgEstimatedTime.toFixed(2)} hours</p>
            <p>Average Completion Duration: ${data.avgCompletionTime.toFixed(2)} hours</p>
            <p>Status: ${data.prediction}</p>
        `;
    } catch (error) {
        console.error("Error predicting task completion:", error);
    }
};

// Initialize the dashboard by fetching data
const initDashboard = () => {
    fetchTaskProgression();
    fetchPredictiveTaskCompletion();
};

// Call the init function when the page loads
window.onload = initDashboard;
