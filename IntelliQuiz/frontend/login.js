async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("loginError");

  errorEl.textContent = "";

  // Validation
  if (!email || !password) {
    errorEl.textContent = "All fields are required.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorEl.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || "Login failed.";
      return;
    }

    // Save user & token
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "index.html";
  } catch (err) {
    errorEl.textContent = "Server error. Try again.";
  }
}
