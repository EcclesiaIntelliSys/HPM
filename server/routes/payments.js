const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Project = require("../models/Project");
const Voucher = require("../models/Voucher");

router.get("/intent/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === "undefined") {
      return res.status(400).json({ error: "Invalid or missing projectId" });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).send("Project not found");

    // ✅ If already has PaymentIntent → reuse it
    if (project.paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(
        project.paymentIntentId,
      );

      return res.json({
        clientSecret: existingIntent.client_secret,
      });
    }

    // 💰 Pricing logic
    const basePrice = 10000; // $100
    const promoDisc = 1500; // $15

    let voucherDiscount = 0;

    if (project.voucherNo) {
      const voucher = await Voucher.findOne({
        vouchercode: project.voucherNo,
        valid: true,
        claimed: false,
      });

      if (voucher) {
        voucherDiscount = basePrice * (voucher.discount / 100);
      } else {
        voucherDiscount = 0;
      }
    }

    const finalAmount = basePrice - promoDisc - voucherDiscount;

    const amount = Math.round(finalAmount);

    // ✅ Create PaymentIntent ONLY ONCE
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        projectId: project._id.toString(),
      },
    });

    // ✅ Save to project
    project.paymentIntentId = paymentIntent.id;
    project.amount = amount;
    project.voucherDiscount = voucherDiscount;
    project.promoDisc = promoDisc;
    project.basePrice = basePrice;
    project.paymentStatus = "pending";

    await project.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Payment intent error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
