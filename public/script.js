const form = document.getElementById("registrationForm");
const errorMsg = document.getElementById("errorMsg");
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
let isDrawing = false;

// Set up canvas drawing style
ctx.strokeStyle = "#000";
ctx.lineWidth = 2;
ctx.lineCap = "round";

// 🖱️ עכבר
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

// Function to get touch coordinates
function getTouchPos(canvasDom, touchEvent) {
  const rect = canvasDom.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top,
  };
}

// 🤚 טאצ'
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isDrawing = true;
  const touchPos = getTouchPos(canvas, e);
  ctx.beginPath();
  ctx.moveTo(touchPos.x, touchPos.y);
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (isDrawing) {
    const touchPos = getTouchPos(canvas, e);
    ctx.lineTo(touchPos.x, touchPos.y);
    ctx.stroke();
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  isDrawing = false;
});

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Validate Israeli ID
function validateIsraeliID(id) {
  if (!/^\d{9}$/.test(id)) return false;
  const digits = id.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Format phone
function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 10) value = value.slice(0, 10);
  input.value = value;
}

// Add input events
document.getElementById("phone").addEventListener("input", function () {
  formatPhoneNumber(this);
});

document.getElementById("idNumber").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
  if (this.value.length > 9) this.value = this.value.slice(0, 9);
});

// Submit handler
form.addEventListener("submit", function (event) {
  event.preventDefault();
  errorMsg.textContent = "";

  const id = document.getElementById("idNumber").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const program = document.getElementById("program").value;
  const genderElement = document.querySelector('input[name="gender"]:checked');
  const agreementElement = document.getElementById("agreement");

  // Validation
  if (!firstName) {
    errorMsg.textContent = "אנא הזן שם פרטי.";
    return;
  }
  if (!lastName) {
    errorMsg.textContent = "אנא הזן שם משפחה.";
    return;
  }
  if (!validateIsraeliID(id)) {
    errorMsg.textContent =
      "תעודת זהות לא תקינה. אנא הזן תעודת זהות תקינה בת 9 ספרות.";
    return;
  }
  if (!genderElement) {
    errorMsg.textContent = "אנא בחר מין.";
    return;
  }
  if (!/^05\d{8}$/.test(phone)) {
    errorMsg.textContent =
      "מספר טלפון לא תקין. יש להזין מספר בפורמט 05XXXXXXXX.";
    return;
  }
  if (!program) {
    errorMsg.textContent = "אנא בחר מסלול לימוד.";
    return;
  }
  if (!agreementElement.checked) {
    errorMsg.textContent = "אנא אשר שקראת את התנאים.";
    return;
  }

  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  if (canvas.toDataURL() === blank.toDataURL()) {
    errorMsg.textContent = "אנא חתום בטופס לפני השליחה.";
    return;
  }

  // Form data
  const formData = {
    firstName,
    lastName,
    idNumber: id,
    gender: genderElement.value,
    phone,
    program,
    signature: canvas.toDataURL(),
  };

  const submitButton = document.querySelector(".btn");
  const originalText = submitButton.textContent;
  submitButton.textContent = "שולח...";
  submitButton.disabled = true;

fetch("/.netlify/functions/sendEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        errorMsg.style.color = "green";
        errorMsg.textContent = "✅ הטופס נשלח בהצלחה!";
      } else {
        errorMsg.textContent = "⚠️ שגיאה בשליחה.";
      }
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      form.reset();
      clearSignature();
    })
    .catch((err) => {
      console.error("❌ Error sending email:", err);
      errorMsg.textContent = "⚠️ שגיאה בשליחה לשרת.";
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
});
