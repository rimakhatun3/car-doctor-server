const express = require('express');
const jwt = require('jsonwebtoken')
const cors = require('cors');
require('dotenv').config()
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.wvicmmt.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifejwt =(req,res,next)=>{
  console.log(req.headers.authorization)
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unathorize access'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token,process.env.JWT_TOKEN_SECRET,(error,decoded)=>{
    if(error){
      return res.status(401).send({error:true,message:'unathorized access'})
    }
    req.decoded = decoded
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const docDataBase = client.db('cardoc').collection('service')
    const bookingDataBase = client.db('cardoc').collection('booking')


    // jwt server

    app.post('/jwt',(req,res)=>{
      const body = req.body;
      console.log(body)

      const token = jwt.sign(body,process.env.JWT_TOKEN_SECRET,{ expiresIn: '1h' })
      res.send({token})
    })


app.get('/service', async(req,res)=>{
    const qursor = docDataBase.find()
    const result =await qursor.toArray()
    res.send(result)
    
})


app.get('/service/:id',async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const query = {_id: new ObjectId(id)}

    
    const options = {
        
        // Include only the `title` and `imdb` fields in each returned document
        projection: {  title: 1, price: 1,service_id: 1, img: 1 },
      };

      const result = await docDataBase.findOne(query,options)
      res.send(result)
})

app.get('/booking',verifejwt, async(req,res)=>{

  const decoded = req.decoded
  if(decoded.email!== req.query.email){
    return res.send( {error:1, message:'forbiden access'})
  }
  let query = {}
  if(req.query?.email){
    query = {email:req.query.email}
  }
  const result = await bookingDataBase.find(query).toArray()
  res.send(result)
})

app.delete('/booking/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const result = await bookingDataBase.deleteOne(filter)
  res.send(result)
})

app.patch('/booking/:id',async(req,res)=>{
  const id = req.params.id;
  const newUpdate = req.body;
  const query = {_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
        status: newUpdate.status
    },
};

  const result =await bookingDataBase.updateOne(query,updateDoc)
  res.send(result)
})

app.post('/book',async(req,res)=>{
  const body = req.body;
  const result =await bookingDataBase.insertOne(body)
  res.send(result)
  console.log(result)
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/',(req,res)=>{
    res.send('port is running')
})



app.listen(port,()=>{
    console.log(`port is running 0n: ${port}`)
})