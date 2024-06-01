const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const databasePath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log('DB Error: ${error.message}')
    process.exit(1)
  }
}

initializeDbAndServer()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  let query1 = `SELECT * FROM user WHERE username='${username}';`
  let user = await database.get(query1)
  if (user !== undefined) {
    response.status(400)
    response.send('User already exists')
  }
  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    if (user === undefined) {
      let hashedpassword = bcrypt.hash(request.body.password, 10)
      let query2 = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}','${name}','${hashedpassword}','${gender}','${location}');`
      let result = await database.run(query2)
      response.send('User created successfully')
    }
  }
})

app.post('/login/', async (request, response) => {
  let {username, password} = request.body
  let query1 = `SELECT * FROM user WHERE username='${username}';`
  let user = await database.get(query1)
  if (user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let match = await bcrypt.compare(password, user.password)
    if (match === true) {
      response.status(200)
      response.send('Login successs!')
    } else {
      response.status(200)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  let {username, oldPassword, newPassword} = request.body
  let query1 = `SELECT * FROM user WHERE username='${username}';`
  let user = await database.get(query1)
  let matched = await bcrypt.compare(oldPassword, user.password)
  if (user === undefined) {
    response.status(400)
    response.send('User not registered')
  }
  if (matched === false) {
    response.status(400)
    response.send('Invalid current password')
  } else {
    if (newPassword.length < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      let newhashedPassword = await bcrypt.hash(newPassword, 10)
      let query2 = `UPDATE user SET password='${newhashedPassword}' WHERE username='${username}';`
      let result = await database.run(query2)
      response.status(200)
      response.send('Password updated')
    }
  }
})
module.exports = app
