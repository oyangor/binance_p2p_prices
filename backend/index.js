const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const DataModel = require("./models/data"); // Importing the Data model

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

// Verify successful connection
mongoose.connection.on("connected", () => {
  console.log("Successfully connected to MongoDB database");
});

// Basic error handling for connection
mongoose.connection.on("error", (err) => {
  console.error("Connection error: ", err);
});

// Route to add new data to the database (POST request)
app.post("/backend/models/data", async (req, res) => {
  try {
    const { time, buy, sell, advertiser } = req.body; // Get the data from the request body
    const newData = new DataModel({ time, buy, sell, advertiser }); // Create a new instance of the model

    // Save to database
    await newData.save();

    res.status(201).json({ message: "Data saved successfully", data: newData });
  } catch (error) {
    res.status(500).json({ message: "Error saving data", error });
  }
});

// Route to retrieve all data from the database (GET request)
app.get("/backend/models/data", async (req, res) => {
  try {
    const allData = await DataModel.find(); // Retrieve all entries from the database
    res.status(200).json(allData);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

app.delete("/backend/models/data", async (req, res) => {
  try {
    const result = await DataModel.deleteMany({});
    res
      .status(200)
      .json({ message: `Deleted ${result.deletedCount} document(s).` });
  } catch (error) {
    res.status(500).json({ message: "Error deleting documents", error });
  }
});

// Start the server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
