const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xqlvbzz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allPostedJobs = client.db("jobNest").collection("jobPost");
    const allAppliedJobs = client.db("jobNest").collection("appliedJobs");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          // sameSite: "none",
        })
        .send({ success: true });
    });

    //get job to show in ui
    app.get("/jobs", async (req, res) => {
      const cursor = allPostedJobs.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // show data accordingly user name
    app.get("/jobs/:name", async (req, res) => {
      const { name } = req.params;
      const cursor = allPostedJobs.find({ name });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allPostedJobs.findOne(query);
      res.send(result);
    });

    // post a job
    app.post("/job", async (req, res) => {
      const newJob = req.body;
      console.log(newJob);
      const result = await allPostedJobs.insertOne(newJob);
      res.send(result);
    });

    // post applied job and add in db
    app.post("/appliedJobs", async (req, res) => {
      const appliedJob = req.body;
      console.log(appliedJob);
      const result = await allAppliedJobs.insertOne(appliedJob);
      res.send(result);
    });

    // update applied job applicant number
    app.patch("/appliedJobs/:id", async (req, res) => {
      const postId = req.params.id;
      const filter = { _id: new ObjectId(postId) };

      const update = { $inc: { applicantNumber: 1 } };
      const result = await allPostedJobs.updateOne(filter, update);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("users management server is running");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
