async function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("signupError");

  errorEl.textContent = "";

  // Validation
  if (!name || !email || !password) {
    errorEl.textContent = "All fields are required.";
    return;
  }

  if (name.length < 2) {
    errorEl.textContent = "Name must be at least 2 characters.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorEl.textContent = "Enter a valid email address.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await fetch("http://localhost:4000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || "Signup failed.";
      return;
    }

    window.location.href = "login.html";
  } catch (err) {
    errorEl.textContent = "Server error. Try again.";
  }
}
