// This module handles the receipt modal functionality
// - When the "Done" button is clicked, it sends the request data and closes the modal (only for new requests)
// - When the "X" button is clicked, it only closes the modal without sending data

// Store the current request data globally
let currentRequestData = null;
// Flag to track if this is a new request that hasn't been submitted yet
let isNewRequest = true;

// Make showReceipt function globally accessible from the start
window.showReceipt = function(requestData) {
    console.log("Global showReceipt function called with data:", JSON.stringify(requestData));
    
    const receiptModal = document.getElementById('receiptModal');
    if (!receiptModal) {
        console.error("Receipt modal element not found");
        alert("Could not display receipt. Please try again.");
        return;
    }
    
    try {
        // Store the request data for later use
        currentRequestData = requestData;
        
        // Make sure we have valid requestData
        if (!requestData) {
            console.error("Receipt data is null or undefined");
            requestData = {};
            isNewRequest = true;
            return;
        }
        
        // Make sure details exists
        if (!requestData.details) {
            requestData.details = {};
        }
        
        // Format and prepare the receipt ID
        let requestId = formatReceiptId(requestData);
        
        // Always set isNewRequest to true to ensure data gets sent
        isNewRequest = true;
        console.log("Is this a new request that needs to be sent?", isNewRequest);
        
        // Save the formatted request ID back to the registration data
        if (window.registrationData && window.registrationData.details) {
            window.registrationData.details.requestID = requestId;
            console.log("Updated registration data with formatted request ID");
        }
        
        // Get user data for context
        let userData = null;
        try {
            userData = window.currentUserData || JSON.parse(localStorage.getItem('userData') || '{}');
            console.log("Loaded user data for receipt:", userData);
        } catch (e) {
            console.error("Error loading user data:", e);
            userData = {};
        }
        
        // Populate receipt fields
        populateReceiptFields(requestData, requestId, userData);
        
        // Show the modal with additional checks
        displayReceiptModal(receiptModal);
    } catch (e) {
        console.error("Error in showReceipt:", e);
        alert("There was an error displaying the receipt. Please try again.");
    }
};

// Helper function to format receipt ID
function formatReceiptId(requestData) {
    // Debug logging for request ID checking
    console.log("Checking request IDs:");
    console.log("- request_id:", requestData.request_id);
    console.log("- details.requestID:", requestData.details?.requestID);
    console.log("- request_id_display:", requestData.request_id_display);
    
    // Get a proper request ID from all possible fields
    let requestId = requestData.request_id || requestData.details?.requestID || requestData.requestID || requestData.request_id_display || '';
    
    if (requestId && requestId !== 'N/A' && requestId !== '') {
        console.log("Found request ID:", requestId);
        
        // Format the request ID properly before displaying it
        if (/^\d+$/.test(requestId)) {
            // If we just have a numeric ID (from calendar.js), add the prefix
            const paymentMethod = requestData.payment || requestData.details?.payment || '';
            let prefix = 'R';
            if (paymentMethod.toLowerCase() === 'express') {
                prefix = 'E';
            } else if (paymentMethod.toLowerCase() === 'priority') {
                prefix = 'P';
            }
            requestId = `${prefix}-${requestId}`;
            console.log("Formatted numeric ID with prefix:", requestId);
        } else if (requestId.includes('-')) {
            // If it already has a prefix format, ensure it's the correct one
            const parts = requestId.split('-');
            if (parts.length === 2) {
                const numericPart = parts[1];
                const paymentMethod = requestData.payment || requestData.details?.payment || '';
                let prefix = 'R';
                
                if (paymentMethod.toLowerCase() === 'express') {
                    prefix = 'E';
                } else if (paymentMethod.toLowerCase() === 'priority') {
                    prefix = 'P';
                } else if (paymentMethod.toLowerCase() === 'promissory' || paymentMethod.toLowerCase() === 'regular') {
                    prefix = 'R';
                }
                
                if (numericPart && /^\d+$/.test(numericPart)) {
                    requestId = `${prefix}-${numericPart}`;
                    console.log("Reformatted prefixed ID:", requestId);
                }
            }
        }
        
        console.log("Request has an ID, but we'll treat it as a new request");
    } else {
        // For new requests that don't have an ID yet, create a formatted display ID
        console.log("No request ID found, will create formatted display ID");
        
        // Generate a formatted ID using the payment type prefix if available
        const paymentType = requestData.payment || requestData.details?.payment || '';
        let prefix = 'R';
        
        if (paymentType.toLowerCase() === 'express') {
            prefix = 'E';
        } else if (paymentType.toLowerCase() === 'priority') {
            prefix = 'P';
        } else if (paymentType.toLowerCase() === 'promissory' || paymentType.toLowerCase() === 'regular') {
            prefix = 'R';
        }
        
        // Generate a random unique number for the request ID
        // DO NOT use the student ID as the request ID
        const uniqueId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        requestId = `${prefix}-${uniqueId}`;
        console.log("Generated formatted display ID:", requestId);
    }
    
    return requestId;
}

