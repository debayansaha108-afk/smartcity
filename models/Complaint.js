const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    citizenName: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Resolved"],
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);