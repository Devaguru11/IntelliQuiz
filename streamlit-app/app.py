import streamlit as st
import requests

# ==============================
# CONFIG
# ==============================
API_BASE = "http://localhost:4000"  # change after deployment

st.set_page_config(
    page_title="IntelliQuiz",
    page_icon="⚡",
    layout="wide"
)

# ==============================
# SESSION STATE
# ==============================
if "token" not in st.session_state:
    st.session_state.token = None

if "quiz" not in st.session_state:
    st.session_state.quiz = []

if "answers" not in st.session_state:
    st.session_state.answers = {}

# ==============================
# LOGIN PAGE
# ==============================
def login_page():
    st.title("⚡ IntelliQuiz Login")

    email = st.text_input("Email")
    password = st.text_input("Password", type="password")

    if st.button("Login"):
        res = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": email, "password": password}
        )

        if res.status_code == 200:
            st.session_state.token = res.json()["token"]
            st.success("Login successful")
            st.rerun()
        else:
            st.error("Invalid email or password")

# ==============================
# QUIZ PAGE
# ==============================
def quiz_page():
    st.title("🧠 IntelliQuiz")

    col1, col2 = st.columns(2)

    with col1:
        topic = st.text_area("Enter topic or paste notes")

    with col2:
        uploaded_file = st.file_uploader("Upload PDF", type=["pdf"])

    num_q = st.slider("Number of questions", 5, 10, 5)

    if st.button("Generate Quiz"):
        if topic.strip():
            payload = {
                "topic": topic,
                "num_questions": num_q
            }
            res = requests.post(
                f"{API_BASE}/api/generate-from-text",
                json=payload
            )

        elif uploaded_file:
            files = {"file": uploaded_file}
            data = {"num_questions": num_q}
            res = requests.post(
                f"{API_BASE}/api/generate-from-pdf",
                files=files,
                data=data
            )
        else:
            st.warning("Enter topic or upload a PDF")
            return

        if res.status_code == 200:
            st.session_state.quiz = res.json()["questions"]
            st.session_state.answers = {}
        else:
            st.error("Failed to generate quiz")

    # ==============================
    # DISPLAY QUIZ
    # ==============================
    if st.session_state.quiz:
        st.divider()
        st.subheader("📋 Quiz")

        for i, q in enumerate(st.session_state.quiz):
            st.markdown(f"**Q{i+1}. {q['question']}**")

            choice = st.radio(
                "Choose an option",
                q["options"],
                key=f"q{i}"
            )
            st.session_state.answers[i] = choice

        if st.button("Submit Quiz"):
            score = 0

            st.divider()
            st.subheader("📊 Results")

            for i, q in enumerate(st.session_state.quiz):
                correct = q["correct"]
                user_ans = st.session_state.answers.get(i)

                if user_ans == correct:
                    score += 1
                    st.success(f"Q{i+1}: Correct")
                else:
                    st.error(f"Q{i+1}: Wrong")
                    st.info(f"Correct answer: {correct}")

                if "explanation" in q:
                    st.caption(f"💡 {q['explanation']}")

            st.markdown(f"### ✅ Score: {score}/{len(st.session_state.quiz)}")

    if st.button("Logout"):
        st.session_state.token = None
        st.session_state.quiz = []
        st.session_state.answers = {}
        st.rerun()

# ==============================
# ROUTING
# ==============================
if not st.session_state.token:
    login_page()
else:
    quiz_page()

