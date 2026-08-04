const mongoose = require("mongoose");

const VoucherSchema = new mongoose.Schema(
  {
    vouchercode: { type: String, required: true },
    discount: {
      type: Number,
      required: true,
      min: [0, "Discount must be at least 0"],
      max: [100, "Discount cannot exceed 100"],
      validate: {
        validator: Number.isInteger,
        message: "Discount must be an integer value",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be at least 0"],
      max: [1000, "Quantity cannot exceed 1000"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer value",
      },
    },
    validstart: { type: Date, required: true },
    validend: { type: Date, required: true },
    valid: { type: Boolean, required: true },
    claimedby: { type: String },
    claimdate: { type: Date },
    role: {
      type: String,
      default: "000000",
      maxlength: [6, "Role must be at most 6 characters long"],
    },
  },
  { collection: "vouchers" },
);

module.exports = mongoose.model("Voucher", VoucherSchema);
