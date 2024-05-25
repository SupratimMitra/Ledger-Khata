const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const employeeSchema=new mongoose.Schema({
    name:String,
    phone:Number,
    password:String,
    company:String,
    location:String,
    cashin:Number,
    due:Number,
    trev: {
        type: Number, // Or String
        default: 0
    },
    tokens:[{
        token:{              //created for storing generated token
            type:String,
            required:true
        }
    }]
})


employeeSchema.methods.generateAuthToken = async function(){
    try{
        const token=jwt.sign({_id: this._id.toString()},process.env.SECRET_KEY);
        this.tokens=this.tokens.concat({token});
        await this.save();
        return token;
    }
    catch(error){
        res.send("the error part"+error);
        console.log("the error part"+error);
    }
};


const Register=new mongoose.model("members",employeeSchema);  //creating collection

module.exports=Register;
