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
    validstart: { type: Date, required: true },
    validend: { type: Date, required: true },
    valid: { type: Boolean, required: true },
    claimed: { type: Boolean },
    claimedby: { type: String },
    claimdate: { type: Date },
  },
  { collection: "vouchers" },
);

module.exports = mongoose.model("Voucher", VoucherSchema);