// Helper function to display the receipt modal
function displayReceiptModal(receiptModal) {
    console.log("Showing receipt modal");
    receiptModal.style.display = 'block';
    
    // Android sometimes needs an additional push to display modals
    setTimeout(function() {
        if (receiptModal.style.display !== 'block') {
            console.log("Forcing display of receipt modal");
            receiptModal.style.display = 'block';
        }
    }, 100);
    
    // Additional check to ensure modal stays visible
    setTimeout(function() {
        if (receiptModal.style.display !== 'block') {
            console.log("Second attempt to force display receipt modal");
            receiptModal.style.display = 'block';
            
            // Try to re-populate fields if needed
            if (currentRequestData) {
                populateReceiptFields(
                    currentRequestData, 
                    currentRequestData.details?.requestID || 'N/A', 
                    JSON.parse(localStorage.getItem('userData') || '{}')
                );
            }
        }
    }, 500);
}

// Helper function to format date
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function to populate receipt fields
function populateReceiptFields(requestData, requestId, userData) {
    console.log("Populating receipt fields with data");
    
    const receiptElements = {
        receiptRequestId: document.getElementById('receiptRequestId'),
        receiptName: document.getElementById('receiptName'),
        receiptIdNo: document.getElementById('receiptIdNo'),
        receiptCourse: document.getElementById('receiptCourse'),
        receiptSchedule: document.getElementById('receiptSchedule'),
        receiptPayment: document.getElementById('receiptPayment'),
        receiptStatus: document.getElementById('receiptStatus'),
        receiptDate: document.getElementById('receiptDate'),
        courseLabel: document.getElementById('courseLabel')
    };
    
    // Ensure we have a valid userData object
    if (!userData || typeof userData !== 'object') {
        console.log("Creating new userData object since none was provided");
        try {
            userData = JSON.parse(localStorage.getItem('userData') || '{}');
        } catch (e) {
            console.error("Error parsing userData from localStorage:", e);
            userData = {};
        }
    }
    
    // Safely set text content if elements exist
    if (receiptElements.receiptRequestId) {
        receiptElements.receiptRequestId.textContent = requestId || 'N/A';
    } else {
        console.error("receiptRequestId element not found");
    }
    
    if (receiptElements.receiptName) {
        receiptElements.receiptName.textContent = userData.name || requestData.name || requestData.details?.name || 'N/A';
    } else {
        console.error("receiptName element not found");
    }
    
    // Handle both id and idno fields from different sources
    const idNumber = userData.idno || requestData.idno || requestData.details?.idno || requestData.details?.id || 'N/A';
    if (receiptElements.receiptIdNo) {
        receiptElements.receiptIdNo.textContent = idNumber;
    } else {
        console.error("receiptIdNo element not found");
    }
    
    let courseOrStrand = "Course/Strand";
    if (userData && userData.level === "SHS") {
        courseOrStrand = "Strand";
    } else if (userData && userData.level === "College") {
        courseOrStrand = "Course";
    } else if (window.registrationData && window.registrationData.details) {
        if (window.registrationData.details.level === "SHS") {
            courseOrStrand = "Strand";
        } else if (window.registrationData.details.level === "College") {
            courseOrStrand = "Course";
        }
    }
    
    if (receiptElements.courseLabel) {
        receiptElements.courseLabel.textContent = courseOrStrand + ":";
    } else {
        console.error("courseLabel element not found");
    }
    
    const courseValue = userData.course || userData.strand || 
                        requestData.course || requestData.strand || 
                        requestData.details?.course || requestData.details?.track || 'N/A';
    if (receiptElements.receiptCourse) {
        receiptElements.receiptCourse.textContent = courseValue;
    } else {
        console.error("receiptCourse element not found");
    }
    
    const scheduleStr = requestData.schedule || 
                        `${requestData.date || ''} ${requestData.time || ''}` || 'N/A';
    if (receiptElements.receiptSchedule) {
        receiptElements.receiptSchedule.textContent = scheduleStr;
    } else {
        console.error("receiptSchedule element not found");
    }
    
    // Look for payment method in all possible places
    const paymentMethod = requestData.payment || requestData.details?.payment || window.registrationData?.details?.payment || '';
    console.log("Found payment method:", paymentMethod);
    
    const methodType = requestData.method || requestData.details?.method || window.registrationData?.details?.method || '';
    console.log("Found method type:", methodType);
    
    let displayPayment;
    if (!paymentMethod || paymentMethod === '') {
        // Try to infer from other data
        if (window.registrationData) {
            // For promissory note (regular) and others
            if (window.registrationData.details?.payment) {
                displayPayment = window.registrationData.details.payment.charAt(0).toUpperCase() + 
                                window.registrationData.details.payment.slice(1);
            } else if (window.registrationData.postData?.payment) {
                displayPayment = window.registrationData.postData.payment.charAt(0).toUpperCase() + 
                                window.registrationData.postData.payment.slice(1);
            } else {
                displayPayment = 'Regular'; // Default
            }
        } else {
            displayPayment = 'Regular'; // Default
        }
    } else if (paymentMethod.toLowerCase() === 'promissory') {
        displayPayment = 'Regular';
    } else {
        displayPayment = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
    }
    
    if (methodType) {
        displayPayment += ' (' + (methodType === 'fullpayment' ? 'Full Payment' : 'Installment') + ')';
    }
    
    console.log("Final display payment:", displayPayment);
    if (receiptElements.receiptPayment) {
        receiptElements.receiptPayment.textContent = displayPayment;
    } else {
        console.error("receiptPayment element not found");
    }
    
    if (receiptElements.receiptStatus) {
        receiptElements.receiptStatus.textContent = requestData.status || requestData.details?.status || 'Pending';
    } else {
        console.error("receiptStatus element not found");
    }
    
    if (receiptElements.receiptDate) {
        receiptElements.receiptDate.textContent = formatDate(new Date());
    } else {
        console.error("receiptDate element not found");
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.lastRequest = requestData;
        localStorage.setItem('userData', JSON.stringify(userData));
    } catch (e) {
        console.error("Error saving receipt data to localStorage:", e);
    }
}

