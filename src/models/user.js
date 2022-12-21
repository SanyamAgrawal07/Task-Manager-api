const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const task = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        required: true
    },
    age:{
        type: Number,
        default: 0,
        validate(value){
            if(value<0)
                throw new Error('Age cannot be negative')
        }
    },
    email:{
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: true,
        validate(value){
            // validator.normalizeEmail(value)    // not working
            if(!validator.isEmail(value))
                throw new Error('Invalid E-mail')
        }
    },
    password: {
        type: String,
        required:true,
        trim: true,
        validate(value){
            if(!validator.isStrongPassword(value,{ minLength:6,minSymbols:0 }))
                throw new Error('Min length 6,one upper,one number')
        }
    },
    tokens:[{
        token: {
        type: String,
        required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.pre('save',async function (next){
    const user=this

    if(user.isModified('password')){   // A method which will return positive when post and update change pass
        user.password = await bcrypt.hash(user.password,8)
    }

    next()
})

userSchema.pre('remove',async function(next){
    const userDelete = this
    await task.deleteMany({ owner:userDelete._id })
    next()
})

userSchema.statics.findByCredentials = async (email,password)=>{
    const userLogin = await user.findOne({email: email})
    if(!userLogin)
        throw new Error('Unable to login')
    const correctPassword = await bcrypt.compare(password,userLogin.password)
    if(correctPassword) 
        return userLogin
    else 
        throw new Error('Unable to login')
}

userSchema.virtual('userTasks',{
    ref: 'tasks',
    localField: '_id',
    foreignField: 'owner'
})

// Every object has a toJSON method that you can override to customize what the output of calling JSON.stringify() on that object will be
userSchema.methods.toJSON = function(){
    const userReturn = this.toObject()  // The toObject method is a method provided by Mongoose to clean up
    delete userReturn.password  // the object so it removes all of the metadata and methods (like .save() or
    delete userReturn.tokens  // .toObject()) that Mongoose attaches to it. It just becomes a regular object.
    delete userReturn.avatar

    return userReturn
}

userSchema.methods.generateAuthToken = async function(){
    const userLogin = this

    const token = jwt.sign({_id: userLogin._id.toString()},process.env.JWT_SECRET)
    userLogin.tokens.push({ token:token })
    await userLogin.save()
    return token
}

const user=mongoose.model('users',userSchema)

module.exports = user