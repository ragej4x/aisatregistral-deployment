document.addEventListener('DOMContentLoaded', function() {
    console.log("Payment form - Document ready event fired");
    
    const API_BASE_URL = "https://jimboyaczon.pythonanywhere.com";
    
    // Define the payment form function globally and attach to window
    window.showPaymentForm = function(paymentType) {
        console.log("Showing payment form for type:", paymentType);
        
        try {
            // Hide the payment type selection screen
            const part6Element = document.querySelector('.part6');
            if (part6Element) {
                part6Element.style.display = 'none';
            } else {
                console.error("Part6 element not found");
            }
            
            // Ensure the registration data object exists
            if (!window.registrationData) {
                console.error("registrationData object not found, creating new one");
                window.registrationData = {
                    details: {},
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().substring(0, 5)
                };
            }
            
            if (!window.registrationData.details) {
                window.registrationData.details = {};
            }
            
            // Set the payment method (fullpayment or installment)
            window.registrationData.details.method = paymentType === 'full' ? 'fullpayment' : 'installment';
            console.log("Set payment method to:", window.registrationData.details.method);
            
            window.registrationData.details.status = 'pending';
            
            console.log("Payment type selected:", paymentType);
            console.log("Registration data:", window.registrationData);
            
            // Show the receipt with a slight delay to ensure DOM is ready
            setTimeout(function() {
                try {
                    // Just prepare the data and show receipt without submitting
                    prepareRequestAndShowReceipt();
                } catch (e) {
                    console.error("Error showing receipt:", e);
                    alert("There was a problem displaying the receipt. Please try again.");
                    
                    // Fallback - try calling showReceipt directly with minimal data
                    tryFallbackReceipt(paymentType);
                }
            }, 100);
        } catch (error) {
            console.error("Error in showPaymentForm:", error);
            alert("There was an error processing your selection. Please try again.");
        }
    };
    
    // Fallback function if normal flow fails
    function tryFallbackReceipt(paymentType) {
        console.log("Trying fallback receipt display");
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            // Create minimal data needed for receipt
            const fallbackData = {
                details: {
                    name: userData.name || 'N/A',
                    id: userData.idno || 'N/A',
                    idno: userData.idno || 'N/A',
                    level: userData.level || 'N/A',
                    course: userData.course || 'N/A',
                    track: userData.course || 'N/A',
                    method: paymentType === 'full' ? 'fullpayment' : 'installment',
                    payment: window.registrationData?.details?.payment || 'regular',
                    status: 'pending'
                },
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().substring(0, 5)
            };
            
            if (typeof window.showReceipt === 'function') {
                window.showReceipt(fallbackData);
                console.log("Fallback receipt displayed");
            } else {
                console.error("showReceipt function not available for fallback");
                alert("Receipt function not available. Please restart the app and try again.");
            }
        } catch (e) {
            console.error("Error in fallback receipt:", e);
            alert("Could not display receipt. Please restart the app and try again.");
        }
    }
    
    function prepareRequestAndShowReceipt() {
        console.log("Preparing request data and showing receipt");
        
        try {
            // Explicitly hide the payment options screen first
            const part6Element = document.querySelector('.part6');
            if (part6Element) {
                part6Element.style.display = 'none';
            }
            
            // Get user data for context
            let userData = null;
            try {
                userData = JSON.parse(localStorage.getItem('userData') || '{}');
            } catch (e) {
                console.error('Error parsing user data:', e);
                userData = {};
            }

            // Make sure we have registration data
            if (!window.registrationData.details) {
                window.registrationData.details = {};
            }

            // Ensure track field has a valid value
            if (!window.registrationData.details.track || window.registrationData.details.track.trim() === '') {
                // Try to get track from userData
                if (userData.course) {
                    window.registrationData.details.track = userData.course;
                    console.log("Using course from user data as track:", userData.course);
                } else if (userData.strand) {
                    window.registrationData.details.track = userData.strand;
                    console.log("Using strand from user data as track:", userData.strand);
                } else {
                    // Set a default value
                    const level = userData.level || window.registrationData.details.level || '';
                    window.registrationData.details.track = level === 'SHS' ? 'General Academic Strand' : 'Bachelor of Science in Information Technology';
                    console.log("Using specific default track value:", window.registrationData.details.track);
                }
            }

            // Make sure we have a payment type set
            if (!window.registrationData.details.payment) {
                window.registrationData.details.payment = window.registrationData.payment || 'Regular';
                console.log("Setting payment type:", window.registrationData.details.payment);
            }
            
            // Get ID number from user data if not already set
            if (!window.registrationData.details.idno) {
                window.registrationData.details.idno = userData.idno || '';
                console.log("Setting ID number from user data:", window.registrationData.details.idno);
            }

            // IMPORTANT: Don't generate an actual request ID yet - this will be done when submitting
            // Let receipt.js handle the temporary display ID
            
            // Prepare post data - without actually creating a formal request ID yet
            window.registrationData.postData = {
                idno: window.registrationData.details.idno || userData.idno || '',
                // request_id will be generated when actually submitting
                track: window.registrationData.details.track, // This will now have a value
                // Always provide a default section value since server requires it
                section: window.registrationData.details.section || userData.section || "Default", 
                student_id: window.registrationData.details.idno || userData.idno || '',
                schedule: `${window.registrationData.date} ${window.registrationData.time}:00`,
                method: window.registrationData.details.method,
                payment: window.registrationData.details.payment,
                status: 'pending'
            };
            
            console.log("Prepared request data:", window.registrationData.postData);
            
            // Now just show the receipt without sending data
            // The receipt.js file will handle the actual submission when Done is clicked
            showReceiptDirectly(window.registrationData);
        } catch (error) {
            console.error("Error in prepareRequestAndShowReceipt:", error);
            alert("There was an error processing your selection. Please try again.");
        }
    }
    
    // Helper function to directly display receipt without stopping execution
    function showReceiptDirectly(registrationData) {
        try {
            if (typeof window.showReceipt === 'function') {
                console.log("Displaying receipt for request:", registrationData);
                window.showReceipt(registrationData);
                console.log("Receipt displayed successfully");
            } else {
                console.error("showReceipt function not found");
                alert("Receipt could not be displayed. Please try again.");
            }
        } catch (e) {
            console.error("Failed to display receipt:", e);
            alert("There was an issue displaying the receipt. Please try again.");
        }
    }
    
    // Make this function available globally so receipt.js can use it
    window.submitRequestToServer = function(registrationData) {
        console.log("submitRequestToServer called with data:", JSON.stringify(registrationData));
        
        // Handle the case where we might receive different data formats
        let dataToSubmit = registrationData;
        
        // If we don't have postData on this object, check if it's the direct currentRequestData from receipt.js
        if (!dataToSubmit.postData) {
            console.log("No postData found, using window.registrationData instead");
            dataToSubmit = window.registrationData;
            
            if (!dataToSubmit || !dataToSubmit.postData) {
                console.error("No valid registration data available");
                alert("Cannot submit: Missing registration data");
                return false;
            }
        }
        
        // CRITICAL: Copy requestID from details to postData.request_id if it exists but postData.request_id doesn't
        if (dataToSubmit.details && dataToSubmit.details.requestID && 
            (!dataToSubmit.postData.request_id || dataToSubmit.postData.request_id === '')) {
            dataToSubmit.postData.request_id = dataToSubmit.details.requestID;
            console.log("Copied request ID from details to postData:", dataToSubmit.postData.request_id);
        }
        
        // Ensure payment field is properly set (express, regular, or priority)
        // This field is displayed in the "Method" column in the admin panel
        let paymentValue = '';
        if (dataToSubmit.details && dataToSubmit.details.payment) {
            paymentValue = dataToSubmit.details.payment;
        } else if (dataToSubmit.payment) {
            paymentValue = dataToSubmit.payment;
        } else {
            // Default to 'regular' if missing
            paymentValue = 'regular';
        }
        
        // Normalize payment value - CRITICAL FIX FOR METHOD COLUMN
        if (paymentValue.toLowerCase() === 'promissory') {
            paymentValue = 'regular';
        }
        
        // Convert to lowercase to ensure consistency
        paymentValue = paymentValue.toLowerCase();
        
        // Validate that it's one of the expected values
        if (!['priority', 'express', 'regular'].includes(paymentValue)) {
            console.warn(`Invalid payment value: ${paymentValue}, defaulting to 'regular'`);
            paymentValue = 'regular';
        }
        
        // CRITICAL: Set the normalized payment value - THIS IS WHAT SHOWS IN THE METHOD COLUMN
        dataToSubmit.postData.payment = paymentValue;
        console.log("Set payment field to:", dataToSubmit.postData.payment);
        
        // Double-check the payment field value
        console.log("FINAL PAYMENT CHECK - value that will appear in Method column:", dataToSubmit.postData.payment);
        
        // Ensure method field is correctly set (fullpayment or installment)
        let methodValue = '';
        if (dataToSubmit.details && dataToSubmit.details.method) {
            methodValue = dataToSubmit.details.method;
        } else if (dataToSubmit.method) {
            methodValue = dataToSubmit.method;
        } else {
            // Default to 'fullpayment' if missing
            methodValue = 'fullpayment';
        }
        
        // Normalize method value
        if (methodValue === 'full') {
            methodValue = 'fullpayment';
        } else if (methodValue === 'partial') {
            methodValue = 'installment';
        } else if (!methodValue || methodValue === '') {
            methodValue = 'fullpayment';
        }
        
        // Set the normalized method value - CRITICAL FIX
        dataToSubmit.postData.method = methodValue;
        console.log("Set method field to:", dataToSubmit.postData.method);
        
        // DOUBLE CHECK: Log method field to verify it's set
        console.log("FINAL METHOD CHECK - method value in postData:", dataToSubmit.postData.method);
        
        // Get user data for extra context
        let userData = null;
        try {
            userData = JSON.parse(localStorage.getItem('userData') || '{}');
        } catch (e) {
            console.error('Error parsing user data:', e);
            userData = {};
        }
        
        // Make sure all required fields are present
        if (!dataToSubmit.postData.idno || dataToSubmit.postData.idno === '') {
            // Try to get ID from both idno and id fields (calendar.js uses 'id')
            dataToSubmit.postData.idno = dataToSubmit.details?.idno || 
                                        dataToSubmit.details?.id || 
                                        userData.idno || '';
            console.log("Setting missing idno from details/userData:", dataToSubmit.postData.idno);
        }
        
        if (!dataToSubmit.postData.student_id || dataToSubmit.postData.student_id === '') {
            dataToSubmit.postData.student_id = dataToSubmit.postData.idno;
            console.log("Setting student_id to match idno:", dataToSubmit.postData.student_id);
        }
        
        if (!dataToSubmit.postData.payment || dataToSubmit.postData.payment === '') {
            dataToSubmit.postData.payment = dataToSubmit.details?.payment || dataToSubmit.payment || 'regular';
            console.log("Setting missing payment from details:", dataToSubmit.postData.payment);
        }
        
        // CRITICAL FIX: Make sure track field is never empty
        if (!dataToSubmit.postData.track || dataToSubmit.postData.track.trim() === '') {
            // First try to get it from details
            if (dataToSubmit.details && dataToSubmit.details.track && dataToSubmit.details.track.trim() !== '') {
                dataToSubmit.postData.track = dataToSubmit.details.track;
                console.log("Setting track from details:", dataToSubmit.postData.track);
            } 
            // Then try course or strand from userData
            else if (userData.course && userData.course.trim() !== '') {
                dataToSubmit.postData.track = userData.course;
                console.log("Setting track from userData.course:", dataToSubmit.postData.track);
            } 
            else if (userData.strand && userData.strand.trim() !== '') {
                dataToSubmit.postData.track = userData.strand;
                console.log("Setting track from userData.strand:", dataToSubmit.postData.track);
            }
            // Finally use a default value based on level
            else {
                const level = userData.level || dataToSubmit.details?.level || '';
                dataToSubmit.postData.track = level === 'SHS' ? 'General Academic Strand' : 'Default Program';
                console.log("Setting default track value based on level:", dataToSubmit.postData.track);
            }
        }
        
        // Now handle the request ID generation
        // Check if we already have a properly formatted request ID
        let existingRequestId = dataToSubmit.details?.requestID || dataToSubmit.postData.request_id || '';
        
        if (!existingRequestId || existingRequestId === '') {
            // Generate a new request ID
            const paymentType = dataToSubmit.details.payment || dataToSubmit.postData.payment || '';
            let prefix = 'R';
            
            if (paymentType.toLowerCase() === 'express') {
                prefix = 'E';
            } else if (paymentType.toLowerCase() === 'priority') {
                prefix = 'P';
            }
            
            const uniqueId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const requestID = `${prefix}-${uniqueId}`;
            
            // Set the request ID
            dataToSubmit.details.requestID = requestID;
            dataToSubmit.postData.request_id = requestID;
        } else if (existingRequestId && /^\d+$/.test(existingRequestId)) {
            // If we have a numeric ID (from calendar.js), format it with prefix
            const paymentType = dataToSubmit.details.payment || dataToSubmit.postData.payment || '';
            let prefix = 'R';
            
            if (paymentType.toLowerCase() === 'express') {
                prefix = 'E';
            } else if (paymentType.toLowerCase() === 'priority') {
                prefix = 'P';
            }
            
            const requestID = `${prefix}-${existingRequestId}`;
            
            // Set the properly formatted request ID
            dataToSubmit.details.requestID = requestID;
            dataToSubmit.postData.request_id = requestID;
        } else if (existingRequestId && !existingRequestId.includes('-')) {
            // If we have an ID but it doesn't have a prefix, add one
            const paymentType = dataToSubmit.details.payment || dataToSubmit.postData.payment || '';
            let prefix = 'R';
            
            if (paymentType.toLowerCase() === 'express') {
                prefix = 'E';
            } else if (paymentType.toLowerCase() === 'priority') {
                prefix = 'P';
            }
            
            const requestID = `${prefix}-${existingRequestId}`;
            
            // Set the properly formatted request ID
            dataToSubmit.details.requestID = requestID;
            dataToSubmit.postData.request_id = requestID;
        } else {
            // We have an existing formatted ID, make sure it's in both places
            dataToSubmit.details.requestID = existingRequestId;
            dataToSubmit.postData.request_id = existingRequestId;
        }
        
        console.log("Submitting request with data:", dataToSubmit.postData);
        console.log("API URL:", `${API_BASE_URL}/api/request`);
        
        // Final verification of request_id
        if (!dataToSubmit.postData.request_id || dataToSubmit.postData.request_id === '') {
            console.error("CRITICAL: request_id is still missing after all attempts to set it");
            console.log("Full submission data:", JSON.stringify(dataToSubmit));
        }
        
        // Check for missing required fields one final time
        const requiredFields = ['idno', 'request_id', 'track', 'section', 'schedule', 'payment'];
        const missingFields = requiredFields.filter(field => !dataToSubmit.postData[field] || dataToSubmit.postData[field].trim() === '');
        
        if (missingFields.length > 0) {
            const missingFieldsList = missingFields.join(', ');
            console.error(`Still missing required fields: ${missingFieldsList}`);
            alert(`Cannot submit request: Missing required fields (${missingFieldsList})`);
            return false;
        }
        
        // Set flag for a new request being created
        localStorage.setItem('newRequestSubmitted', 'true');
        
        // Reset notification state if the function exists (wrapped in try-catch to avoid stopping execution)
        try {
            if (typeof resetNotificationState === 'function') {
                resetNotificationState();
            } else {
                console.log("resetNotificationState function not available");
            }
        } catch (e) {
            console.error("Error resetting notification state:", e);
        }
        
        // Send the data - wrapped in try-catch
        try {
            sendViaCordovaPlugin(dataToSubmit.postData);
        } catch (e) {
            console.error("Error sending via Cordova plugin:", e);
        }
        
        try {
            sendViaFormSubmission(dataToSubmit.postData);
        } catch (e) {
            console.error("Error sending via form submission:", e);
        }
        
        return true;
    };
    
    function sendViaFormSubmission(postData) {
        console.log("Sending request via form submission");
        
        // CRITICAL FIX: Make sure method field is set and included
        if (!postData.method || postData.method === '') {
            console.warn("Method field was missing, setting default value: fullpayment");
            postData.method = 'fullpayment';
        }
        
        // CRITICAL FIX: Make sure payment field is properly set for Method column display
        if (!postData.payment || postData.payment === '') {
            console.warn("Payment field was missing, setting default value: regular");
            postData.payment = 'regular';
        } else {
            // Normalize payment value
            if (postData.payment.toLowerCase() === 'promissory') {
                postData.payment = 'regular';
            }
            
            // Convert to lowercase and validate
            postData.payment = postData.payment.toLowerCase();
            if (!['priority', 'express', 'regular'].includes(postData.payment)) {
                console.warn(`Invalid payment value: ${postData.payment}, defaulting to 'regular'`);
                postData.payment = 'regular';
            }
        }
        
        // Log all fields being sent for debugging
        console.log("Form submission data:");
        for (const key in postData) {
            if (postData.hasOwnProperty(key)) {
                console.log(`  ${key}: ${postData[key]}`);
            }
        }
        
        // Validate required fields before sending
        const requiredFields = ['idno', 'request_id', 'track', 'section', 'schedule', 'payment', 'method'];
        const missingFields = requiredFields.filter(field => !postData[field] || postData[field].trim() === '');
        
        if (missingFields.length > 0) {
            const missingFieldsList = missingFields.join(', ');
            console.error(`Form submission - Missing required fields: ${missingFieldsList}`);
            // Don't show alert here, the plugin method will handle it
            return;
        }
        
        try {
            const requestId = 'request_' + Date.now();
            
            const iframe = document.createElement('iframe');
            iframe.id = 'iframe_' + requestId;
            iframe.name = 'iframe_' + requestId;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            const form = document.createElement('form');
            form.id = 'form_' + requestId;
            form.method = 'POST';
            form.target = iframe.name;
            form.action = `${API_BASE_URL}/api/request`;
            form.enctype = 'application/x-www-form-urlencoded';
            form.style.display = 'none';
            
            // IMPORTANT: Make sure all required fields are included in the form
            const allRequiredFields = ['idno', 'request_id', 'track', 'section', 'schedule', 'payment', 'method', 'student_id', 'status'];
            
            for (const key in postData) {
                if (postData.hasOwnProperty(key) && postData[key] !== null && postData[key] !== undefined) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = String(postData[key]);
                    form.appendChild(input);
                    console.log(`Added form field: ${key} = ${postData[key]}`);
                }
            }
            
            // Add any missing required fields with default values
            allRequiredFields.forEach(field => {
                if (!postData[field] || !form.querySelector(`input[name="${field}"]`)) {
                    // Field is missing, add it with a default value
                    const defaultValues = {
                        'method': 'fullpayment',
                        'payment': 'regular',
                        'status': 'pending',
                        'student_id': postData.idno || '',
                        'track': 'Default Program'  // Default track value
                    };
                    
                    if (defaultValues[field]) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = field;
                        input.value = defaultValues[field];
                        form.appendChild(input);
                        console.log(`Added missing required field with default: ${field} = ${defaultValues[field]}`);
                    }
                }
            });
            
            iframe.onload = function() {
                console.log("Form submission iframe loaded");
                
                try {
                    const iframeContent = iframe.contentWindow.document.body.innerHTML;
                    console.log("Iframe response received:", iframeContent.substring(0, 100) + "...");
                } catch (e) {
                    console.log("Cannot access iframe content (expected due to security):", e);
                }
                
                setTimeout(function() {
                    try {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        if (document.body.contains(form)) {
                            document.body.removeChild(form);
                        }
                    } catch (e) {
                        console.error("Error cleaning up form elements:", e);
                    }
                    
                    // Don't show alert here as we already show the receipt
                    document.querySelector('.part1').style.display = 'block';
                }, 500);
            };
            
            document.body.appendChild(form);
            console.log("Form created with id:", form.id, "targeting iframe:", iframe.id);
            form.submit();
            console.log("Form submitted");
            
        } catch (e) {
            console.error("Error in form submission:", e);
        }
    }
    
    function sendViaCordovaPlugin(postData) {
        // Use the httpRequest helper if available, otherwise use fetch directly
        const sendHttpRequest = (typeof httpRequest === 'function') ? httpRequest : sendWithFetch;
        
        // CRITICAL FIX: Make sure method field is set
        if (!postData.method || postData.method === '') {
            console.warn("Method field was missing in HTTP submission, setting default value: fullpayment");
            postData.method = 'fullpayment';
        }
        
        // CRITICAL FIX: Make sure payment field is properly set for Method column display
        if (!postData.payment || postData.payment === '') {
            console.warn("Payment field was missing in HTTP submission, setting default value: regular");
            postData.payment = 'regular';
        } else {
            // Normalize payment value for HTTP submission
            if (postData.payment.toLowerCase() === 'promissory') {
                postData.payment = 'regular';
            }
        }
        
        // CRITICAL FIX: Make sure track field is never empty
        if (!postData.track || postData.track.trim() === '') {
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                // Try to use course or strand from userData
                if (userData.course && userData.course.trim() !== '') {
                    postData.track = userData.course;
                    console.log("Setting track in HTTP submission from userData.course:", postData.track);
                } 
                else if (userData.strand && userData.strand.trim() !== '') {
                    postData.track = userData.strand;
                    console.log("Setting track in HTTP submission from userData.strand:", postData.track);
                }
                // Use a default value based on level
                else {
                    const level = userData.level || '';
                    postData.track = level === 'SHS' ? 'General Academic Strand' : 'Default Program';
                    console.log("Setting default track value in HTTP submission:", postData.track);
                }
            } catch (e) {
                console.error("Error getting user data for track value:", e);
                postData.track = 'Default Program';
                console.log("Using fallback default track value in HTTP submission");
            }
        }
        
        // Log the data we're sending
        console.log("HTTP submission data:");
        for (const key in postData) {
            if (postData.hasOwnProperty(key)) {
                console.log(`  ${key}: ${postData[key]}`);
            }
        }
        
        // Create a deep copy of postData to avoid modifications affecting other code
        const dataToSend = JSON.parse(JSON.stringify(postData));
        
        // CRITICAL FIX: Ensure payment field is correctly set in the copied data
        if (!dataToSend.payment || dataToSend.payment === '') {
            dataToSend.payment = 'regular';
        } else {
            // Normalize and validate payment value (for Method column)
            dataToSend.payment = dataToSend.payment.toLowerCase();
            if (dataToSend.payment === 'promissory') {
                dataToSend.payment = 'regular';
            }
            if (!['priority', 'express', 'regular'].includes(dataToSend.payment)) {
                dataToSend.payment = 'regular';
            }
        }
        
        // Validate required fields before sending
        const requiredFields = ['idno', 'request_id', 'track', 'section', 'schedule', 'payment', 'method'];
        const missingFields = requiredFields.filter(field => !dataToSend[field] || dataToSend[field].trim() === '');
        
        if (missingFields.length > 0) {
            const missingFieldsList = missingFields.join(', ');
            console.error(`Missing required fields: ${missingFieldsList}`);
            alert(`Cannot submit request: Missing required fields (${missingFieldsList})`);
            return;
        }
        
        // Ensure method field is properly set
        if (dataToSend.method === 'full') {
            dataToSend.method = 'fullpayment';
        } else if (dataToSend.method === 'partial') {
            dataToSend.method = 'installment';
        }
        
        console.log("Final method value being sent:", dataToSend.method);
        
        // Use the HTTP request helper
        sendHttpRequest(
            `${API_BASE_URL}/api/request`,
            {
                method: 'POST',
                data: dataToSend,
                headers: {
                    'Content-Type': 'application/json'
                },
                successCallback: function(response) {
                    console.log("Request submitted to server:", response);
                    
                    try {
                        // Try to parse the response data to check for any issues
                        const responseData = response.data;
                        console.log("Server response:", responseData);
                        
                        // Check if the method field was correctly received
                        if (responseData.request && responseData.request.method) {
                            console.log("Server confirmed method field received:", responseData.request.method);
                        }
                    } catch (e) {
                        console.log("Could not process server response:", e);
                    }
                },
                errorCallback: function(error) {
                    console.error("Request submission failed:", error);
                    
                    // Parse the error message if possible
                    let errorMessage = "Request submission failed. Please try again.";
                    try {
                        if (error.data && error.data.message) {
                            errorMessage = `Error: ${error.data.message}`;
                        }
                    } catch (e) {
                        console.error("Error processing error response:", e);
                    }
                    
                    // Show error message to user
                    alert(errorMessage);
                }
            }
        );
        
        // Helper function for direct fetch if httpRequest is not available
        function sendWithFetch(url, options) {
            fetch(url, {
                method: options.method || 'GET',
                headers: options.headers || { 'Content-Type': 'application/json' },
                body: options.data ? JSON.stringify(options.data) : undefined
            })
            .then(response => {
                const statusCode = response.status;
                return response.json().then(data => {
                    return { status: statusCode, data };
                });
            })
            .then(result => {
                if (options.successCallback) {
                    options.successCallback(result);
                }
                return result;
            })
            .catch(error => {
                console.error('Request failed:', error);
                if (options.errorCallback) {
                    options.errorCallback(error);
                }
            });
        }
    }
    
    console.log("Payment form - Initialization complete");
}); 