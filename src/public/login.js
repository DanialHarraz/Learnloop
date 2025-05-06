document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("login-form")
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const username = document.getElementById("username").value
        const password = document.getElementById("password").value

        if (!username || !password) {
            window.alert("Missing fields required")
        } else {
            fetch("/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            }).then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        response.json().then(data => {
                            window.alert(data.message)
                        })
                    } else if (response.status === 400) {
                        response.json().then(data => {
                            window.alert(data.message)
                        })
                    } else {
                        console.error(error)
                    }
                } else {
                    return response.json(response.body)
                }
            })
            .then(data => {
                const userData = data
                localStorage.setItem("userData", JSON.stringify(userData.data))
                localStorage.setItem("token", JSON.stringify(userData.token))
                
                
                fetch("/streak/create", {  
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId: userData.data.id })
                })
                .then(streakResponse => {
                    if (!streakResponse.ok) {
                        console.error("Error creating streak:", streakResponse.statusText)
                    } else {
                        console.log("Streak created/verified successfully.")
                    }
                })
                .catch(error => {
                    console.error("Error during streak creation:", error)
                })
                
                fetch("/profile/activity/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id: userData.data.id })
                })
                window.location.href = "/index.html";
            })
            .catch(error => {
                console.error(error);
            })
        }
    })
})
