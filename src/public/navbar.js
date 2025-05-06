document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("navbar").innerHTML += `
        <li><button id="logout-btn" class="btn" style="background-color:white;">Log out</button></li>
    `
    logout()
})


function logout(){
    const logoutBtn = document.getElementById("logout-btn")

    logoutBtn.addEventListener("click",(event)=>{

        const userData = JSON.parse(localStorage.getItem("userData"))
         console.log(userData.id)
        fetch("/profile/update/offline", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id : userData.id})
    })
   
        localStorage.removeItem("userData")
        localStorage.removeItem("token")

        localStorage.clear();


        window.location.href = '/'

    })
}