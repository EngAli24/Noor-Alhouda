const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "مستخدم جديد" },
    
    appData: { 
        type: Object, 
        default: {} 
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);