// Function to send request data to the server
function sendRequestData(requestData) {
    if (!requestData) {
        console.error("No request data to send");
        return false;
    }
    
    console.log("SENDING request data to server using submitRequestToServer function");
    
    // Debug the data and window function
    console.log("submitRequestToServer exists:", typeof window.submitRequestToServer === 'function');
    console.log("Data being sent:", JSON.stringify(requestData));
    
    // Ensure the request data has a proper request_id before sending
    if (requestData.details && requestData.details.requestID) {
        // If we have post data, make sure request_id is set
        if (requestData.postData && (!requestData.postData.request_id || requestData.postData.request_id === '')) {
            requestData.postData.request_id = requestData.details.requestID;
            console.log("Set postData.request_id from details.requestID:", requestData.postData.request_id);
        }
        
        // Ensure payment field is correctly set (express, regular, priority)
        if (requestData.postData) {
            // Get payment type from all possible sources
            const paymentType = requestData.details.payment || requestData.payment || '';
            
            if (paymentType && paymentType !== '') {
                requestData.postData.payment = paymentType;
                console.log("Set postData.payment from details:", requestData.postData.payment);
            } else {
                // Default to 'regular' if no payment type found
                requestData.postData.payment = 'regular';
                console.log("Set default payment to 'regular'");
            }
            
            // Normalize payment value
            if (requestData.postData.payment.toLowerCase() === 'promissory') {
                requestData.postData.payment = 'regular';
                console.log("Normalized payment from 'promissory' to 'regular'");
            }
        }
        
        // Ensure method field is correctly set (fullpayment or installment)
        if (requestData.postData && requestData.details.method) {
            requestData.postData.method = requestData.details.method;
            console.log("Set postData.method from details.method:", requestData.postData.method);
        } else if (requestData.postData && (!requestData.postData.method || requestData.postData.method === '')) {
            // Default to fullpayment
            requestData.postData.method = 'fullpayment';
            console.log("Set default method to 'fullpayment'");
        }
        
        // Normalize method value
        if (requestData.postData && requestData.postData.method) {
            if (requestData.postData.method === 'full') {
                requestData.postData.method = 'fullpayment';
                console.log("Normalized method from 'full' to 'fullpayment'");
            } else if (requestData.postData.method === 'partial') {
                requestData.postData.method = 'installment';
                console.log("Normalized method from 'partial' to 'installment'");
            }
        }
        
        // If we don't have postData yet, create it
        if (!requestData.postData) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            // Normalize method value
            let methodValue = requestData.details.method || '';
            if (methodValue === 'full') {
                methodValue = 'fullpayment';
            } else if (methodValue === 'partial') {
                methodValue = 'installment';
            } else if (!methodValue || methodValue === '') {
                // Default to fullpayment if missing
                methodValue = 'fullpayment';
            }
            
            // Get payment type from all possible sources
            let paymentValue = requestData.details.payment || requestData.payment || '';
            if (paymentValue.toLowerCase() === 'promissory') {
                paymentValue = 'regular';
            } else if (!paymentValue || paymentValue === '') {
                // Default to regular if missing
                paymentValue = 'regular';
            }
            
            requestData.postData = {
                idno: requestData.details.idno || requestData.details.id || userData.idno || '',
                request_id: requestData.details.requestID,
                track: requestData.details.track || '',
                section: requestData.details.section || 'Default',
                schedule: requestData.details.schedule || `${requestData.date} ${requestData.time}:00`,
                method: methodValue,
                payment: paymentValue,
                status: 'pending',
                student_id: requestData.details.idno || requestData.details.id || userData.idno || ''
            };
            console.log("Created postData object:", JSON.stringify(requestData.postData));
        }
        
        // Final validation - make sure payment is not empty
        if (requestData.postData && (!requestData.postData.payment || requestData.postData.payment === '')) {
            requestData.postData.payment = 'regular';
            console.log("Final validation: Set empty payment to 'regular'");
        }
    }
    
    // Use the submitRequestToServer function from paymentform.js
    if (typeof window.submitRequestToServer === 'function') {
        try {
            // Make sure we're using registrationData if available
            const dataToSend = window.registrationData || requestData;
            console.log("Actually sending data:", JSON.stringify(dataToSend));
            return window.submitRequestToServer(dataToSend);
        } catch (e) {
            console.error("Error calling submitRequestToServer:", e);
            alert("Error submitting request: " + e.message);
            return false;
        }
    } else {
        console.error("submitRequestToServer function not available");
        alert("Cannot submit request: System error - submission function not available");
        return false;
    }
}

