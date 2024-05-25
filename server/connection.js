const mongoose=require("mongoose"); 
/*
mongoose.connect("mongodb://localhost:27017/ekhata").then(()=>{
    console.log("successfully connected to the database")
}).catch((err)=>{
    console.log(err);
}); */


mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("successfully connected to the database")
}).catch((err)=>{
    console.log(err);
});
