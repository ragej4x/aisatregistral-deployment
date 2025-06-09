const API_BASE_URL = 'https://jimboyaczon.pythonanywhere.com';

let registrationData = {
    date: null,
    time: null,
    details: {
        name: null,
        track: null,
        section: null,
        id: null,
        schedule: null,
        method: null,
        payment: null,
        requestID: generateRequestID(),
        status: null
    }
};

function generateRequestID() {
    const number = Math.floor(1000 + Math.random() * 9000);
    return number.toString();
}

window.onload = function() {
    const calendarDiv = document.getElementById('calendar');
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const nextButton = document.getElementById('nextButton');

    let selectedDate = '';
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    const monthNames = [...Array(12).keys()].map(i => 
        new Date(0, i).toLocaleString('default', { month: 'long' }));

    monthNames.forEach((name, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = name;
        monthSelect.appendChild(opt);
    });

    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    monthSelect.onchange = () => {
        currentMonth = parseInt(monthSelect.value);
        renderCalendar();
    };
    yearSelect.onchange = () => {
        currentYear = parseInt(yearSelect.value);
        renderCalendar();
    };

    function renderCalendar() {
        calendarDiv.innerHTML = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        dayNames.forEach(d => {
            const div = document.createElement('div');
            div.className = 'day-name';
            div.textContent = d;
            calendarDiv.appendChild(div);
        });

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            calendarDiv.appendChild(document.createElement('div'));
        }

        fetch(`${API_BASE_URL}/api/calendar`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                for (let i = 1; i <= daysInMonth; i++) {
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const status = data[dateStr] || 'unavail';

                    const dayDiv = document.createElement('div');
                    dayDiv.className = `day ${status}`;
                    dayDiv.textContent = i;

                    if (status === 'open') {
                        dayDiv.onclick = () => {
                            document.querySelector('.day.selected')?.classList.remove('selected');
                            selectedDate = dateStr;
                            dayDiv.classList.add('selected');
                            nextButton.disabled = false;
                            setAppointmentDate(dateStr);
                        };
                    }

                    calendarDiv.appendChild(dayDiv);
                }
            })
            .catch(error => {
                console.error('Calendar fetch error:', error);
                alert('Failed to connect to server');
            });
    }

    renderCalendar();

    setupFormHandlers();
};

function setupFormHandlers() {
    document.getElementById("nextbtn")?.addEventListener("click", () => {
        registrationData.details.track = document.getElementById("courseInput")?.value || null;
        registrationData.details.name = document.querySelector('input[placeholder="Name"]')?.value || "";
        registrationData.details.section = document.querySelector('input[placeholder="Section"]')?.value || null;
        registrationData.details.id = document.querySelector('input[placeholder="ID No."]')?.value || null;
    });

    document.querySelectorAll(".paybtn").forEach(button => {
        button.addEventListener("click", () => {
            const paymentType = button.textContent.trim().split(" ")[0].toLowerCase();
            registrationData.details.payment = paymentType;
            
            // Update request ID format based on payment type
            const requestNumber = registrationData.details.requestID.replace(/[A-Z]-/g, '');
            
            if (paymentType === 'promissory') {
                registrationData.details.requestID = `R-${requestNumber}`;
            } else if (paymentType === 'priority') {
                registrationData.details.requestID = `P-${requestNumber}`;
            } else if (paymentType === 'express') {
                registrationData.details.requestID = `E-${requestNumber}`;
            }
        });
    });

    document.querySelectorAll(".part6 .button").forEach(button => {
        button.addEventListener("click", () => {
            registrationData.details.method = button.textContent.trim().toLowerCase();
        });
    });

    document.getElementById("submitBtn")?.addEventListener("click", submitRegistration);
}

function setAppointmentDate(dateStr) {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5);
    registrationData.date = dateStr;
    registrationData.time = timeStr;
    registrationData.details.schedule = `${dateStr} ${timeStr}:00`;
}

function submitRegistration() {
    if (!registrationData.details.name || !registrationData.details.id || !registrationData.date) {
        alert("Please fill in all required fields and select an appointment date");
        return;
    }

    const postData = {
        idno: registrationData.details.id,
        request_id: registrationData.details.requestID,
        track: registrationData.details.track,
        section: registrationData.details.section,
        schedule: `${registrationData.date} ${registrationData.time}:00`,
        method: registrationData.details.method,
        payment: registrationData.details.payment,
        status: 'pending',
        student_id: registrationData.details.id
    };

    fetch(`${API_BASE_URL}/api/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert("Registration submitted successfully!");
        window.location.reload();
    })
    .catch(error => {
        alert("Registration failed. Please try again.");
        console.error('Registration error:', error);
    });
}
