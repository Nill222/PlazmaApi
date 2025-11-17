const API = "/auth";

async function signin() {
    const username = document.getElementById("login_username").value;
    const password = document.getElementById("login_password").value;
    const msg = document.getElementById("login_msg");

    msg.innerText = "⏳ Авторизация...";

    const resp = await fetch(API + "/signin", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password})
    });

    const data = await resp.json();

    if (!resp.ok) {
        msg.innerText = "❌ " + data.message;
        return;
    }

    localStorage.setItem("jwt", data.data);

    msg.innerText = "✔ Успешный вход!";

    setTimeout(() => window.location.href = "/index.html", 800);
}

async function signup() {
    const username = document.getElementById("reg_username").value;
    const email = document.getElementById("reg_email").value;
    const password = document.getElementById("reg_password").value;
    const msg = document.getElementById("signup_msg");

    msg.innerText = "⏳ Регистрация...";

    const resp = await fetch(API + "/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, email, password})
    });

    const data = await resp.json();

    if (!resp.ok) {
        msg.innerText = "❌ " + data.message;
        return;
    }

    msg.innerText = "✔ Аккаунт создан! Теперь войдите.";
}