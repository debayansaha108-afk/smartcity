const express = require("express");
const Service = require("../models/Service");

const router = express.Router();

// Get all services
router.get("/", async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add service
router.post("/", async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update service
router.put("/:id", async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete service
router.delete("/:id", async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;