const secretKey = 'your-secret-key';
async function RandomIDGen() {
  let opt = true;
  let RandomID;
  try {
    const ids = await todos.find({}, 'id');
    const idList = ids.map(doc => doc.id);

    while (opt) {
      RandomID = Math.floor(Math.random() * 1000000) + 1;
      if (!idList.includes(RandomID)) {
        opt = false;
      }
    }

    return RandomID;
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to be handled further up the call stack
  }
}

  async function removeTodoFromUser(username, todoObject) {
    try {
      const user = await User.findOne({ username }).exec();
  
      if (!user) {
        return false;
      }
  
      const todoIndex = user.TodoList.findIndex(todo => todo.equals(todoObject._id));
  
      if (todoIndex === -1) {
        return false;
      }
  
      user.TodoList.splice(todoIndex, 1);
      await user.save();
      return true;
    } catch (error) {
      return false;
    }
  }
  function Authenticator(req,res,next){
    let auth = req.headers.authorization
    if(auth){
        let hash_key = auth.split(" ")[1]
        jwt.verify(hash_key,secretKey, (err,data) => {
            if(err){
                return res.sendStatus(403)
            }
            req.user = data
            next();
        })
    }else{
        res.sendStatus(401)
    }
  }
  
  const express = require('express');
  const bodyParser = require('body-parser');
  const jwt = require('jsonwebtoken');
  const mongoose = require('mongoose');

  const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    TodoList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'todos' }]
  });

  const todoSchema = new mongoose.Schema({
    title: String,
    description: String,
    id: Number
  })
  const User = mongoose.model('User', userSchema);
  const todos = mongoose.model('todos',todoSchema);
  mongoose.connect("mongodb+srv://Mansoor:" + encodeURIComponent("Mansoor@102") + "@cluster0.s67fgzn.mongodb.net/TodoApp",{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "TodoApp" })
  const app = express();
  const port = 3000; 
  app.listen(port,() => {console.log(`Listening on ${port}`)});
  
  
  app.use(bodyParser.json());

  app.get("/", (req,res) => {
    res.sendFile(__dirname + "/index.html")
  })

  app.post("/signup",async (req,res) => {
    let body = req.body
    let insertOb = {username: body.username, password: body.password}
    const fellow = await User.findOne({username : insertOb.username})
    if(fellow){
        res.status(403).json({ message: 'User already exists' });
    }else{
        const newUser = User(insertOb)
        await newUser.save()
        const token = jwt.sign(insertOb, secretKey,{expiresIn : '1hr'});
        res.json({message : "User signed in Successfully", token: token})
    }
  })
    
  app.post("/login",async (req,res) => {
    let body = { username: req.body.username, password: req.body.password}
    let fellow = await User.findOne({username : body.username, password: body.password})
    if(fellow){
        const token = jwt.sign(body,secretKey,{expiresIn : '1hr'})
        res.send({message: "Login Successfull", token: token})
    }else{
        res.status(403).json({
            message: "Username or Password is incorrect",
        })
    }
  })



  app.get("/todos",Authenticator, async (req,res) => {
    const user = await User.findOne({username: req.user.username, password: req.user.password})
    res.status(200).json(user.TodoList);   
  })
  
  app.get("/todos/:id",Authenticator,async (req,res) => {
    const user =  await User.findOne({username: req.user.username, password: req.user.password})
    let ID = req.params.id;
    let list = user.TodoList
    let fellow = list.find(a => a.id === parseInt(ID))
    if(fellow){
      res.status(200).json(fellow);
    }
    else{
      res.sendStatus(404);
    }
  })
  
  app.post("/todos",Authenticator,async (req,res) => {
    let l = await RandomIDGen();
    let InsertObj = {};
    InsertObj.title = req.body.title
    InsertObj.description = req.body.description
    InsertObj.id = l;
    const newTodo = new todos(InsertObj)
    await newTodo.save()
    let newerTodo = await todos.findOne({id : l})
    const user = await User.findOne({username: req.user.username, password: req.user.password})
    user.TodoList.push(newerTodo)
    await user.save()
    let obj = {
      id : l
    }
    res.status(201).send(obj);
  })
  
  app.put("/todos/:id", Authenticator, async (req, res) => {
    let ID = req.params.id;
    ID = parseInt(ID)
    let user = await User.findOne({
      username: req.user.username,
      password: req.user.password
    });
    let list = user.TodoList;
    let fellow = list.find(a => a.id === ID);
    let todo = await todos.findOne({ id: ID });
    let body = req.body;
  
    if (fellow && todo) {
      todo.title = body.title;
      todo.description = body.description;
      await todo.save();
  
      let newList = removeTodoFromUser(req.user.username, fellow);
      if (newList) {
        user.TodoList.push(todo);
        await user.save();
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } else {
      res.sendStatus(404);
    }
  });
  
  app.delete("/todos/:id",Authenticator,async (req,res) => {
    let ID = req.params.id;
    ID = parseInt(ID)
    let imp = await todos.findOne({id: ID})
    let user = await User.findOne({username: req.user.username, password: req.user.password})
    let bd = user.TodoList.find(a => a.id === parseInt(ID))
    if(imp && bd){
      let anotherImp = await todos.findOneAndDelete({id: ID})
      let anotherBd = await removeTodoFromUser(user.username,imp)
      if(anotherImp && anotherBd){
        res.sendStatus(200);
      }else{
        res.sendStatus(404)
      }
    }else{
      res.sendStatus(404);
    }
  })
  
  app.use((req,res,next) => {
    res.sendStatus(404);
  })
  