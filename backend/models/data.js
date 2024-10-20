const mongoose = require("mongoose");

// Define the schema
const DataSchema = new mongoose.Schema({
  time: { type: String }, // Correctly specifying time as a Date
  buy: { type: Number }, // Correctly specifying buy as a Number
  sell: { type: Number }, // Correctly specifying sell as a Number
  advertiser: { type: String }, // Assuming advertiser is a String
});

// Create the model
const DataModel = mongoose.model("Data", DataSchema);

module.exports = DataModel; // Export the model if needed
