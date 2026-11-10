const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Active", "Maintenance", "Inactive"],
        default: "Active"
    },
    description: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

serviceSchema.index({ name: "text", location: "text" });
serviceSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model("Service", serviceSchema);
