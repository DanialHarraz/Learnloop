const { log } = require('console');
const prisma = require('./prismaClient');

module.exports.getUser = function getUser(id) {
    return prisma.groupMember.count({
      where: {userId : id }
    }).then((data) => {
      return data
    })
  };

  module.exports.filter = function filter(id){
    return prisma.studyGroup.count({
      where: {createdBy : id}
    }).then((data) => {
      return data
    })
  }

  module.exports.getTask = function getTask(id) {
    return prisma.progressTracker.count({
      where: {userId : id }
    }).then((data) => {
      return data
    })
  };

module.exports.updatePassword = function updatePassword(password,id){
  return prisma.user.update({
    where: {
      id : id
    },
    data : {
      password : password
    }
  })
}

module.exports.editUser = function editUser(id,email,username,avatar,bio){
  return prisma.user.update({
    where:{
      id : id
    },
    
    data:{
      email : email,
      name: username,
      avatar : avatar,
      bio : bio
    }
  })
}

module.exports.deleteUser = function deleteUser(id){
  return prisma.user.delete({
    where:{
      id : id
    }
  })
}

module.exports.displayActivity = function displayActivity(id){
  var weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate()-7)
  weekAgo = weekAgo.toISOString()

  return prisma.userActivity.findMany({
    where:{
      userId : id,
      login_timestamp : {
        gte  : weekAgo
      }
    },
    orderBy : {
      login_timestamp : 'desc'
    }
  })
}

module.exports.addActivityData = function addActivityData(id,date){
  try{
    return prisma.userActivity.create({
    data : {
      userId : id,
      login_timestamp : date
    }
  })
}
catch(error){
  console.log(error)
}
}


module.exports.updateStatusOnline = function updatestatusOnline(id){
  return prisma.user.update({
    where : {
      id : id
    },
    data : {
      status : 'online'
    }
  })
}

module.exports.updateStatusOffline = function updatestatusOffline(id){
  return prisma.user.update({
    where : {
      id : id
    },
    data : {
      status : 'offline'
    }
  })
}