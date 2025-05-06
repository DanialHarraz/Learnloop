document.addEventListener("DOMContentLoaded",(event)=>{
 displayProfile()
 getUser()
 editProfile()
 deleteCode()
 deleteForm()
 filter()
 displayActivity()
})


function displayProfile(){
    
    const data = JSON.parse(localStorage.getItem("userData"))
   
    document.getElementById("username").textContent = data.name
    document.getElementById("email").textContent = data.email
    document.getElementById("bio").textContent = data.bio
    document.getElementById("avatar").src = data.avatar
    document.getElementById("productive").textContent = data.productive
    
  

    

  const passwordTab = document.getElementById("passwordTab")
  passwordTab.addEventListener("click",()=>{
    passwordTab.className = "nav-link active"
    document.getElementById("summary").innerHTML = `
    <h1 class="mt-3"> Change password </h1>
    <form id="passwordForm">
    <label for="password" class="form-label">New Password</label>
    <input type="password" id="newPassword" class="form-control" aria-describedby="passwordHelpBlock" placeholder="password">
    <label for="password" class="form-label mt-3">Confirm Password</label>
    <input type="password" id="confirmPassword" class="form-control" aria-describedby="passwordHelpBlock" placeholder="password">
    <button type="submit" class="btn btn-primary d-block mt-3">confirm</button>
    </form>`
    document.getElementById("profileTab").className = `nav-link`
    document.getElementById("editTab").className = `nav-link`
    document.getElementById("deleteTab").className = `nav-link`
    changePassword()
  })

}


function getUser(){
    const userData = JSON.parse(localStorage.getItem("userData"))
 const userId = userData.id
 fetch("/profile", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({userId : userId})
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
    if(data.grp == undefined){
        document.getElementById("grp").textContent = `Total study group in : 0`
    }
    if(data.task == undefined){
        document.getElementById("task").textContent = `Total task tracking : 0`
    }
    document.getElementById("grp").textContent =`Total study group in : ${data.grp}`
    document.getElementById("task").textContent =`Total task tracking : ${data.task}`
})
}


function changePassword(){
    const userData = JSON.parse(localStorage.getItem("userData"))
    const userId = userData.id
    const form = document.getElementById("passwordForm")
    form.addEventListener(("submit"),(event)=>{
        event.preventDefault()
        const newPassword = document.getElementById("newPassword").value 
        const confirmPassword = document.getElementById("confirmPassword").value
 if(!newPassword || !confirmPassword){
    window.alert("missing fields required")
 }
 else{
    fetch("/profile/password", {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({password : confirmPassword, id : userId})
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
         window.alert("password updated")
    }
})
 }
       
    })
}

function editProfile(){
    const editTab = document.getElementById("editTab")
  editTab.addEventListener("click",()=>{
    editTab.className = "nav-link active"
    document.getElementById("summary").innerHTML = `
    <h1 class="mt-3"> Edit profile </h1>
    <form id="editForm"> 
    <div class="row mt-3">
    <div class="col-md-6 mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control s" id="email" placeholder="email">
    </div>

  <div class="col-md-6 mb-3">
      <label for="username" class="form-label">Username</label>
      <input type="username" class="form-control" id="username" placeholder="username">
    </div>

  </div>
 
   
 <div class="mb-3 mt-3">
      <label for="avatar" class="form-label">Avatar</label>
      <select id ="avatar" class="form-select" aria-label="Default select example">
        <img src="./images/bear.png">
          <option selected>pick one</option>
          <option value="../images/bear.png">bear</option>
          <option value="../images/chicken.png">chicken</option>
          <option value="../images/meerkat.png">meerkat</option>
        </select>
    </div>
   

    <div class="mb-3 mt-3">
      <label for="bio" class="form-label">Bio</label>
      <input type="bio" class="form-control" id="bio" placeholder="">
    </div>
    <div class="mt-3">
      <button type="submit" class="btn btn-primary d-block">edit</button>
    </div>
</div>  
</form>
    `
    document.getElementById("profileTab").className = `nav-link`
    document.getElementById("passwordTab").className = `nav-link`
    document.getElementById("deleteTab").className = `nav-link`
    editFormSubmit()
  })
}


function editFormSubmit(){
    const editForm = document.getElementById("editForm")
    editForm.addEventListener(("submit"),function(event){
        event.preventDefault()

        const userData = JSON.parse(localStorage.getItem("userData"))
        const userId = userData.id

    
        const email = document.getElementById("email").value
        const username = document.getElementById("username").value
        const avatar = document.getElementById("avatar").value
        const bio = document.getElementById("bio").value
        
       

        if(!email || !username || !avatar || !bio){
            window.alert("missing field required")
        }

else{
    console.log(email,avatar)
        fetch("/profile/edit", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email : email, username : username,avatar : avatar,bio : bio, id : userId})
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
                return response.json(response.body)
            }
        })
        .then(data => {
            const userData = data;
            localStorage.setItem("userData",JSON.stringify(userData));
            window.alert("user updated successfully")
        })
        .catch(error=>{
            console.error(error);
        })
    }
    })
}


