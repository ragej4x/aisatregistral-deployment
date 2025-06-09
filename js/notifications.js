// Global variables to track request state
let currentCalls = [];
let waitingRequests = [];
let rejectedRequests = []; 
let timerIntervals = {}; 
let expiredRequestIds = new Set(); // Track which requests have expired timers

// Function to clear all timer intervals
function clearAllTimers() {
    console.log("Clearing all timers");
    Object.keys(timerIntervals).forEach(key => {
        clearInterval(timerIntervals[key]);
    });
    timerIntervals = {};
}

// Add this function to reset timer data in localStorage
function clearExpiredTimerData() {
    console.log("Clearing expired timer data from localStorage");
    try {
        // Clear any cached timer data
        localStorage.removeItem('expiredRequests');
        localStorage.removeItem('timerStates');
        expiredRequestIds.clear();
        console.log("Expired timer data cleared");
    } catch (e) {
        console.error("Error clearing expired timer data:", e);
    }
}

// Add this function to reset notification state
function resetNotificationState() {
    console.log("Resetting notification state");
    try {
        clearAllTimers();
        clearExpiredTimerData();
        currentCalls = [];
        waitingRequests = [];
        rejectedRequests = [];
        
        // Clear displays if elements exist
        const currentCallsList = document.getElementById('currentCallsList');
        const waitingListContainer = document.getElementById('waitingListContainer');
        
        if (currentCallsList) {
            currentCallsList.innerHTML = '<div class="no-requests">No active calls at the moment</div>';
        }
        if (waitingListContainer) {
            waitingListContainer.innerHTML = '<div class="no-requests">No requests in the waiting list</div>';
        }
        
        console.log("Notification state reset successful");
    } catch (e) {
        console.error("Error resetting notification state:", e);
    }
}

