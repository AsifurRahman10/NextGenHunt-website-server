const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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
        const voteCollection = client.db('nextgenhuntDB').collection('vote')
        const reviewCollection = client.db('nextgenhuntDB').collection('review')

        // verify user token with middleware
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "forbidden access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "forbidden access" });
                }
                req.decoded = decoded;
                next();
            })
        }

        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role == "admin";
            if (!isAdmin) {
                res.status(401).send({ message: "unauthorized access" })
            }
            next();
        }

        // make jwt token and send it
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ token });
        })

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
        app.get('/product-details/:id', verifyToken, async (req, res) => {
            console.log(req.header);
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query);
            res.send(result);
        })

        // get all the review 
        app.get('/all-review', async (req, res) => {
            const result = await reviewCollection.find().sort({ _id: -1 }).toArray();
            res.send(result);
        })

        // save user info 
        app.post('/userInfo', async (req, res) => {
            const userData = req.body;
            const query = { email: userData.email }
            const data = await userCollection.findOne(query);
            if (data) {
                return res.status(409).send({ message: "User already exists" });
            }

            const result = await userCollection.insertOne(userData);
            res.send(result)
        })

        // post review of the user about product
        app.post('/post-review', async (req, res) => {
            const reviewData = req.body;
            const result = await reviewCollection.insertOne(reviewData);
            res.send(result);
        })

        // give vote
        app.patch('/vote/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: new ObjectId(id) };

            // check if already voted or not

            const checkVoted = await voteCollection.findOne({ email: data.email, productId: data.productId });
            if (checkVoted) {
                return res.status(409).send({ message: "You have already voted this product" })
            }
            const updateVote = {
                $inc: {
                    upvotes: 1
                }
            }
            const result = await productCollection.updateOne(filter, updateVote);
            const userVote = await voteCollection.insertOne(data);
            res.send(result);

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

