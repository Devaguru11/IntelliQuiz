async function signup() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
  
    const res = await fetch("http://localhost:4000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
  
    const data = await res.json();
  
    if (res.ok) {
      alert("Signup Successful!");
      window.location.href = "login.html";
    } else {
      alert(data.message);
    }
  }
  