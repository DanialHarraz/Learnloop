
const prisma = require('./prismaClient');

module.exports.checkUser = function checkUser(username) {
  return prisma.user.findMany({
    where: { name: username }
  }).then((data) => {
    return data
  })
};

module.exports.verifyUser = function verifyUser(username, password) {
  return prisma.user.findMany({
    where: {
      name: username
    }
  }).then((data) => {
    return data
  }).catch((error) => {
    throw error
  })
};



module.exports.registerUser = function registerUser(email, username, password, avatar, bio) {
  return prisma.user.create({
    data: {
      email: email,
      name: username,
      password: password,
      avatar: avatar,
      bio: bio
    }
  }).then((data) => {
    return data
  }).catch((error) => {
    console.error(error)
    throw error
  })
};

module.exports.checkDuplicateEmail = function checkDuplicateEmail(email) {
  return prisma.user.findMany({
    where: { email : email }
  }).then((data) => {
    return data
  })
};

