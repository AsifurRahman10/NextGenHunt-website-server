const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express()


app.use(express.json());
app.use(cors());


const { MongoClient, ServerApiVersion } = require('mongodb');
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

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
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