function deleteCode(){
    let a = "abcdefg"
    let b = "ABCDEFG"
    let n = "1234567"

    let code = ""

    for(i=0; i<7; i++){
        const pick = Math.floor(Math.random()*7) 
        code += a[pick]
        code += b[pick]
        code  += n[pick]
    }
    console.log(code)
    return code 
}

function deleteForm(){
  const code = deleteCode()
  const deleteTab = document.getElementById("deleteTab")
  deleteTab.addEventListener("click",()=>{
    deleteTab.className = "nav-link active"
    document.getElementById("summary").innerHTML = `
    <h1 class="mt-3"> Delete user </h1>
    <form id="deleteForm"> 
    <h6> copy paste code below to delete user <h6>
    <label for="code" class="form-label">${code}</label>
    <input type="text" id="deleteCode" class="form-control">
    <button type="submit" class="btn btn-danger d-block mt-3">delete</button>
    </form>
    `
    document.getElementById("profileTab").className = `nav-link`
    document.getElementById("editTab").className = `nav-link`
    document.getElementById("passwordTab").className = `nav-link`

    deleteFormSubmit(code)
  })
}

function deleteFormSubmit(code){
    const userData = JSON.parse(localStorage.getItem("userData"))
    const userId = userData.id
    const form = document.getElementById("deleteForm")
    form.addEventListener(("submit"),(event)=>{
        event.preventDefault()
        const deleteCode = document.getElementById("deleteCode").value
 if(code != deleteCode){
    window.alert("wrong code")
 }
 else{
    fetch("/profile/delete", {
    method: "DELETE",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({id : userId})
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
        localStorage.removeItem("userData")
        localStorage.removeItem("token")
        window.alert("user deleted")
        window.location.href='../login.html'
    }
})
 }

    })
}





function filter(){
    const userData = JSON.parse(localStorage.getItem("userData"))
 const userId = userData.id

 const filter = document.getElementById("grpFilter")

 filter.addEventListener("click",()=>{
    fetch("/profile/filter/group", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({userId : userId})
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
        if(data.grp == undefined){
            document.getElementById("grp").textContent = `Total study group in where you are admin : 0`
        }
       
        document.getElementById("grp").textContent =`Total study group in where you are admin: ${data}`
    })
 })
 
}

function displayActivity (){
    const userData = JSON.parse(localStorage.getItem("userData"))
 const userId = userData.id
 fetch("/profile/activity", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({userId : userId})
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
    const date = []
    
    for(i=0; i<data.length; i++){
        date.push(data[i].login_timestamp.slice(0,10))
        // document.getElementById("activity").innerHTML += `<tr><th>${data[i].login_timestamp.slice(0,10)}</th></tr>`
    }


    const loginCounter = date.reduce((p,n)=>{
        p[n] = (p[n]||0) + 1
       return p
    },{})
    console.log(loginCounter)
     
    const array = Object.entries(loginCounter).map(([date,count])=>({
        date,count
    }))
  
    

    document.getElementById("sortData").addEventListener("click",()=>{
            const option = document.getElementById("sort").value
            console.log(option)
            if(option == "earliest"){
                earliestArray = [...array]
                document.getElementById("activity").innerHTML = ``
                earliestArray = earliestArray.reverse()
                earliestArray.forEach((e,i)=>{
                    document.getElementById("activity").innerHTML += `<tr class="shadow"><th class="h2" style="padding : 1em;">${e.date}</th><th class="h2" style="padding : 1em;">${e.count}</th></tr>`
                   })
            }
            else if(option == "most"){
                sortArray = [...array]
                document.getElementById("activity").innerHTML = ``
               sortArray = sortArray.sort((a,b)=> {return b.count - a.count})
               sortArray.forEach((e,i)=>{
                document.getElementById("activity").innerHTML += `<tr class="shadow"><th class="h2" style="padding : 1em;">${e.date}</th><th class="h2" style="padding : 1em;">${e.count}</th></tr>`
               })
            }
            
    })
   
        array.forEach((e,i)=>{
            document.getElementById("activity").innerHTML += `<tr class="shadow"><th class="h2" style="padding : 1em;">${e.date}</th><th class="h2" style="padding : 1em;">${e.count}</th></tr>`
           })
        
})
}

