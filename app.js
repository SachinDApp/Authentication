//jshint esversion:6
require("dotenv").config();
const express= require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const bcrypt= require("bcrypt");


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

        bcrypt.hash(req.body.password, 12).then(function(hash) {
            // Store hash in your password DB.
            const username=req.body.username;
            const user=new User({
             userName:username,
             password:hash
           })
           user.save().then(()=>{
             res.render("secrets");
           }).catch((e)=>{
             res.send(e);
          });
        });
          
       }
    }).catch((e)=>{
        res.send(e);
    })
   
    
})


app.post("/login", function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({userName:username}).then((e)=>{
        if(e){
            bcrypt.compare(password, e.password).then(function(result) {
                // result == true
                if(result===true){
                    res.render("secrets");
                }
                else{
                    res.send("password is wrong");
                }
            });
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