// Function to close the receipt modal
function closeReceipt() {
    console.log("Closing receipt modal");
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        receiptModal.style.display = 'none';
        
        // Return to main screen
        const part1 = document.querySelector('.part1');
        if (part1) part1.style.display = 'block';
        
        const part5 = document.querySelector('.part5');
        if (part5) part5.style.display = 'none';
        
        const part6 = document.querySelector('.part6');
        if (part6) part6.style.display = 'none';
        
        // Hide all other parts
        const parts = document.querySelectorAll('[class^="part"]');
        parts.forEach(part => {
            if (part.className !== 'part1') {
                part.style.display = 'none';
            }
        });
    } else {
        console.error("Receipt modal not found when trying to close");
    }
}

// Handle Done button click - send data and close modal
function handleDoneButtonClick() {
    console.log("Done button clicked - isNewRequest =", isNewRequest);
    
    console.log("Will attempt to send request data");
    console.log("Current request data:", JSON.stringify(currentRequestData));
    console.log("Registration data:", window.registrationData ? JSON.stringify(window.registrationData) : "not available");
    
    // Use window.registrationData if available, otherwise use currentRequestData
    const dataToSend = window.registrationData || currentRequestData;
    
    if (dataToSend) {
        const sent = sendRequestData(dataToSend);
        if (sent) {
            console.log("Request data sent successfully");
            
            // Mark as no longer a new request to prevent duplicate submissions
            isNewRequest = false;
            
            // Update receipt status if needed
            const receiptStatus = document.getElementById('receiptStatus');
            if (receiptStatus) {
                receiptStatus.textContent = "Submitted";
            }
            
            //alert("Your request has been submitted successfully!");
        } else {
            console.error("Failed to send request data");
        }
    } else {
        console.error("No data available to send!");
        alert("Error: No request data available to submit");
    }
    
    closeReceipt();
}

// Initialize the receipt functionality
function initializeReceipt() {
    console.log("Initializing receipt functionality");
    
    const receiptModal = document.getElementById('receiptModal');
    const closeReceiptModalBtn = document.getElementById('closeReceiptModal');
    const receiptDoneBtn = document.getElementById('receiptDoneBtn');
    
    if (!receiptModal) {
        console.error("Receipt modal element not found during initialization");
        return;
    }
    
    // Attach event listeners to buttons
    if (closeReceiptModalBtn) {
        console.log("Setting up close button click handler");
        closeReceiptModalBtn.addEventListener('click', closeReceipt);
    } else {
        console.error("Close button not found");
    }
    
    if (receiptDoneBtn) {
        console.log("Setting up Done button click handler");
        receiptDoneBtn.addEventListener('click', handleDoneButtonClick);
    } else {
        console.error("Done button not found");
    }
    
    // Setup window click handler for closing modal
    window.addEventListener('click', function(event) {
        if (event.target === receiptModal) {
            closeReceipt();
        }
    });
    
    console.log("Receipt initialization complete");
}

// Set up the initialization in multiple ways to ensure it works
document.addEventListener('deviceready', function() {
    console.log("Receipt.js - Device ready event fired");
    initializeReceipt();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("Receipt.js - DOMContentLoaded event fired");
    initializeReceipt();
});

// Last resort - initialize after a delay
setTimeout(function() {
    console.log("Receipt.js - Delayed initialization");
    initializeReceipt();
}, 1000); 