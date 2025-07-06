const form = document.getElementById("registrationForm");
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
const errorMsg = document.getElementById("errorMsg");
let isDrawing = false;

ctx.strokeStyle = "#000";
ctx.lineWidth = 2;
ctx.lineCap = "round";

canvas.addEventListener("mousedown", e => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener("mousemove", e => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});
canvas.addEventListener("mouseup", () => (isDrawing = false));
canvas.addEventListener("mouseleave", () => (isDrawing = false));

// Touch
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  isDrawing = true;
  const pos = getTouchPos(canvas, e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (isDrawing) {
    const pos = getTouchPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
});
canvas.addEventListener("touchend", e => {
  e.preventDefault();
  isDrawing = false;
});

function getTouchPos(canvasDom, e) {
  const rect = canvasDom.getBoundingClientRect();
  return {
    x: e.touches[0].clientX - rect.left,
    y: e.touches[0].clientY - rect.top,
  };
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  errorMsg.textContent = "";

  const formData = new FormData(form);

  // Add signature image (blob)
  canvas.toBlob(blob => {
    formData.append("signature", blob, "signature.png");

    fetch("/.netlify/functions/sendEmail", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.open("/success.html", "_blank");
          form.reset();
          clearSignature();
        } else {
          errorMsg.textContent = "⚠️ שגיאה בשליחה.";
        }
      })
      .catch(err => {
        console.error("Error:", err);
        errorMsg.textContent = "⚠️ שגיאה בשליחה לשרת.";
      });
  }, "image/png");
});
