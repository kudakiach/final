var express = require('express');
var router = express.Router();
const fs = require('fs');
const testFolder = './public/images/';
const user = require('./user.json');
const path = require('path');
// const mongoose = require('mongoose');

// // initializing cloud.mongoDB string
// const uri ="mongodb+srv://root:abcd1234@myapp-prthu.mongodb.net/nodeApp?retryWrites=true&w=majority";
// //mongodb+srv://<username>:<password>@myapp-prthu.mongodb.net/test?retryWrites=true&w=majority

// // mongodb+srv://mike:abcd1234@cluster0-mqzf7.mongodb.net/test?retryWrites=true&w=majority
// // use mongoose to connect with the cloud mongoDB database
// mongoose.connect(uri,{useNewUrlParser:true},(err) => {
//   if(!err){
//     console.log('mongodb connected')
//   }else{ console.log(' connection error')}
// })

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const dbURI = "mongodb+srv://root:abcd1234@myapp-prthu.mongodb.net/nodeApp?retryWrites=true&w=majority";

var promise = mongoose.connect(dbURI, {
  useMongoClient: true,
  /* other options */
});

mongoose.connection.on('connected', () => {
        console.log(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
});

mongoose.connection.on('error', err => {
        console.log('Mongoose connection error:', err);
});

var gallerySchema = new mongoose.Schema({
  filename:{
    type:String,
    required:'This field is required'
  },
  description:{
    type:String,
    required:'This field is required'
  },
  price:{
    type:Number,
    required:'This field is required'
  },
  status:{
    type:String,
    required:'This field is required'
  }
})
galleryModel = mongoose.model('gallery', gallerySchema);


router.get('/addFile', function(req,res){
  res.render('add',{title:'add gallery'})
})



router.post('/addfile', function(req, res){
  if(!req.body){
    return res.status(400).send("res.body not found")
  }
  const product = {
    filename:req.body.filename,
    description:req.body.description,
    price:req.body.price,
    status:req.body.status
  }

  var model = new galleryModel(req.body);
  model.save()
    .then(doc => {
      if(!doc || doc.length ===0){
        return res.status(500).send(doc);
      }else{
        return res.status(201).render('./add',{success:'product Added'});
        console.log(product);
      }
    })
    .catch(err => {
      res.status(500).json(err)
    })
})

/* GET home page. */
router.get('/dashboard', requireLogin, function (req, res, next) {
  let filenameArray = [];
  console.log(req.session.user, "uuuu");
  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
      console.log(file);
      filenameArray.push(file);
    });
  });
  res.render('index', { title: 'Welcome to the Food Gallery', condition: true, anyArray: filenameArray, username: req.session.user.username });
});


router.post('/dashboard', requireLogin, (req, res) => {
  console.log(req.body);
  console.log("inside");
  tempFileName = req.body.id;
  imagepath = path.join(tempFileName);
  let imagesArr = [];
  let filenameArray = [];
  imagesArr.push(imagepath);
  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
      console.log(file);
      filenameArray.push(file);
    });
  });
  res.render('index', { title: 'Welcome', image: true, images: imagesArr, anyArray: filenameArray, username: req.session.user.username });
})



router.get('/', function (req, res, next) {
  res.render('login', {
    'title': 'Login'
  });
});

router.post('/', (req, res) => {
  let error = '';
   galleryModel.updateMany({},{$set:{status:'A'}},(err, docs)=>{
          if(!err){
            console.log("updated")
          }else{
            console.log("Failed");
          }
      })

  if (user.hasOwnProperty(req.body.username)) {
    if (user[req.body.username] == req.body.password) {
      let userobj = {};
      userobj.username = req.body.username;
      userobj.password = req.body.password;
      console.log(userobj, "<<<<");
      req.session.user = userobj;
      console.log(req.session, "sess");
      res.redirect('/gallery');
     
    } else {
      error = 'Incorrect password';
      res.render('login', {
        'title': 'Login',
        errors: error
      });
    }
  } else {
    error = 'Not a registered username';
    res.render('login', {
      'title': 'Login',
      errors: error
    });
  }

})


router.get('/logout', function (req, res) {
  req.session.reset();
  res.redirect('/');
});


function requireLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
  } else {
    next();
  }
};

// read product data from mongoDB atlas
router.get('/gallery', function(req, res){
  galleryModel.find({ status: 'A' },(err, docs) =>{
    if(!err){
      res.status(201).render('./index', {product:docs, username:req.session.user.username, title:"Welcome To gallery page"})
    }else{
     res.status(500).json(err);
    }
  })
})

router.get('/gallery/:id', function(req, res){

  galleryModel.findById(req.params.id,(err, docs) =>{
    if(!err){
      res.status(201).render('./product', {product:docs, username:req.session.user.username, title:"Buy this Image"})
    }else{
     res.status(500).json(err);
    }
  })
})

router.post('/buy', function(req, res){
  
  galleryModel.findOneAndUpdate({_id:req.body.productId},{$set:{status:'S'}},(err, docs)=>{
     if(!err){
      res.status(201).redirect('./gallery')
    }else{
     res.status(500).json(err);
    }
    
  })
    
})
router.post('/cancel', function(req, res){
  res.status(201).redirect('./gallery');
})





module.exports = router;