// Make openNotificationsModal function globally accessible from the start
window.openNotificationsModal = function() {
    console.log("Global openNotificationsModal function called");
    const notificationsModal = document.getElementById('notificationsModal');
    if (!notificationsModal) {
        console.error("Cannot find notifications modal element");
        return;
    }
    
    notificationsModal.style.display = 'block';
    
    // Check if we need to do a full refresh
    const newRequestSubmitted = localStorage.getItem('newRequestSubmitted') === 'true';
    if (newRequestSubmitted) {
        console.log("New request was submitted, performing full refresh");
        localStorage.removeItem('newRequestSubmitted'); // Clear the flag
        
        // Clear cached data
        currentCalls = [];
        waitingRequests = [];
        rejectedRequests = []; 
        clearAllTimers();
    }
    
    // Always update notifications
    if (typeof updateNotifications === 'function') {
        updateNotifications();
    } else {
        console.error("updateNotifications function not available");
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("Notifications.js - Document ready event fired");
    
    const notifButton = document.getElementById('notif');
    const notificationsModal = document.getElementById('notificationsModal');
    const closeNotificationsModal = document.getElementById('closeNotificationsModal');
    const currentCallsList = document.getElementById('currentCallsList');
    const waitingListContainer = document.getElementById('waitingListContainer');
    
    // Add debug logging for the notification button element
    console.log("Notification button element:", notifButton);
    console.log("Notifications modal element:", notificationsModal);
    
    // Make sure all elements exist before setting up event listeners
    if (!notifButton) {
        console.error("Notification button not found - will try again on DOMContentLoaded");
    }
    
    if (!notificationsModal) {
        console.error("Notifications modal not found - will try again on DOMContentLoaded");
    }
    
    // Define the event handler function separately so we can reuse it
    function handleNotificationButtonClick(event) {
        console.log("Notification button clicked");
        if (event) event.preventDefault();
        
        if (!notificationsModal) {
            console.error("Cannot open notifications modal - element not found");
            return;
        }
        
        if (checkUserAuthentication()) {
            console.log("User authenticated, opening notifications modal");
            window.openNotificationsModal();
        } else {
            console.log("User not authenticated, cannot open notifications");
        }
    }
    
    // Set up the click handler if elements exist
    if (notifButton) {
        console.log("Setting up notification button click handler");
        notifButton.addEventListener('click', handleNotificationButtonClick);
    }
    
    if (closeNotificationsModal) {
        closeNotificationsModal.addEventListener('click', closeModal);
    } else {
        console.error("Close notifications modal button not found");
    }
    
    // Setup window click handler for closing modal
    if (notificationsModal) {
        window.addEventListener('click', function(event) {
            if (event.target === notificationsModal) {
                closeModal();
            }
        });
    }
    
    // Backup initialization on DOMContentLoaded to ensure UI elements are loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("Notifications.js - DOMContentLoaded event fired");
        
        // Try to get elements again if they weren't found before
        const notifButtonRetry = notifButton || document.getElementById('notif');
        const notificationsModalRetry = notificationsModal || document.getElementById('notificationsModal');
        const closeNotificationsModalRetry = closeNotificationsModal || document.getElementById('closeNotificationsModal');
        
        console.log("Notification button (retry):", notifButtonRetry);
        console.log("Notifications modal (retry):", notificationsModalRetry);
        
        // Set up event handlers if elements were found on retry
        if (notifButtonRetry && !notifButtonRetry._hasNotificationClickHandler) {
            console.log("Setting up notification button click handler (retry)");
            notifButtonRetry.addEventListener('click', handleNotificationButtonClick);
            notifButtonRetry._hasNotificationClickHandler = true;
        }
        
        if (closeNotificationsModalRetry && !closeNotificationsModalRetry._hasClickHandler) {
            closeNotificationsModalRetry.addEventListener('click', closeModal);
            closeNotificationsModalRetry._hasClickHandler = true;
        }
    });
    
    // Last resort - direct handler on the actual element
    setTimeout(function() {
        const finalNotifButton = document.getElementById('notif');
        if (finalNotifButton && !finalNotifButton._hasNotificationClickHandler) {
            console.log("Setting up notification button click handler (last resort)");
            finalNotifButton.addEventListener('click', handleNotificationButtonClick);
            finalNotifButton._hasNotificationClickHandler = true;
        }
    }, 1000);

    const baseUrl = 'https://jimboyaczon.pythonanywhere.com';
    
    // Check if this is a fresh login
    const freshLogin = localStorage.getItem('freshLogin') === 'true';
    if (freshLogin) {
        console.log("Fresh login detected, clearing notification state");
        localStorage.removeItem('freshLogin');
        localStorage.removeItem('hadActiveRequests');
        localStorage.removeItem('expiredRequests');
        localStorage.removeItem('timerStates');
        
        // Clear any cached request data
        currentCalls = [];
        waitingRequests = [];
        rejectedRequests = [];
        expiredRequestIds.clear();
        clearAllTimers();
    } else {
        // Not a fresh login, load any saved expired timer data
        loadExpiredTimerData();
    }
    
    function checkUserAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
            console.log('User not logged in, redirecting to login');
            window.location.replace('index.html');
            return false;
        }
        return true;
    }
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function isRequestRejected(requestId) {
        return rejectedRequests.some(req => req.id === requestId);
    }
    
    function calculateRemainingTime(timestamp) {
        if (!timestamp) return { minutes: 0, seconds: 0, total: 0 };
        
        try {
            // Enhanced logging to debug timestamp issues
            console.log('Original timestamp received:', timestamp);
            
            // Check if timer is already marked as expired
            const requestId = arguments[1] || 'unknown'; // Optional requestId param
            if (expiredRequestIds.has(requestId)) {
                console.log(`Timer for request ${requestId} was previously marked as expired`);
                return { minutes: 0, seconds: 0, total: 0 };
            }
            
            // Parse the timestamp string into a date object
            const callTime = new Date(timestamp);
            const now = new Date();
        
            // Log the parsed time and current time for comparison
            console.log('Parsed call time:', callTime.toISOString());
            console.log('Current time:', now.toISOString());
            
            // Check if the timestamp is valid
            if (isNaN(callTime.getTime())) {
                console.error('Invalid timestamp format:', timestamp);
                if (requestId !== 'unknown') {
                    expiredRequestIds.add(requestId);
                }
                return { minutes: 0, seconds: 0, total: 0 };
            }
            
            // Get the server's timer_active duration (10 minutes in milliseconds)
            const TIMER_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
            
            // Calculate expiry time (10 minutes from call time)
            const expiryTime = new Date(callTime.getTime() + TIMER_DURATION);
            
            // Calculate remaining milliseconds
            const remainingMs = expiryTime - now;
            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
            
            // If expired, mark it in our tracking set
            if (remainingSeconds <= 0 && requestId !== 'unknown') {
                expiredRequestIds.add(requestId);
            }
            
            // Fix for 2025 timestamp issue - if the date is in the future by more than a day,
            // the timer is likely expired due to server/client time mismatch
            if (callTime > now && (callTime - now) > 24 * 60 * 60 * 1000) {
                console.warn('Future timestamp detected - likely a server/client time mismatch');
                // Check if less than 10 minutes have passed since timestamp was created
                // by comparing just the minute and second components
                const callMinutes = callTime.getMinutes();
                const callSeconds = callTime.getSeconds();
                const nowMinutes = now.getMinutes();
                const nowSeconds = now.getSeconds();
                
                // Calculate time elapsed in seconds, wrapping around hour boundaries
                let elapsedSeconds = (nowMinutes * 60 + nowSeconds) - (callMinutes * 60 + callSeconds);
                if (elapsedSeconds < 0) elapsedSeconds += 3600; // Add an hour if we wrapped around
                
                // If less than 10 minutes have passed, show remaining time
                if (elapsedSeconds < 600) {
                    const adjustedRemaining = 600 - elapsedSeconds;
                    console.log(`Adjusted remaining time: ${adjustedRemaining}s based on minute/second comparison`);
                    return {
                        minutes: Math.floor(adjustedRemaining / 60),
                        seconds: adjustedRemaining % 60,
                        total: adjustedRemaining
                    };
                } else {
                    // Mark as expired
                    if (requestId !== 'unknown') {
                        expiredRequestIds.add(requestId);
                    }
                }
            }
            
            console.log(`Timer details: expiry=${expiryTime.toISOString()}, remaining=${remainingSeconds}s, difference=${Math.floor((expiryTime - callTime)/1000)}s`);
        
            return {
                minutes: Math.floor(remainingSeconds / 60),
                seconds: remainingSeconds % 60,
                total: remainingSeconds
            };
        } catch (e) {
            console.error('Error calculating remaining time:', e, 'for timestamp:', timestamp);
            return { minutes: 0, seconds: 0, total: 0 };
        }
    }
    
    function startTimer(requestId, element, timestamp) {
        // Clear any existing timer for this request
        if (timerIntervals[requestId]) {
            console.log(`Clearing existing timer for request ${requestId}`);
            clearInterval(timerIntervals[requestId]);
            delete timerIntervals[requestId];
        }
        
        // If this timer was previously marked as expired, reset it
        if (expiredRequestIds.has(requestId)) {
            console.log(`Resetting expired state for request ${requestId}`);
            expiredRequestIds.delete(requestId);
        }
        
        // Log detailed timer initialization
        console.log(`Starting new timer for request ${requestId} with timestamp: ${timestamp}`);
        
        // Initial update of the timer display
        updateTimerDisplay(requestId, element, timestamp);
        
        // Set up regular updates every second
        timerIntervals[requestId] = setInterval(function() {
            updateTimerDisplay(requestId, element, timestamp);
        }, 1000);
        
        console.log(`Timer interval started for request ${requestId}`);
    }
    
    function updateTimerDisplay(requestId, element, timestamp) {
        const time = calculateRemainingTime(timestamp, requestId);
        console.log(`Updating timer display for request ${requestId}: time remaining: ${time.total}s`);
        
        if (time.total <= 0 || expiredRequestIds.has(requestId)) {
            element.textContent = "Time expired";
            element.className = "request-timer expired";
            console.log(`Timer for request ${requestId} has expired or is invalid`);
            
            // Mark this timer as expired
            expiredRequestIds.add(requestId);
            
            if (timerIntervals[requestId]) {
                clearInterval(timerIntervals[requestId]);
                delete timerIntervals[requestId];
                console.log(`Cleared timer interval for expired request ${requestId}`);
            }
            
            // Save expired state to localStorage
            try {
                const expiredRequests = JSON.parse(localStorage.getItem('expiredRequests') || '[]');
                if (!expiredRequests.includes(requestId)) {
                    expiredRequests.push(requestId);
                    localStorage.setItem('expiredRequests', JSON.stringify(expiredRequests));
                }
            } catch (e) {
                console.error('Error saving expired request to localStorage:', e);
            }
            
            return;
        }
        
        const timerText = `${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
        element.textContent = timerText;
        
        if (time.total < 60) {
            element.className = "request-timer urgent";
            console.log(`Timer for request ${requestId} is in urgent state (< 1 min)`);
        } else if (time.total < 180) {
            element.className = "request-timer warning";
            console.log(`Timer for request ${requestId} is in warning state (< 3 min)`);
        } else {
            element.className = "request-timer normal";
        }
    }
    
    function fetchCurrentCalls() {
        return new Promise((resolve, reject) => {
            fetch(`${baseUrl}/api/display/current-calls`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                // Check for duplicate request IDs in the data from server
                const requestIds = new Set();
                const duplicates = new Set();
                
                result.forEach(call => {
                    if (requestIds.has(call.request_id)) {
                        duplicates.add(call.request_id);
                    } else {
                        requestIds.add(call.request_id);
                    }
                });
                
                if (duplicates.size > 0) {
                    console.warn('Duplicate request IDs in current-calls response:', Array.from(duplicates));
                }
                
                currentCalls = result;
                resolve(result);
            })
            .catch(err => {
                console.error('Failed to fetch current calls:', err);
                reject(err);
            });
        });
    }
    
    function fetchPendingRequests() {
        return new Promise((resolve, reject) => {
            fetch(`${baseUrl}/api/requests/pending`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                waitingRequests = result;
                resolve(result);
            })
            .catch(err => {
                console.error('Failed to fetch pending requests:', err);
                reject(err);
            });
        });
    }
    
    function fetchRejectedRequests() {
        return new Promise((resolve, reject) => {
            fetch(`${baseUrl}/api/requests/rejected`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                rejectedRequests = result;
                resolve(result);
            })
            .catch(err => {
                console.error('Failed to fetch rejected requests:', err);
                reject(err);
            });
        });
    }
    
    function showTimerStatus(call) {
        // Always log the call object to debug timer issues
        console.log('Timer status check for call:', JSON.stringify(call));
        
        // Check if timer is active from server response
        if (call.timer_active === true || call.timer_timestamp) {
            // Use timer_timestamp first, fall back to timestamp if needed
            const timestamp = call.timer_timestamp || call.timestamp;
            console.log('Using timestamp for timer calculation:', timestamp);
            
            // Ensure we have a valid timestamp before proceeding
            if (!timestamp) {
                console.error('No valid timestamp provided for timer');
                return {
                    show: false,
                    statusText: ""
                };
            }
            
            const time = calculateRemainingTime(timestamp);
            
            // If there's a timestamp but time has expired, still show as expired
            if (time.total <= 0) {
                console.log('Timer has expired based on calculation');
                return {
                    show: true,
                    statusText: "Auto-rejection timer:",
                    expired: true
                };
            }
            
            console.log('Timer is active with remaining seconds:', time.total);
            return {
                show: true,
                statusText: "Auto-rejection in:",
                expired: false
            };
        }
        
        console.log('No active timer detected for this call');
        return {
            show: false,
            statusText: ""
        };
    }
    
    function renderCurrentCalls() {
        clearAllTimers();
        
        currentCallsList.innerHTML = '';
        
        if (!currentCalls || currentCalls.length === 0) {
            currentCallsList.innerHTML = '<div class="no-requests">No active calls at the moment</div>';
            return;
        }
        
        const userData = localStorage.getItem('userData');
        let userRequestId = null;
        let userId = null;
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                userRequestId = user.id;
                userId = user.idno;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        const activeCurrentCalls = currentCalls.filter(call => !isRequestRejected(call.request_id));
        
        if (activeCurrentCalls.length === 0) {
            currentCallsList.innerHTML = '<div class="no-requests">No active calls at the moment</div>';
            return;
        }
        
        // Track unique request IDs to prevent duplicates
        const processedRequestIds = new Set();
        
        activeCurrentCalls.forEach(call => {
            // Skip if we've already processed this request ID
            if (processedRequestIds.has(call.request_id)) {
                console.log(`Skipping duplicate call for request ID: ${call.request_id}`);
                return;
            }
            
            // Add to processed set
            processedRequestIds.add(call.request_id);
            
            const callItem = document.createElement('div');
            callItem.className = 'request-item active-call';
            const isUserRequest = userId && call.idno === userId;
            
            const displayRequestId = call.request_id_display || 'Unknown';
            
            callItem.innerHTML = `
                <div class="request-id">Request ID: ${displayRequestId}</div>
            `;
            
            // Check if timer is active
            const timerStatus = showTimerStatus(call);
            
            if (timerStatus.show) {
                // Add timer status label
                const timerStatusElement = document.createElement('div');
                timerStatusElement.className = 'timer-status';
                timerStatusElement.textContent = timerStatus.statusText;
                callItem.appendChild(timerStatusElement);
                
                // Add timer element
                const timerElement = document.createElement('div');
                timerElement.className = 'request-timer';
                callItem.appendChild(timerElement);
                
                // Use timer_timestamp first, fall back to timestamp if needed
                const timerTimestamp = call.timer_timestamp || call.timestamp;
                console.log(`Starting timer for ${displayRequestId} with timestamp: ${timerTimestamp}`);
                
                // Special handling for 2025 dates to fix the timestamp issue
                if (timerTimestamp && timerTimestamp.includes('2025')) {
                    console.log('Detected future year timestamp - handling special case');
                    
                    // Extract just the time part of the timestamp for comparison
                    const timestampDate = new Date(timerTimestamp);
                    const now = new Date();
                    
                    // Calculate seconds elapsed since the timestamp was created
                    // using just minutes and seconds for more reliable comparison
                    const timestampMinutes = timestampDate.getMinutes();
                    const timestampSeconds = timestampDate.getSeconds();
                    const nowMinutes = now.getMinutes();
                    const nowSeconds = now.getSeconds();
                    
                    let elapsedSeconds = (nowMinutes * 60 + nowSeconds) - (timestampMinutes * 60 + timestampSeconds);
                    if (elapsedSeconds < 0) elapsedSeconds += 3600; // Add an hour if we wrapped around
                    
                    // If less than 10 minutes have passed, show remaining time
                    if (elapsedSeconds < 600) {
                        const remainingSeconds = 600 - elapsedSeconds;
                        const minutes = Math.floor(remainingSeconds / 60);
                        const seconds = remainingSeconds % 60;
                        
                        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        if (remainingSeconds < 60) {
                            timerElement.className = "request-timer urgent";
                        } else if (remainingSeconds < 180) {
                            timerElement.className = "request-timer warning";
                        } else {
                            timerElement.className = "request-timer normal";
                        }
                        
                        // Set up timer updates
                        const updateTimerId = setInterval(() => {
                            const now = new Date();
                            const nowMinutes = now.getMinutes();
                            const nowSeconds = now.getSeconds();
                            
                            let newElapsedSeconds = (nowMinutes * 60 + nowSeconds) - (timestampMinutes * 60 + timestampSeconds);
                            if (newElapsedSeconds < 0) newElapsedSeconds += 3600;
                            
                            if (newElapsedSeconds < 600) {
                                const newRemainingSeconds = 600 - newElapsedSeconds;
                                const newMinutes = Math.floor(newRemainingSeconds / 60);
                                const newSeconds = newRemainingSeconds % 60;
                                
                                timerElement.textContent = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
                                
                                if (newRemainingSeconds < 60) {
                                    timerElement.className = "request-timer urgent";
                                } else if (newRemainingSeconds < 180) {
                                    timerElement.className = "request-timer warning";
                                } else {
                                    timerElement.className = "request-timer normal";
                                }
                            } else {
                                timerElement.textContent = "Time expired";
                                timerElement.className = "request-timer expired";
                                clearInterval(updateTimerId);
                            }
                        }, 1000);
                        
                        // Store the timer ID for cleanup
                        timerIntervals[call.request_id] = updateTimerId;
                    } else {
                        timerElement.textContent = "";
                        timerElement.className = "request-timer expired";
                    }
                } else {
                    // Normal timer handling with startTimer function
                    startTimer(call.request_id, timerElement, timerTimestamp);
                    
                    // If already expired, just show expired state immediately
                    if (timerStatus.expired) {
                        console.log(`Timer for ${displayRequestId} is already expired`);
                        timerElement.textContent = "Time expired";
                        timerElement.className = "request-timer expired";
                    }
                }
            } else {
                // Add "waiting" placeholder when no timer is active
                const timerElement = document.createElement('div');
                timerElement.className = 'request-timer inactive';
                timerElement.textContent = "Waiting";
                callItem.appendChild(timerElement);
            }
            
            if (isUserRequest) {
                const yourRequestElem = document.createElement('div');
                yourRequestElem.className = 'your-request';
                yourRequestElem.textContent = '(Your request)';
                callItem.appendChild(yourRequestElem);
            }
            
            currentCallsList.appendChild(callItem);
        });
    }
    
    function renderWaitingList() {
        waitingListContainer.innerHTML = '';
        
        if (!waitingRequests || waitingRequests.length === 0) {
            waitingListContainer.innerHTML = '<div class="no-requests">No requests in the waiting list</div>';
            return;
        }
        
        const userData = localStorage.getItem('userData');
        let userRequestId = null;
        let userId = null;
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                userRequestId = user.id;
                userId = user.idno;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        const calledRequestIds = new Map();
        if (currentCalls && currentCalls.length > 0) {
            currentCalls.forEach(call => {
                calledRequestIds.set(call.request_id, call);
            });
        }
        
        const activeWaitingRequests = waitingRequests.filter(req => !isRequestRejected(req.id));
        
        if (activeWaitingRequests.length === 0) {
            waitingListContainer.innerHTML = '<div class="no-requests">No requests in the waiting list</div>';
            return;
        }
        
        // Track unique request IDs to prevent duplicates
        const processedRequestIds = new Set();
        
        activeWaitingRequests.forEach(request => {
            const requestId = request.id;
            
            // Skip if we've already processed this request ID
            if (processedRequestIds.has(requestId)) {
                console.log(`Skipping duplicate waiting request ID: ${requestId}`);
                return;
            }
            
            // Add to processed set
            processedRequestIds.add(requestId);
            
            const isUserRequest = userId && request.idno === userId;
            
            const isBeingCalled = calledRequestIds.has(requestId);
            
            if (isBeingCalled) {
                return;
            }
            
            const displayRequestId = request.request_id || `RE-${String(requestId).padStart(4, '0')}`;
            
            const requestItem = document.createElement('div');
            requestItem.className = 'request-item' + (isUserRequest ? ' your-request-item' : '');
            
            requestItem.innerHTML = `
                <div class="request-id">Request ID: ${displayRequestId}</div>
                <div class="request-time">${
                    request.schedule ? formatTime(request.schedule) : 'Waiting'
                }</div>
            `;
            
            if (isUserRequest) {
                requestItem.innerHTML += '<div class="your-request">(Your request)</div>';
            }
            
            waitingListContainer.appendChild(requestItem);
        });
    }
    
    function updateNotifications() {
        if (!currentCallsList || !waitingListContainer) {
            console.error("Cannot update notifications - DOM elements not found");
            return;
        }
        
        currentCallsList.innerHTML = '<div class="loading-indicator">Loading current calls...</div>';
        waitingListContainer.innerHTML = '<div class="loading-indicator">Loading waiting list...</div>';
        
        Promise.all([fetchCurrentCalls(), fetchPendingRequests(), fetchRejectedRequests()])
            .then(() => {
                renderCurrentCalls();
                renderWaitingList();
                
                // Check if the user's requests have been completed
                checkForCompletedRequests();
            })
            .catch(error => {
                currentCallsList.innerHTML = '<div class="no-requests">Error loading data</div>';
                waitingListContainer.innerHTML = '<div class="no-requests">Error loading data</div>';
                console.error('Error updating notifications:', error);
            });
    }
    
    // Make updateNotifications function globally accessible
    window.updateNotifications = updateNotifications;
    
    // Local implementation of openNotificationsModal
    function openNotificationsModal() {
        console.log("Local openNotificationsModal function called");
        notificationsModal.style.display = 'block';
        
        // Check if we need to do a full refresh
        const newRequestSubmitted = localStorage.getItem('newRequestSubmitted') === 'true';
        if (newRequestSubmitted) {
            console.log("New request was submitted, performing full refresh");
            localStorage.removeItem('newRequestSubmitted'); // Clear the flag
            
            // Clear cached data
            currentCalls = [];
            waitingRequests = [];
            rejectedRequests = []; 
            clearAllTimers();
        }
        
        // Always update notifications
        updateNotifications();
    }
    
    // Update the global version with the local version that has access to all variables
    window.openNotificationsModal = openNotificationsModal;
    
    function closeModal() {
        notificationsModal.style.display = 'none';
        clearAllTimers();
    }
    
    setInterval(function() {
        if (notificationsModal.style.display === 'block') {
            updateNotifications();
        }
    }, 5000);
    
    console.log("Notifications.js - Initialization complete");
    
    // Load any saved expired timer data
    function loadExpiredTimerData() {
        try {
            const expiredRequests = JSON.parse(localStorage.getItem('expiredRequests') || '[]');
            console.log("Loading expired timer data from localStorage:", expiredRequests);
            
            // Add each expired request ID to our tracking set
            expiredRequests.forEach(id => {
                if (id) {
                    expiredRequestIds.add(id);
                    console.log(`Marked request ${id} as previously expired`);
                }
            });
        } catch (e) {
            console.error("Error loading expired timer data:", e);
        }
    }
});

// Add this function to reset user data to default state
function resetUserRequestData() {
    console.log("Resetting user request data to default state");
    
    // Get current user data
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        
        // Create a clean version of user data with request fields reset
        const cleanUserData = {
            ...user,
            // Reset request-related fields to null/default
            request_id: null,
            status: null,
            payment: null,
            method: null
        };
        
        // Save the clean user data back to localStorage
        localStorage.setItem('userData', JSON.stringify(cleanUserData));
        console.log("User data reset to default state:", cleanUserData);
        
        // Also reset any cached registration data
        if (window.registrationData) {
            window.registrationData = { details: {} };
            console.log("Cleared registration data cache");
        }
    } catch (e) {
        console.error("Error resetting user data:", e);
    }
}

// Modify this function to reset user data when requests are completed
function checkForCompletedRequests() {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const userId = user.idno;
        
        // Check if user has any active requests
        const hasActiveRequests = currentCalls.some(call => call.idno === userId) || 
                                 waitingRequests.some(req => req.idno === userId);
        
        // If user had requests before and now has none, reset state
        if (!hasActiveRequests && (localStorage.getItem('hadActiveRequests') === 'true')) {
            console.log("User's requests have all been processed, resetting state");
            localStorage.setItem('hadActiveRequests', 'false');
            
            // Reset notification state
            resetNotificationState();
            
            // Also reset user's request data to default state
            resetUserRequestData();
        }
        
        // If user has active requests, mark this state
        if (hasActiveRequests) {
            localStorage.setItem('hadActiveRequests', 'true');
        }
    } catch (e) {
        console.error("Error checking for completed requests:", e);
    }
} 