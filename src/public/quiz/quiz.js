document.addEventListener("DOMContentLoaded",(event)=>{
    event.preventDefault()
    quiz()
    // searchQuiz()
     playQuiz()
})

function quiz() {
    console.log("quiz")

    const data = JSON.parse(localStorage.getItem("userData"))
    const userId = data.id
    console.log(data)

    fetch("/quiz", {
    method: "GET",
    headers: {
        "Content-Type": "application/json"
    },
}).then(response => {
    if (!response.ok) {
        if (response.status === 400) {
            return response.json().then(data => {
               window.alert(data.message)
               throw new Error(data.message)
            })
        }
        else
            console.error(error)
    }
    
    else{
        return response.json()
    }
}).then(data =>{
    console.log(data)

    // document.getElementById("allquiz").innerHTML = `<tr><th>${data}</th></tr>`

    for(i=0; i<data.length; i++){
        document.getElementById("all").innerHTML += `<tr class="shadow" style="margin-bottom :1em; border-radius: 22px;" ><th class="h2" style="padding:1em;"> Quiz id : ${data[i].id}</th> <th class="h2" style="padding:1em;"> Quiz title : ${data[i].title}</th> <th class="h2"> Create by : ${data[i].user.name} </th>  <th><button class="btn btn-primary play-btn">play</button></th></tr>`
    }

})

}

function searchQuiz(){
    document.getElementById("search").addEventListener("click",()=>{
        
        const quizId = document.getElementById("type").value
        console.log(quizId)
if(!quizId){
    window.alert("missing fields require")
}
else{
        fetch("/quiz/search", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({quizId: quizId})
}).then(response => {
    if (!response.ok) {
        if (response.status === 400) {
            return response.json().then(data => {
               window.alert(data.message)
               throw new Error(data.message)
            })
        }
        else
            console.error(error)
    }
    
    else{
        return response.json()
    }
}).then(data =>{
    console.log(data)
    if(!data || data.length == 0){
        document.getElementById("all").innerHTML = `<tr><th class="h1 text-center"> no data </th> </tr>`
    }
    else{
        document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom : 1em;" ><th class="h2" style="padding:1em;"> Quiz id : ${data[0].id}</th> <th class="h2" style="padding:1em;"> Quiz title : ${data[0].title}</th> <th class="h2"> Create by : ${data[0].user.name} </th>  <th><button class="btn btn-primary">play</button></th></tr>`
    }
})
}
    })
    
}

 function playQuiz(){
    // document.getElementById("play").addEventListener("click",(event)=>{
    //     event.preventDefault()
     
    //     const row = document.getElementById("play").parentElement.parentElement

    //     console.log("")

    // })

    // document.getElementById("all").addEventListner("click",(event)=>{
    //     event.preventDefault()

    //     const row = event.target.closest("tr")
    //     const rowData = Array.from(row.querySelectorAll("th").map(th=>{th.textContent}))
    //     console.log(rowData)
    // })


    document.querySelectorAll(".play-btn").forEach((button)=>{
        button.addEventListener("click",(event)=>{
            event.preventDefault()

            const row = event.target.closest("tr")

           
            console.log(row.innerHTML)
           
            
        })
    })

    document.querySelectorAll(".play-btn").forEach((button)=>{

    })

    document.getElementById("all").addEventListener("click",(event)=>{
        if(event.target && event.target.classList.contains("play-btn")){
            console.log("hello")

            const row = event.target.closest("tr")
            console.log(row)
           
            
            const rowData = Array.from(row.querySelectorAll("th")).map(th=>{
                return th.textContent.split(":")[1]
            })
            console.log(rowData)

            const quizId = parseInt(rowData[0])
            console.log(quizId)

            fetch("http://localhost:3000/quiz/play", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({quizId : quizId})
}).then(response => {
    if (!response.ok) {
        if (response.status === 400) {
            return response.json().then(data => {
               window.alert(data.message)
               throw new Error(data.message)
            })
        }
        else
            console.error(error)
    }
    
    else{
        return response.json()
    }
}).then(data =>{
    console.log(data)

    const totalQuestion = data.length
    let correctOption = 0 

    
    console.log("start quiz")
})
            
        }

        
    })
}