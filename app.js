//jshint esversion:6
require("dotenv").config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const md5=require("md5");


mongoose.connect("mongodb://127.0.0.1:27017/userDB").then(() => {
    console.log(`successfully connected`);
  }).catch((e) => {
    console.log(`not connected`);
  }); 

  const userSchema=new mongoose.Schema({
    userName:{
        type:String,
        required:[true]   
    },
    password:{
        type:String,
        required:[true]
    }
  });
  

  const User= mongoose.model("user",userSchema);

const app =express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

app.get("/", function(req, res){
    res.render("home");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){
    User.findOne({userName:req.body.username}).then((e)=>{
       if(e){
           res.send("you are already ragistered. please login");
          }
       else{
           const username=req.body.username;
           const password=md5(req.body.password);
           const user=new User({
            userName:username,
            password:password
          })
          user.save().then(()=>{
            res.render("secrets");
          }).catch((e)=>{
            res.send(e);
         });
       }
    }).catch((e)=>{
        res.send(e);
    })
   
    
})


app.post("/login", function(req,res){
    const username=req.body.username;
    const password=md5(req.body.password);
    User.findOne({userName:username}).then((e)=>{
        if(e){
            if(e.password===password){
               res.render("secrets");
            }else{
                res.send("password is wrong");
            }
        }
        else{
            res.send("username or password is wrong, please register if you havn't");
        }
          
    }).catch((e)=>{
        res.send("there is an error, please login again");
    })
})



app.listen(3000, function(req,res){
    console.log("server started at localhost 3000")
})
