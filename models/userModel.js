const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    unique: true,
    trim: true,
    required: [true, 'Please tell us your name'],
    minlength: [5, 'A user name must have more than or equal 5 characters'],
    maxlength: [25, 'A user name must have less than or equal 25 characters'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'The password must have at least 8 characters'],
    select: false,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    lowercase: true,
  },
  photo: {
    type: String,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: "Password and confirm password don't match",
    },
  },
  passwordChangedAt: {
    type: Date,
    select: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    return JWTTimestamp < this.passwordChangedAt.getTime() / 1000;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
