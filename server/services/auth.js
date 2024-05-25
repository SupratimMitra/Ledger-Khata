const jwt=require("jsonwebtoken");
const Register=require("../models/schema.js")

const auth = async(req,res,next) =>{
    try{
        const token=req.cookies.jwt;
        const verifyUser = jwt.verify(token,"mynameissupratiksealandiamuniversitystudent");

        const user=await Register.findOne({_id:verifyUser._id})

        req.token=token;     //passing the user and token to access from other routes
        req.user=user;

        next();
    }
    catch(error){
        res.status(401).send("Invalid token");
    }
 
};

module.exports=auth; 