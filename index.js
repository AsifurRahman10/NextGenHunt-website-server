const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const nodemailer = require("nodemailer");
const stripe = require("stripe")(`${process.env.Stripe_key}`);
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

const sendEmail = (emailAddress, emailData) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASSWORD,
        },
    });
    transporter.verify((error, success) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log("transporter is ready", success);
        }
    })
    const mailBody = {
        from: process.env.MAILER_EMAIL, // sender address
        to: emailAddress, // list of receivers
        subject: "Payment successful, Welcome to NextGenTech premium", // Subject line
        html: ` <p> ${emailData?.message}</p> `, // html body
    }
    transporter.sendMail(mailBody, (error, success) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Email Sent: ' + info?.response)
        }
    });
}


async function run() {
    try {

        const productCollection = client.db('nextgenhuntDB').collection('products')
        const userCollection = client.db('nextgenhuntDB').collection('user')
        const voteCollection = client.db('nextgenhuntDB').collection('vote')
        const reviewCollection = client.db('nextgenhuntDB').collection('review')
        const paymentCollection = client.db('nextgenhuntDB').collection('payments')
        const couponCollection = client.db('nextgenhuntDB').collection('coupons')
        const featureCollection = client.db('nextgenhuntDB').collection('feature')
        const blogsCollection = client.db('nextgenhuntDB').collection('blogs')
        const commentsCollection = client.db('nextgenhuntDB').collection('comments')

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
            const userType = user?.role == "admin";
            if (!userType) {
                res.status(401).send({ message: "unauthorized access" })
            }
            next();
        }
        // verify user
        const verifyUser = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            const userType = user?.role == "user";
            if (!userType) {
                res.status(401).send({ message: "unauthorized access" })
            }
            next();
        }
        // verify moderator
        const verifyModerator = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            const userType = user?.role == "moderator";
            if (!userType) {
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

        // get all products
        app.get('/all-products', async (req, res) => {
            const search = req.query.search || "";
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const sort = req.query.sort;
            let query = { status: "accepted" };
            if (search) {
                query = {
                    $and: [
                        {
                            allTag: {
                                $elemMatch: {
                                    text: { $regex: new RegExp(search, "i") }
                                }
                            }
                        },
                        { status: "accepted" }
                    ]
                }


            }
            const skip = page > 1 ? (page - 1) * size : 0;

            const sortOptions = {};

            if (sort === 'vote') {
                sortOptions.upvote = -1
            }

            if (sort === 'title') {
                sortOptions.productName = 1
            }
            const result = await productCollection.find(query).skip(skip).limit(size).sort(sortOptions).toArray();
            res.send(result)
        })

        // add blog 
        app.post('/add-blog', async (req, res) => {
            const blogData = req.body;
            const result = await blogsCollection.insertOne(blogData);
            res.send(result);
        })

        // get blogs
        app.get('/blogs', async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result)
        })

        // get a single product
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(filter);
            res.send(result);
        })

        // get the latest blog
        app.get('/blogs/latest', async (req, res) => {
            const result = await blogsCollection.find().sort({ _id: -1 }).limit(3).toArray();
            res.send(result)
        })

        // get comment data 
        app.get('/all-comment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { productId: id };
            const result = await commentsCollection.find(query).sort({ _id: -1 }).toArray();
            res.send(result);
        })

        // add comment
        app.post('/add-comment', async (req, res) => {
            const commentData = req.body;
            const result = await commentsCollection.insertOne(commentData);
            res.send(result);
        })

        // get all data for moderator
        app.get('/all-products-sorted', verifyToken, verifyModerator, async (req, res) => {
            // const result = await productCollection.find().sort({ status: -1 }).toArray();
            // res.send(result);
            const result = await productCollection.aggregate([
                {
                    $addFields: {
                        sortPriority: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ["$status", "pending"] }, then: 1
                                    },
                                    {
                                        case: { $eq: ["$status", "accepted"] }, then: 2
                                    },
                                    {
                                        case: { $eq: ["$status", "rejected"] }, then: 3
                                    },
                                ],
                                default: 4,
                            }
                        }
                    }
                },
                { $sort: { sortPriority: 1 } },
                { $project: { sortPriority: 0 } }
            ]).toArray();
            res.send(result)
        })

        // product count for pagination
        app.get('/count', async (req, res) => {
            const query = { status: { $ne: "pending" } };
            const result = await productCollection.countDocuments(query);
            res.send({ result })
        })

        // get latest product for feature section
        app.get("/featureProducts", async (req, res) => {
            const result = await featureCollection.aggregate([
                {
                    $addFields: {
                        productIdObject: { $toObjectId: "$productId" }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productIdObject",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true }
                },
                {
                    $addFields: {
                        upvote: "$productDetails.upvote",
                        product_description: "$productDetails.product_description",
                        productName: "$productDetails.productName",
                        image: "$productDetails.image",
                        allTag: "$productDetails.allTag"
                    }
                },
                {
                    $project: {
                        productDetails: 0, // Remove the nested productDetails object
                        productIdObject: 0 // Remove temporary object field if unnecessary
                    }
                },
                {
                    $sort: { "timestamp": -1 }
                },
                {
                    $limit: 4
                }
            ]).toArray()
            res.send(result);
        })

        // get 6 most voted products
        app.get('/trending', async (req, res) => {
            const result = await productCollection.find().sort({
                upvote: -1
            }).limit(6).toArray();
            res.send(result);
        })

        // get individual product data
        app.get('/product-details/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query);
            res.send(result);
        })

        // get all the review 
        app.get('/all-review/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                productId: id
            };
            const result = await reviewCollection.find(query).sort({ _id: -1 }).toArray();
            res.send(result);
        })

        // get user info
        app.get('/user-info/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await userCollection.findOne(query);
            res.send(result)
        })

        // check status
        app.get('/subscription-check/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await paymentCollection.findOne(query);
            res.send(result);
        })

        // get product my user email
        app.get('/products/:email', verifyToken, verifyUser, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })


        // get all the user
        app.get('/all-users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        // get the reported content
        app.get('/reported', verifyToken, verifyModerator, async (req, res) => {
            const query = { isReported: true };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })

        // get count for dashboard
        app.get('/statistics', verifyToken, verifyAdmin, async (req, res) => {
            const email = req.decoded.email;

            // total money
            const revenue = await paymentCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalMoney: { $sum: "$price" }
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalMoney: 1
                    }
                }
            ]).toArray();

            // total products
            const totalProducts = await productCollection.estimatedDocumentCount();

            // total user
            const totalUser = await userCollection.estimatedDocumentCount();

            // pending products

            const query = { status: "pending" }

            const pendingProducts = await productCollection.countDocuments(query);

            // number of reviews
            const totalReviews = await reviewCollection.estimatedDocumentCount()

            const totalMoney = revenue.length > 0 ? revenue[0] : {};
            res.send({ totalMoney, "Total Product": totalProducts, "Total User": totalUser, pendingProducts, "Total Reviews": totalReviews })
        })

        // get all coupon
        app.get('/all-coupons', async (req, res) => {
            const result = await couponCollection.find().toArray();
            res.send(result);
        })

        // get a single coupon
        app.get('/coupon-details/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await couponCollection.findOne(query);
            res.send(result);
        })

        // get use role
        app.get('/user-role/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send({ userRole: result.role });
        })

        // add product to feature collection
        app.post('/feature', verifyToken, verifyModerator, async (req, res) => {
            const productData = req.body;
            const result = await featureCollection.insertOne(productData);
            res.send(result);
        })

        // add coupon data to db
        app.post('/add-coupon', verifyToken, verifyAdmin, async (req, res) => {
            const couponData = req.body;
            const result = await couponCollection.insertOne(couponData);
            res.send(result);
        })

        // add new product to db
        app.post('/add-products', verifyToken, verifyUser, async (req, res) => {
            const productData = req.body;
            const query = { email: productData?.email }
            const checkAlreadyPosted = await productCollection.findOne(query);
            const userType = await userCollection.findOne(query);
            if (userType?.userType === "free" && checkAlreadyPosted) {
                return res.status(409).send({ message: "You have exceeded your post limit as a free user. Upgrade to premium for unlimited post access." });
            }
            const result = await productCollection.insertOne(productData);
            res.send(result);
        })

        // stripe payment intent
        app.post('/create-payment-intent', verifyToken, verifyUser, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: [
                    "card",
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // payment info saved to db
        app.post('/paymentInfo', verifyToken, verifyUser, async (req, res) => {
            const paymentData = req.body;
            const result = await paymentCollection.insertOne(paymentData);
            if (result?.insertedId) {
                sendEmail(paymentData?.email, {
                    message: `You've placed an order successfully. Transaction Id: ${paymentData?.transactionId}`,
                })
            }
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

        // update Coupon
        app.patch('/update-coupon/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    couponCode: updateData.couponCode,
                    couponDescription: updateData.couponDescription,
                    discountAmount: updateData.discountAmount,
                    expireDate: updateData.expireDate,
                }
            };
            const result = await couponCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        // post review of the user about product
        app.post('/post-review', verifyToken, verifyUser, async (req, res) => {
            const reviewData = req.body;
            const result = await reviewCollection.insertOne(reviewData);
            res.send(result);
        })

        // upgrade free user to premium
        app.patch('/upgrade-user/:email', verifyToken, verifyUser, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const updateDoc = {
                $set: { userType: "premium" }
            }
            const result = await userCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        // give vote
        app.patch('/vote/:id', verifyToken, verifyUser, async (req, res) => {
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
                    upvote: 1
                }
            }
            const result = await productCollection.updateOne(filter, updateVote);
            const userVote = await voteCollection.insertOne(data);
            res.send(result);

        })

        // report a post
        app.patch('/report/:id', verifyToken, verifyUser, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedProduct = {
                $set: { "isReported": true }
            }
            const result = await productCollection.updateOne(filter, updatedProduct);
            res.send(result);
        })

        // update product
        app.patch('/update-product/:id', verifyToken, verifyUser, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateProductData = {
                $set: {
                    productName: updatedData.productName,
                    product_description: updatedData.product_description,
                    image: updatedData.image,
                    externalLink: updatedData.externalLink,
                    tags: updatedData.tags,
                    email: updatedData.email,
                    userPhoto: updatedData.userPhoto,
                    userName: updatedData.userName,
                    timestamp: updatedData.timestamp,
                }
            }
            const result = await productCollection.updateOne(filter, updateProductData);
            res.send(result);

        })

        // update user role

        app.patch('/update-role', verifyToken, verifyAdmin, async (req, res) => {
            const { role, userId } = req.body;
            const query = { _id: new ObjectId(userId) };
            const updateData = {
                $set: { role: role }
            };
            const result = await userCollection.updateOne(query, updateData);
            res.send(result);
        })


        // update status by moderator
        app.patch('/update-status/:id', verifyToken, verifyModerator, async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateData = {
                $set: { status: status }
            }
            const result = await productCollection.updateOne(filter, updateData);
            res.send(result);
        })

        // delete coupon 
        app.delete('/coupon/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await couponCollection.deleteOne(query);
            res.send(result);
        })

        // delete a product created by user
        app.delete('/product/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
    // console.log(`Example app listening on port ${ port } `)
})

