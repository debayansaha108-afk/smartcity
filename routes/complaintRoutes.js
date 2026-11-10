const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

// Get complaints
router.get("/", async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Register complaint
router.post("/", async (req, res) => {
    try {
        const complaint = await Complaint.create(req.body);
        res.status(201).json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update complaint status
router.patch("/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete complaint
router.delete("/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.json({ message: "Complaint deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;