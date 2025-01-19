const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express()


app.use(express.json());
app.use(cors());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USERID}:${process.env.PASSWORD}@cluster0.entf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    tls: true,
    serverSelectionTimeoutMS: 3000,
    autoSelectFamily: false,
});

async function run() {
    try {

        const productCollection = client.db('nextgenhuntDB').collection('products')
        const userCollection = client.db('nextgenhuntDB').collection('user')


        // get latest product for feature section
        app.get("/featureProducts", async (req, res) => {
            const result = await productCollection.find().sort({ timestamp: -1 }).limit(4).toArray();
            res.send(result);
        })

        // get 6 most voted products
        app.get('/trending', async (req, res) => {
            const result = await productCollection.find().sort({
                upvotes: -1
            }).limit(6).toArray();
            res.send(result);
        })

        // get individual product data
        app.get('/product-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query);
            res.send(result);
        })

        // save user info 
        app.post('/userInfo', async (req, res) => {
            const { userData, email } = req.body;
            const query = { email: email }
            const data = await userCollection.findOne(query);
            if (data) {
                res.status(409).send({ message: "User already exist" })
            }

            const result = await userCollection.insertOne(userData);
            res.send(result)
        })

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
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

