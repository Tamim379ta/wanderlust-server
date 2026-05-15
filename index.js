const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs')

const uri = process.env.MONGO_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors({
  origin: "https://wanderlust-eight-topaz.vercel.app",
  credentials: true
}))
app.use(express.json())

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
)
const middleware = async (req, res, next) => {
  const header = req.headers.authrization;
  const token = header.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "unauthroized" })
  }
  const { payload } = await jwtVerify(token, JWKS)

  next()
}

async function run() {
  try {
    // await client.connect();

    const database = client.db("wanderlust");
    const destinationCollection = database.collection("destination");
    const bookingCollection = database.collection("bookings");

    app.post('/bookings', middleware, async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.json(result)
    })

    app.get('/bookings/:userId', async (req, res) => {
      const { userId } = req.params
      const result = await bookingCollection.find({ userId }).toArray()
      res.json(result)
    })

    app.delete('/bookings/:bookingId', async (req, res) => {
      const { bookingId } = req.params
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId)
      })
      res.json(result)
    })

    app.post('/destination', async (req, res) => {
      const destination = req.body;
      const result = await destinationCollection.insertOne(destination);

      res.json(result);
    })

    app.get('/destination', async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.json(result);
    })

    app.get('/destination/:id', middleware, async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id)
      }
      const result = await destinationCollection.findOne(query)
      res.send(result)
    })

    app.patch('/destination/:id', async (req, res) => {
      const id = req.params.id;

      const updatedData = req.body;

      const result = destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      )
      res.json(result)
    })

    app.delete('/destination/:id', async (req, res) => {
      const id = req.params.id;
      const result = await destinationCollection.deleteOne({
        _id: new ObjectId(id)
      })
      res.json(result)
    })


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
