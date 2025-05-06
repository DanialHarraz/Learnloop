document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("register-form")
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("email").value
        const username = document.getElementById("username").value
        const password = document.getElementById("password").value
        const avatar = document.getElementById("avatar").value
        const bio = document.getElementById("bio").value

        if (!email || !username || !password || !avatar || !bio) {
            window.alert("Missing fields required")
        } else {
            fetch("/user/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, username, password, avatar, bio })
            }).then(response => {
                if (!response.ok) {
                    if (response.status === 400) {
                        return response.json().then(data => {
                            window.alert(data.message)
                            throw new Error(data.message)
                        })
                    } else {
                        console.error(error)
                    }
                } else {
                    return response.json(response.body)
                }
            })
            .then(data => {
                const userData = data.data
                const token = data.token
                localStorage.setItem("userData", JSON.stringify(userData))
                localStorage.setItem("token", JSON.stringify(token))
                console.log("userData: ", userData)
                const id = JSON.parse(userData.id)
                window.alert("User created successfully")

                
                fetch("/streak/create", {  
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId: id })
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

                fetch("/profile/update/online", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ id: id })
                })
                window.location.href = "./index.html"
            })
            .catch(error => {
                console.error(error)
            })
        }
    })
})
