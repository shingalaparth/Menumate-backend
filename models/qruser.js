// models/qruser.js

const mongoose = require('mongoose');

const qruserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters']
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  }
},
 {
  timestamps: true // Adds createdAt and updatedAt
  
});

module.exports = mongoose.model('QRUser', qruserSchema);