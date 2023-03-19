const express = require('express')
const user = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

const router = new express.Router()
router.use(express.json())

router.post('/users',async (req,res)=>{
    const newUser = new user(req.body)

    try{
        // await newUser.save()
        const authToken = await newUser.generateAuthToken()
        res.status(201).send({newUser , token:authToken})
    }
    catch(error){
        res.status(400).send(error)
    }
})

router.post('/users/login',async (req,res)=>{

    try{
        const userLogin = await user.findByCredentials(req.body.email , req.body.password)
        const authToken = await userLogin.generateAuthToken()
        res.send({userLogin , token:authToken})
    }
    catch(error){
        if(error.message == 'Unable to login')
            res.status(400).send(error.message) // why am I getting string in error.message but empty obj in error
        else
            res.status(500).send(error)
    }
})

router.post('/users/logout',auth, async (req,res)=>{
    try{
        const userLogout = req.user
        userLogout.tokens = userLogout.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await userLogout.save()
        res.send('User logged out')
    }
    catch(error){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth, async (req,res)=>{
    try{
        const userLogout = req.user
        console.log(userLogout)
        userLogout.tokens = []
        await userLogout.save()
        res.send('User logged out from all devices')
    }
    catch(error){
        res.status(500).send()
    }
})

router.get('/users/me' , auth, async (req,res)=>{
    res.send(req.user)
})

router.patch('/users/me', auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowed = ['name','age','email','password']
    const flag = updates.every((update)=>{
        return allowed.includes(update)
    })

    if(!flag)
        return res.status(400).send('Invalid update request')

    try{
        // not using this coz this function interactts directly with mongodb bypassing our mongoose middleware
        // const userUpdate = await user.findByIdAndUpdate(_id,req.body,{ new:true , runValidators:true })
        const userUpdate = req.user
        updates.forEach((update)=>{
            userUpdate[update]=req.body[update]  // using bracket notation coz key is dynamic
        })

        await userUpdate.save()
        res.send(userUpdate)    
    }
    catch(error){
        if(error.name=='ValidationError') return res.status(400).send(error)
        if(error.valueType=='string') return res.status(404).send(error)
        res.status(500).send(error)
    }
})

router.delete('/users/me',auth ,async (req,res)=>{
    try{
        const userDelete = req.user
        await userDelete.remove()
        res.send('User deleted')
    }
    catch(error){
        res.status(500).send(error)
    }
})

const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        const name = file.originalname
        if(!(name.endsWith('jpg') || name.endsWith('jpeg') || name.endsWith('png'))){
            cb(new Error('Please upload an image'))
            return
        }
        cb(undefined , true)
    }
})

router.post('/users/me/avatar',auth, upload.single('avatar') ,async (req,res)=>{
    // console.log(req)
    // console.log(req.file)
    const imgBuffer = await sharp(req.file.buffer).resize({ width:250 , height:250 }).png().toBuffer()

    req.user.avatar = imgBuffer
    await req.user.save()
    res.send('Image uploaded')
},(error,req,res,next)=>{     // error handling in express
    res.status(400).send(error.message)
})

// router.get('/users/me/avatar',auth, (req,res)=>{
//     res.set('Content-Type','image/png')
//     res.send(req.user.avatar)
// })

router.delete('/users/me/avatar',auth ,async(req,res)=>{
    try{
        req.user.avatar = undefined
        await req.user.save()
        res.send('Image removed')
    }
    catch(error){
        res.status(500).send()
    }
})

module.exports = router