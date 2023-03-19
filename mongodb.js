const mongoDB = require('mongodb')
const MongoClient = mongoDB.MongoClient
const objectId = mongoDB.ObjectId

const connectionURL = process.env.MONGODB_URL
const databaseName = 'task-manager'

MongoClient.connect(connectionURL , { useNewUrlParser: true } , (error,client)=>{
    if(error){
        console.log('Unable to connect')
        return
    }
    
    const db=client.db(databaseName)

    db.collection('users').deleteOne({ name:'sanyam' })
    .then((result)=>{
        console.log(result)
    })
    .catch((error)=>{
        console.log(error)
    })
})