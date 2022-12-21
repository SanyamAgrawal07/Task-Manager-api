const jwt = require('jsonwebtoken')
const user = require('../models/user')


const auth = async (req,res,next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ','')
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const userAuth = await user.findOne({ _id:decoded._id , 'tokens.token':token })
        if(!userAuth){
            throw new Error()
        }
        req.token = token
        req.user = userAuth
        next()
    }
    catch(error){
        res.status(401).send('Unauthorized user')
    }
}

module.exports = auth