document.addEventListener("DOMContentLoaded",(event)=>{

const token = localStorage.getItem("token")

    try{
        fetch("/security", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({token: token})
        }).then(response => {
            if (!response.ok) {
                if (response.status === 400) {
                    return response.json().then(data => {
                       window.alert(data.message)
                       window.location.href = '/'
                      
                    })
                }
                else{
                    console.log("error")
                }     
            }
            else{
                console.log("token")
            }
        }).catch((err)=>{
            console.error(err)
        })

    }
    catch(err){
       console.error(err)
    }
})