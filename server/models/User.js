const mongoose = require("mongoose");
const reservedUsernames = ["SYSTEM", "ADMIN"];

const UserSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    middlename: { type: String },
    lastname: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // keep the input exactly as entered
      validate: {
        validator: function (v) {
          // compare against reserved list in uppercase
          return !reservedUsernames.includes(v.toUpperCase());
        },
        message: (props) => `${props.value} is a reserved username`,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    profilePicture: { type: String }, // store file path or URL
    role: {
      type: String,
      default: "000000",
      maxlength: [6, "Role must be at most 6 characters long"],
    },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    refreshTokens: [
      {
        token: String,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true },
);

// enforce case‑insensitive uniqueness at the DB level
UserSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
UserSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

module.exports = mongoose.model("User", UserSchema);
