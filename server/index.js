require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const hbs=require("hbs");
const mongoose=require("mongoose");
//const session = require("express-session");
const nodemailer=require("nodemailer");
const cookieParser=require("cookie-parser");  //for getting the cookies 
require("./connection.js")   //connecting database
const Register=require("./models/schema.js")  //connecting schema
const auth = require("./services/auth.js");


const app=express();   //initailizing express
app.use(cookieParser());  //using parser as a middleware



app.set('view engine', 'hbs'); //initializing hbs

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.json());


app.use(express.static("./client/src")); //defining path of static resources

//shopkeeper's customer schema
const customerSchema = new mongoose.Schema({
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    due: {
      type: Number,
      default: 0
    },
    cashin: {
      type: Number,
      default: 0
    }
});



app.get("/",(req,res)=>{
    const jwtCookie = req.cookies.jwt;

    if (jwtCookie) {
        // Redirect user to home page if token is present
        return res.redirect("/home");
    } 
    res.render("login");
});
app.get("/home",auth,(req,res)=>{
    res.status(200).render("home");
});
app.get("/contact",auth,(req,res)=>{
    res.status(200).render("contact");
    console.log(req.cookies.jwt);
});


app.get("/about",auth,(req,res)=>{
    res.status(200).render("about");
});

app.get("/terms",(req,res)=>{
    res.status(200).render("terms");
});

app.get("/dashboard",auth,async(req, res) => {
    try {
        const token=req.token;   //storing token
        const data = await Register.find({ "tokens.token" : token }); //getting the document corresponds the token
        //storing phone number to create schema
        const phone = data.length > 0 ? data[0].phone.toString() : null;
        console.log("Phone number:", phone);

        const Customer = mongoose.model(phone, customerSchema); // Get the dynamically created collection
        const customers = await Customer.find(); // Fetch all documents from the dynamic collection
        res.status(200).render("dashboard", { data, customers }); // Pass both sets of data to the view
    } catch (err) {
        console.log("Error from dashboard: " + err);
        res.status(500).send("Server Error");
    }
});


app.post("/register",async(req,res)=>{
    try{
        const password=req.body.password;
        const cpassword=req.body.cpassword;
        const phone=req.body.phone;

        if(password===cpassword){
            const registerEmployee=new Register({
                name:req.body.name,
                phone:req.body.phone,
                password:req.body.password,
                company:req.body.company,
                location:req.body.location,
                cashin:"0.00",
                due:"0.00",
                trev:"0.00",
        })
        await registerEmployee.save();
        res.status(200).render("login",{ message: "Registered successfully,Now you can login" });
        }
        else{
            res.status(400).render("login",{ message: "Password not matching,try again" });
        }
    }
    catch(error){
        console.log(error);
    }

})
app.post("/login",async(req,res)=>{
    try{
        const phone=req.body.phone;
        const password=req.body.password;

        const data=await Register.findOne({phone:phone});

        token=await data.generateAuthToken(); //middleware for generating token during login
        //storing token in cookie (at registering)
        res.cookie("jwt",token,{
            expires:new Date(Date.now()+604800000),
            httpOnly:true
        });

        if(data.password===password){
            res.status(201).redirect("/home");
        }
        else{
            res.status(400).render("login",{message:"Invalid credentials"});
        }
    }
    catch(err){
        res.status(400);
        console.log(err);
        res.render("login",{message :"User does not exists,please register"})
    }
});


