const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Service = require("./models/Service");
const Complaint = require("./models/Complaint");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(error => console.error("MongoDB Error:", error.message));

// API routes
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));

// Dashboard statistics using MongoDB aggregation
app.get("/api/dashboard", async (req, res) => {
    try {
        const totalServices = await Service.countDocuments();
        const activeServices = await Service.countDocuments({ status: "Active" });
        const totalComplaints = await Complaint.countDocuments();

        const complaintStats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            totalServices,
            activeServices,
            totalComplaints,
            complaintStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});