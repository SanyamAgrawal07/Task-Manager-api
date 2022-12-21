const express = require('express')
require('./db/mongoose')  // We dont need anything from it just to make sure it runs first and connects to the database

const app = express()
const port = process.env.PORT

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

app.listen(port, ()=>{
    console.log('app is running on '+port)
})

/*The app.use() function adds a new middleware to the app. Essentially,whenever a request 
hits your backend, Express will execute the functions you passed to app.use() in order*/
app.use(userRouter)
app.use(taskRouter)