app.post('/cash-in',auth, async (req, res) => {
    try {
        const totalAmount = req.body.totalAmount;   //fetching total amount

        const token=req.token;   //storing token
        console.log(token);
        const data = await Register.find({ "tokens.token" : token }); //getting the document corresponds the token
        //storing phone number to create schema
        const phone = data.length > 0 ? data[0].phone.toString() : null;
        console.log("Phone number:", phone);

           
        const Customer = mongoose.model(phone, customerSchema);
        const customerName = req.body.name;   //getting name from form
        const customerPhone=req.body.phone;   //getting number from form

        // Check if customer exists
        const existingCustomer = await Customer.findOne({ phone : customerPhone });

        if (!existingCustomer) {
            // Create a new customer document
            const dummyCustomer = new Customer({
                name: customerName,
                phone: customerPhone,
                cashin: "0.00",
                due: "0.00",
                // Add additional fields as needed
            });
            await dummyCustomer.save();
        }

        console.log('Received updated cash:', totalAmount);

        const register = await Register.findOne({ phone: phone });

        // Calculate the new value for trev and updating employee schema
        const newTrev = register.due + totalAmount + register.cashin;
        await Register.findOneAndUpdate(
            { phone: phone },
            { 
                $inc: { cashin: totalAmount },
                $set: { trev: newTrev }
            }
        );
        //updating customer schema
        await Customer.findOneAndUpdate(
            { phone: customerPhone },
            { 
                $inc: { cashin: totalAmount },
            }
        );

        res.redirect("/home");
    } 
    catch (error) {
        console.error('Error updating cash in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/due',auth, async (req, res) => {
    try {
        const totalAmount = req.body.totalAmount;  //fetching total amount from js

        const token=req.token;   //storing token
        console.log(token);
        const data = await Register.find({ "tokens.token" : token }); //getting the document corresponds the token
        //storing phone number to create schema
        const phone = data.length > 0 ? data[0].phone.toString() : null;
        console.log("Phone number:", phone);

        const Customer = mongoose.model(phone, customerSchema);
        const customerName = req.body.name;
        const customerPhone=req.body.phone;


        // Check if customer exists
        const existingCustomer = await Customer.findOne({ phone: customerPhone });

        if (!existingCustomer) {
            // Create a new customer document
            const dummyCustomer = new Customer({
                name: customerName,
                phone: customerPhone,
                cashin: "0.00",
                due: "0.00",
            });
            await dummyCustomer.save();
        }
        
        console.log('Received updated due amount:', totalAmount);
    
        const register = await Register.findOne({ phone: phone });
        // Calculate the new value for trev
        const newTrev = register.due + totalAmount + register.cashin;
        await Register.findOneAndUpdate(
            { phone: phone },
            { 
                $inc: { due: totalAmount },
                $set: { trev: newTrev }
            }
        );
        //updating customer schema
        await Customer.findOneAndUpdate(
            { phone: customerPhone },
                { 
                    $inc: { due: totalAmount },
                }
            );
        res.redirect("/home")
    } 
    catch (error) {
        console.error('Error updating due:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post("/mail", (req, res) => {
    const name=req.body.name;
    const phone=req.body.phone;
    const message=req.body.message;

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    });

    const mailOptions = {
        from: {
            name: "LedgerKhata",
        },
        to: process.env.EMAIL,
        subject: "notification",
        text: `Name: ${name}\nPhone: ${phone}\nMessage: ${message}`,
    };

    // Send email using Nodemailer
    transporter.sendMail(mailOptions)
        .then(() => {
            console.log("Email has been sent successfully");
            res.render("contact",{message:"Email has been sent successfully"});
        })
        .catch((err) => {
            console.error("Error sending email:", err);
            res.status(500).send("Error sending email");
        });
});

app.post('/reset',auth, async(req, res) => {
    try{
    const phoneNumber = req.body.phoneNumber;

    const token=req.token;   //storing token
    console.log(token);
    const data = await Register.find({ "tokens.token" : token }); //getting the document corresponds the token
    //storing phone number to create schema
    const phone = data.length > 0 ? data[0].phone.toString() : null;
    console.log("Phone number:", phone);

    console.log('Reset button clicked for phone number:', phoneNumber);
    // Handle further actions here
    const Customer = mongoose.model(phone, customerSchema);  //defining again to access inside this scope
    const customerData = await Customer.findOne({ phone: phoneNumber });
    const due=customerData.due;
    console.log(due);
    //updating the customer's details
    await Customer.findOneAndUpdate(
        { phone: phoneNumber },
        { 
            due: "0.00",
            $inc: { cashin: due },
            
        }
    )
    //updating the user's details
    await Register.findOneAndUpdate(
        { phone: phone },
        { 
            $inc: { due: -due , cashin: due },

        }
    );
    console.log("Reset successful");
    res.render("dashboard");
    }
    catch(err){
        console.log(err);
    }
});

app.get("/logout",auth,async(req,res)=>{
    try{

        //deleting curren token from database (logout single user)
        req.user.tokens=req.user.tokens.filter((currEle)=>{
            return currEle.token!== req.token
        })
        

        //removing all tokens from database(logout all users)
        //req.user.tokens=[];

        res.clearCookie("jwt");  //deleteing cookie from browser
        console.log("logout successfully");
        await req.user.save(); //saving after performing delete
        res.redirect("/");
    }
    catch(error){
        res.status(500).send("invalid credentials");
    }
})

app.get("*",(req,res)=>{
    res.status(404).send("404 Error : Page Not Found");
});

app.listen(process.env.PORT,()=>{
    console.log('Server listening on port 8000');
});
