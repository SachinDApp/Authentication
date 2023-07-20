//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const findOrCreate=require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});


const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId:String,
  secrets:[String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  const use={_id:user._id, username:user.username}
  done(null, use);
});

passport.deserializeUser(function(user, done) {
  done(null, user)
});


passport.use(new GoogleStrategy({
  clientID:process.env.CLIENT_ID,
  clientSecret:process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"

 
},

function(request, accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));



app.get("/auth/google",  
      passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', {successRedirect:"/secrets" ,failureRedirect: '/login' })
  );

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  if (req.isAuthenticated()){
    User.findOne({googleId:req.user.googleId}).then((data)=>{
        if(data){
          res.render("secrets",{secrets:data.secrets});
        }
        else{
          res.render("secrets",{secrets:["you have discovered my secrets"]})
        }
    }).catch((err)=>{
        res.send(err);
    })
  
   
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/");
    }
    
  });
  
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res){
 
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){

    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.get("/submit", function(req, res){
    console.log(req.user);
    if(req.isAuthenticated()){
      res.render("submit");
    }
    else{
      res.redirect("login");
    }
})

app.post("/submit", function(req, res){
     
     const id=req.user._id;
     
     User.updateOne({_id:id},{$push:{secrets:req.body.secret}}).then((user)=>{
         if(user){
           res.redirect("/secrets");
         }
     }).catch((err)=>{
      res.send(err);
     })
})



app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
