document.addEventListener("DOMContentLoaded", (event)=>{
    
    event.preventDefault()
    console.log("hello")

    playQuiz()
    query()
    popularQuiz()
})


async function playQuiz(){
    document.getElementById("all").addEventListener("click",(event)=>{
        if(event.target && event.target.classList.contains("play-btn")){

            const row = event.target.closest("tr")
            console.log(row)

            // const rowData = Array.from(row.querySelectorAll("th").map(th=>{
            //     return th.textContent.split(":")[1]
            // }))

            const rowData = Array.from(row.querySelectorAll("th")).map(th=>{
                return th.textContent.split(":")[1]
            })

         

            console.log(rowData)

            document.getElementById("title").innerHTML = `${rowData[1]}`

            let count = 0


            const userData = JSON.parse(localStorage.getItem("userData"))
            const userId = userData.id

            
            const quizId = parseInt(rowData[0])
            console.log(quizId)
          
            quizPopular(quizId)
            

            // fetch("http://localhost:3000/quiz/count/popular", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({quizId : quizId})
            // }).then(response => {
            //     if (!response.ok) {
            //         if (response.status === 400) {
            //             return response.json().then(data => {
            //                window.alert(data.message)
            //                throw new Error(data.message)
            //             })
            //         }
            //         else
            //             console.error(error)
            //     }
                
            //     else{
            //         return response.json()
            //     }
            // })
            
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
               loadQuiz(data)
            //    let count = 0 

            //    var quizModal = new bootstrap.Modal(document.getElementById("quizModal"),{

            //    })
            //    quizModal.show()
   
            //      document.getElementById("close").addEventListener("click",(event)=>{
            //        quizModal.hide()
            //      })

            //      document.getElementById("quizquestion").innerHTML = `<h2> ${data[0].description} </h2> </br>
            //      <button class="btn btn-primary">True</button>
            //      <button class="btn btn-secondary">False</button>
            //      `


            //    for(i=0; i<data.length; i++){
            // //    document.getElementById("true").addEventListener("click",(event)=>{
            // //     event.preventDefault()


            // //    })


            // console.log(data[i])

            // for(i=0; i<data.length; i++){
            //     document.getElementById("quizquestion").innerHTML = `<h2> ${data[i].description}</h2> </br>
            //     <button class="btn btn-primary" id="true" >True</button>
            //     <button class="btn btn-primary" id="false" >False</button>
            //     `
                
               
            // }
           

            
            //    }

            // let modalInput = false

            // do{
                
            //     for(i=0; i<data.length; i++){
                    
            //     }




            // }while(modalInput!=true)

             


              
           })
        }
    })
}

async function loadQuiz (data){
    var quizModal = new bootstrap.Modal(document.getElementById("quizModal"),{

    })
    quizModal.show()

      document.getElementById("close").addEventListener("click",(event)=>{
        quizModal.hide()
      })


    //   document.getElementById("quizquestion").innerHTML = `<h2> ${data[0].description} </h2> </br>
    //   <button class="btn btn-primary">True</button>
    //   <button class="btn btn-secondary">False</button>

    
    //   `

    document.getElementById("quizoption").innerHTML = `
    <button class="btn btn-primary" id="true" >True</button>
    <button class="btn btn-primary" id="false" >False</button>
    `
      let count = 0 

      for(i=0; i<data.length; i++){
        // if(i < data.length){
        document.getElementById("quizquestion").innerHTML = `<h2> ${data[i].description}</h2>
        `
        
        let userCount = await userAnswer(data,i,count)
        if(userCount){count +=1}
        
        // const userAnswer = await new Promise((res,rej)=>{
        //     document.getElementById("true").addEventListener("click",(event)=>{
        //         const value = "True"

        //         if(value == data[i].correctOption){
        //             res()
        //             window.alert("correct")
        //         }
        //         else{
        //             res()
        //             window.alert("incorrect")
        //         }
        //     })

        //     document.getElementById("false").addEventListener("click",(event)=>{
        //         const value = "False"

        //         if(value == data[i].correctOption){
        //             res()
        //             window.alert("correct")
        //         }
        //         else{
        //             res()
        //             window.alert("incorrect")
        //         }
                
        //     })
        // })
      
    // }
    // else{
    //     quizModal.hide()
    //     window.alert("complete")
    // }
    else{
        count = count
    }
    }
    console.log(count)
    console.log("quiz")
    window.alert(`your score : ${count}/${data.length}`)
    window.alert("complete")
    window.location.href = './quiz.html'



  
}

async function userAnswer (data,i,count){
    const userAnswer = await new Promise((res,rej)=>{
        // document.getElementById("true").addEventListener("click",(event)=>{
        //     const value = "True"

        //     if(value == data[i].correctOption){
              
        //         window.alert("correct")
        //     }
        //     else{
                
        //         window.alert("incorrect")
        //     }
        //     document.getElementById("true").removeEventListener("click",(event)=>{})
        //     res()
        // })

        // document.getElementById("false").addEventListener("click",(event)=>{
        //     const value = "False"

        //     if(value == data[i].correctOption){
               
        //         window.alert("correct")
        //     }
        //     else{
               
        //         window.alert("incorrect")
        //     }
        //     document.getElementById("false").removeEventListener("click",(event)=>{})
        //     res()
            
        // })


        function correct(){
            const value = "True"

            if(value == data[i].correctOption){
              window.alert("correct")  
              count += 1
              res(true)
            }
            else{
                window.alert("incorrect")
                res(false)
            }

            document.getElementById("true").removeEventListener("click",correct)
            

        }

    function incorrect(){
        const value = "false"

        if(value == data[i].correctOption){
            window.alert("correct")
            count += 1
            res(true)
        }
        else{
            window.alert("incorrect")
            res(false)
        }
        document.getElementById("false").removeEventListener("click",incorrect)
       
    }

    document.getElementById("true").addEventListener("click",correct)
    document.getElementById("false").addEventListener("click",incorrect)
    })
    
  return count
}

