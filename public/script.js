const form = document.getElementById("registrationForm");
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
const errorMsg = document.getElementById("errorMsg");
const statusMsg = document.getElementById("statusMsg");
const submitBtn = document.querySelector('button[type="submit"]');
let isDrawing = false;

// Check if all required elements exist
if (!form || !canvas || !ctx) {
  console.error("❌ Required form elements not found!");
  if (errorMsg) {
    errorMsg.textContent = "שגיאה בטעינת הטופס. אנא רענן את הדף.";
    errorMsg.style.display = "block";
  }
}

// Test connection on page load
window.addEventListener("load", async () => {
  try {
    const response = await fetch("/.netlify/functions/sendEmail", {
      method: "OPTIONS",
    });
    if (!response.ok) {
      showStatus(
        "⚠️ בעיה בחיבור לשרת. אנא בדוק את החיבור לאינטרנט.",
        "warning"
      );
    }
  } catch (error) {
    showStatus("⚠️ לא ניתן להתחבר לשרת. אנא נסה שוב מאוחר יותר.", "warning");
  }
});

// Canvas setup
ctx.strokeStyle = "#000";
ctx.lineWidth = 2;
ctx.lineCap = "round";

// Mouse events
if (canvas) {
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });
  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    }
  });
  canvas.addEventListener("mouseup", () => (isDrawing = false));
  canvas.addEventListener("mouseleave", () => (isDrawing = false));

  // Touch events - Improved for mobile
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDrawing = true;
    const pos = getTouchPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (isDrawing) {
      const pos = getTouchPos(canvas, e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });
  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    isDrawing = false;
  });
}

function getTouchPos(canvasDom, e) {
  const rect = canvasDom.getBoundingClientRect();
  const scaleX = canvasDom.width / rect.width;
  const scaleY = canvasDom.height / rect.height;
  return {
    x: (e.touches[0].clientX - rect.left) * scaleX,
    y: (e.touches[0].clientY - rect.top) * scaleY,
  };
}

function clearSignature() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Show loading state
function showLoading() {
  console.log("⏳ Showing loading state");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.classList.remove("ready");
    submitBtn.textContent = "שולח...";
    console.log("✅ Button disabled and loading class added");
  } else {
    console.log("❌ Submit button not found");
  }
  if (errorMsg) errorMsg.textContent = "";
  if (statusMsg) statusMsg.style.display = "none";
}

// Hide loading state
function hideLoading() {
  console.log("🔄 Hiding loading state");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.textContent = "הרשם";
    console.log("✅ Button enabled and loading class removed");
  } else {
    console.log("❌ Submit button not found");
  }
}

// Show error message
function showError(message) {
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }
}

// Show success and redirect
function showSuccess() {
  // Open success page in same window instead of new tab
  window.location.href = "/success.html";
}

// Show status message
function showStatus(message, type = "info") {
  if (statusMsg) {
    statusMsg.textContent = message;
    statusMsg.className = "status"; // Reset classes
    statusMsg.classList.add(type);
    statusMsg.style.display = "block";
  }
}

// Form submission with retry logic
if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("🚀 Form submission started");

    showLoading();

    // Validate signature
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    const blankSignature = blank.toDataURL();
    if (canvas.toDataURL() === blankSignature) {
      showError("אנא חתום בטופס לפני השליחה.");
      hideLoading();
      return;
    }

    const formData = new FormData(form);

    // Add signature as PNG blob
    canvas.toBlob(async (blob) => {
      formData.append("signature", blob, "signature.png");

      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const response = await fetch("/.netlify/functions/sendEmail", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            success = true;
            form.reset();
            clearSignature();
            showSuccess();
          } else {
            throw new Error(data.error || "Unknown error occurred");
          }
        } catch (err) {
          console.error("❌ Error sending:", err);
          retries--;

          if (retries === 0) {
            showError("⚠️ שגיאה בשליחה לשרת. אנא נסה שוב מאוחר יותר.");
          } else {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      hideLoading();
    }, "image/png");
  });
}

// Add form validation feedback
if (form) {
  form.addEventListener("input", function () {
    if (submitBtn && !submitBtn.classList.contains("loading")) {
      const isValid = form.checkValidity();
      // Show ready state when form is valid
      if (isValid) {
        submitBtn.classList.add("ready");
        submitBtn.style.opacity = "1";
      } else {
        submitBtn.classList.remove("ready");
        submitBtn.style.opacity = "0.6";
      }
    }
  });

  // Prevent form submission if not valid
  form.addEventListener("invalid", function (e) {
    e.preventDefault();
    showError("אנא מלא את כל השדות הנדרשים.");
  });
}
