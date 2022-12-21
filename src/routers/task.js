const express = require('express')
const task = require('../models/task')
const auth = require('../middleware/auth')
const { default: mongoose } = require('mongoose')

const router = new express.Router()
router.use(express.json())

router.post('/tasks',auth ,async (req,res)=>{
    const newTask = new task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await newTask.save()
        res.status(201).send(newTask)
    }
    catch(error){
        res.status(400).send(error)
    }
})

router.get('/tasks',auth ,async (req,res)=>{
    const match={}
    if(req.query.completed){
        match.completed = (req.query.completed==='true')
    }
    if(req.query.description){
        match.description = req.query.description
    }

    const sort={}
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        // console.log(parts)
        sort[parts[0]] = (parts[1]==='desc'? -1 : 1)
        // console.log(sort)
    }

    try{
        await req.user.populate({
            path: 'userTasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            },
        })
        // const tasks = await task.find({ })
        res.send(req.user.userTasks) 
    }
    catch(error){
        res.status(500).send(error)
    }
})

router.get('/tasks/:id',auth ,async (req,res)=>{
    const _id = req.params.id
    // _id = mongoose.Types.ObjectId(_id)

    try{
        // const findTask = await task.findById(_id)  // Note that here we did not use objectId func(coz mongoose does that for us)
        const findTask = await task.findOne({ _id , owner: req.user._id })
        if(findTask) res.send(findTask)
        else{
            res.status(404).send('No task with this id')
        }
    }
    catch(error){
        if(error.valueType=='string') res.status(404).send(error)
        else res.status(500).send(error)
    }
})

router.patch('/tasks/:id', auth ,async (req,res)=>{
    const _id = req.params.id

    const updates = Object.keys(req.body)
    const allowed = ['description','completed']
    const flag = updates.every((update)=>{
        return allowed.includes(update)
    })

    if(!flag) 
        return res.status(400).send('Invalid update request')

    try{
        // const taskUpdate = await task.findByIdAndUpdate(_id,req.body,{ new:true , runValidators:true })
        // const taskUpdate = await task.findById(_id)
        const taskUpdate = await task.findOne({ _id , owner: req.user._id })
        if(!taskUpdate)
            res.status(404).send('No task found with this id')

        updates.forEach((update)=>{
            taskUpdate[update] = req.body[update]
        })
        await taskUpdate.save()
        res.send(taskUpdate)
    }
    catch(error){
        if(error.name=='ValidationError') return res.status(400).send(error)
        if(error.valueType=='string') return res.status(404).send(error)
        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', auth ,async (req,res)=>{
    const _id = req.params.id
    try{
        // const taskDelete = await task.findByIdAndDelete(_id)
        const taskDelete = await task.findOne({ _id , owner:req.user._id })
        if(!taskDelete)
            res.status(404).send('No task found with this id')
        else{
            taskDelete.remove()
            res.send(taskDelete)
        }
    }
    catch(error){
        res.status(500).send(error)
    }
})

module.exports = router