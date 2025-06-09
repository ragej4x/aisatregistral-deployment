document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("regForm").addEventListener("submit", function (e) {
      e.preventDefault();
  
      const level = document.getElementById("level").value;
      const name = document.getElementById("name-register").value;
      const course = document.getElementById("course").value;
      const idno = document.getElementById("idno-register").value;
      const cell = document.getElementById("cell").value;
      const email = document.getElementById("email-register").value;
      const password = document.getElementById("password-register").value;
      const cpassword = document.getElementById("cpassword-register").value;
  
      if (password !== cpassword) {
        alert("Passwords do not match!");
        return;
      }
  
      const data = {
        level,
        name,
        course,
        idno,
        cell,
        email,
        password
      };
  
      console.log("Sending data:", data);
  
      // Using the httpRequest helper from request.js
      httpRequest('https://jimboyaczon.pythonanywhere.com/api/register', {
        method: 'POST',
        data: data,
        successCallback: function(response) {
          try {
            alert("Registration successful!");
            document.getElementById("regForm").reset();
            toggleLogin();
            hideRegister();
          } catch (e) {
            console.error("Error processing response:", e);
            alert("Registration succeeded but failed to process server response.");
          }
        },
        errorCallback: function(error) {
          console.error("Registration failed:", error);
          let msg = "Registration failed.";
          if (error && error.data) {
            msg = error.data.message || msg;
          }
          alert(msg);
        }
      });
    });
  });
  