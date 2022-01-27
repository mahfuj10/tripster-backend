const express = require('express');
const { MongoClient } = require('mongodb');
const port = process.env.port || 5000;
const ObjectId = require('mongodb').ObjectId;
const app = express();
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());

async function run() {

    // mongo db uri

    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.39aol.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {

        await client.connect();
        const database = client.db('Tripster');
        const blogsCollection = database.collection('blogs');
        const reviewCollection = database.collection('reviews');
        const blogReview = database.collection('blogreview');
        const usersCollection = database.collection('users');


        // get single blog api
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            res.send(await blogsCollection.findOne(query));
        });

        // get blogs api
        app.get('/blogs', async (req, res) => {
            res.send(await blogsCollection.find({}).toArray());
        });

        // delete blog api
        app.delete('/deleteblog/:blogId', async (req, res) => {
            const blogId = req.params.blogId;
            const query = { _id: ObjectId(blogId) };
            res.send(await blogsCollection.deleteOne(query))
        })

        // update post status
        app.put('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const updateSatus = req.body.status;
            const filter = { _id: ObjectId(id) };
            const result = await blogsCollection.updateOne(filter, {
                $set: { status: updateSatus }
            });
            res.send(result);
        });

        // get top blog
        app.get('/topBlog', async (req, res) => {
            const rating = "5";
            const query = { rating: rating };
            res.send(await blogsCollection.find(query).toArray());
        })

        // get website review api
        app.get('/webreviews', async (req, res) => {
            res.send(await reviewCollection.find({}).toArray());
        });

        // post  review
        app.post('/webreviews', async (req, res) => {
            res.send(await reviewCollection.insertOne(req.body));
        });

        // get products api
        app.get('/cycles', async (req, res) => {
            const cursor = blogsCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }

            res.send({
                count,
                products,

            });
        });

        // get review api per blog
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { blogId: id };
            res.send(await blogReview.find(query).toArray());
        });

        app.post('/review', async (req, res) => {
            res.send(await blogReview.insertOne(req.body));
        });

        // saver user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // save user google sign
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // post blog
        app.post('/postBlog', async (req, res) => {
            res.send(await blogsCollection.insertOne(req.body));
        })

        // make admin 
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // get admin status
        app.get('/users/:email', async (req, res) => {
            const user = await usersCollection.findOne({ email: req.params.email });
            let Admin = false;
            if (user?.role === 'admin') {
                Admin = true;
            };
            res.json({ Admin: Admin });
        });


    }
    finally { }
}

run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send("My server is running ....")
});

app.listen(process.env.PORT || 5000, function () {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});