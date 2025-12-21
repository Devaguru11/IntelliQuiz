<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Signup – IntelliQuiz</title>

  <!-- SAME FONTS AS DASHBOARD -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="auth.css">
</head>
<body>

<!-- SAME BACKGROUND SHAPES AS INDEX -->
<div class="bg-shape shape1"></div>
<div class="bg-shape shape2"></div>

<nav class="auth-nav">
  <div class="logo">⚡ IntelliQuiz</div>
</nav>

<section class="auth-hero">
  <h1>Create your IntelliQuiz Account</h1>
  <p>Access your quizzes, scores, and learning dashboard</p>
</section>

<div class="auth-card">
  <h2>Signup</h2>

  <input type="text" id="name" placeholder="Full Name">
  <input type="email" id="email" placeholder="Email Address">
  <input type="password" id="password" placeholder="Password">

  <p id="signupError" class="error"></p>

  <button onclick="signup()">Create Account</button>

  <p class="auth-footer">
    Already have an account? <a href="login.html">Login</a>
  </p>
</div>

<script src="signup.js"></script>
</body>
</html>