function endQuiz (data){
    console.log(data)
    console.log("complete")
    console.log("quiz")
    console.log("play")
}   


function query(){
    document.getElementById("search").addEventListener("click",()=>{

        const value = document.getElementById("type").value

        if(isNaN(parseInt(value))){
            fetch("http://localhost:3000/quiz", {
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
            
              const sortData = data.filter((e)=>{ return e.title.toLowerCase().includes(value.toLowerCase())})
              console.log(sortData)

            //   for(i=0; i<sortData.length; i ++){
            //     document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom : 1em; border-radius: 22px;"><th class="h2" style="padding : 1em;"> Quiz id : ${data[i].id}</th> <th class="h2" style="padding : 1em;"> Quiz title : ${data[i].title}</th> <th class="h2"> Create by : ${data[i].user.name} </th> <th> <button class="btn btn-primary play-btn">play</button> </th></tr>`
            //   }

            // for(i=0; i<sortData.length; i++){
            //     document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom: 1em; border-radius:22px;"><th class="h2" style="padding :1em;"> Quiz id : ${sortData[i].id}</th><th class="h2" style="padding :1em;"> Quiz title : ${sortData[i].title}</th><th class="h2" style="padding : 1em;"> Create by : ${sortData[i].user.name}</th> <th> <button class="btn btn-primary play-btn"> Play </button></th></tr>`
            // }

            for(i=0; i<sortData.length; i++){
                document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom :1em; border-radius:22px;"><th class="h2" style="padding :1em;"> Quiz id : ${sortData[i].id}</th><th class="h2" style="padding :1em;"> Quiz title : ${sortData[i].title}</th><th class="h2" style="padding : 1em;"> Create by : ${sortData[i].user.name}</th> <th> <button class="btn btn-primary play-btn"> play </button></th></tr>`
            }
           })
        
        }
        else if(value){
            console.log("hello")
            const quizId = parseInt(value)
            fetch("http://localhost:3000/quiz/search", {
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
        else if(!value){
            window.alert("")
        }
        else{
            console.error(error)
        }
    }
    
    else{
        return response.json()
    }
}).then(data =>{
    console.log(data)

    // for(i=0; i<data.length; i++){
    //     document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom : 1em; border-radius: 22px;"><th class="h2" style="padding : 1em;"> Quiz id : ${data[i].id}</th> <th class="h2" style+"padding : 1em;"> Quiz title :  ${data[i].title}</th> <th class="h2" style="padding:1em;"> Create by : ${data[i].user.name}</th> <th> <button class="btn btn-primary play-btn"> play </button></th></tr>`
    // }

    // for(i=0; i<data.length; i++){
    //     document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom : 1em; border-radius:22px;"><th class="h2" style="padding: 1em;"> Quiz id : ${data[i].id}</th><th class="h2" style="padding : 1em;"> Quiz title : ${data[i].title}</th><th class="h2" style="padding: 1em;"> Create by : ${data[i].user.name}</th> <th> <button class="btn btn-primary play-btn"> Play </button></th></tr>`
    // }

  
    for(i=0; i<data.length; i++){
        document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom: 1em; border-radius: 22px;"> <th class="h2" style="padding: 1em;"> Quiz id : ${data[i].id} </th> <th class="h2" style="padding: 1em;"> Quiz title : ${data[i].title} </th> <th class="h2" style="padding: 1em;"> Create by : ${data[i].user.name} </th> <th> <button class="btn btn-primary play-btn"> Play </button></th></tr>`
    }
    console.log("quiz")
    
})
        }
        else{
            window.alert("missing field require")
        }
    })
}


function popularQuiz (){
    const userData = JSON.parse(localStorage.getItem("userData"))
 const userId = userData.id

 document.getElementById("popular").addEventListener("click",(event)=>{
    event.preventDefault()
    fetch("http://localhost:3000/quiz/popular", {
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
       
        for(i=0; i<data.length; i++){
            document.getElementById("all").innerHTML = `<tr class="shadow" style="margin-bottom: 1em; border-radius: 22px;"> <th class="h2" style="padding: 1em;"> Quiz id : ${data[i].id} </th> <th class="h2" style="padding: 1em;"> Quiz title : ${data[i].title} </th> <th class="h2" style="padding: 1em;"> Create by : ${data[i].user.name} </th> <th> <button class="btn btn-primary play-btn"> Play </button></th></tr>`
        }

    })
 })
 
}


async function quizPopular(quizId) {
    fetch("http://localhost:3000/quiz/count/popular", {
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
    })
}


