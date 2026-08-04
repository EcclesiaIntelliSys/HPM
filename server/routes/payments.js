const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Project = require("../models/Project");
const Voucher = require("../models/Voucher");
const Config = require("../models/opsconfig");

router.get("/intent/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === "undefined") {
      return res.status(400).json({ error: "Invalid or missing projectId" });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).send("Project not found");

    if (project.paymentStatus === "paid") {
      return res.status(400).json({
        error: "This order has already been paid.",
      });
    }

    // ✅ If already has PaymentIntent → reuse it if still re-usable
    if (project.paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(
        project.paymentIntentId,
      );

      console.log(
        "Existing PaymentIntent:",
        existingIntent.id,
        existingIntent.status,
      );

      const reusableStatuses = [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
      ];

      // ✅ Reuse only if still payable
      if (reusableStatuses.includes(existingIntent.status)) {
        return res.json({
          clientSecret: existingIntent.client_secret,
        });
      }

      // ❌ Otherwise clear stale intent
      console.log("PaymentIntent not reusable. Creating new intent...");

      project.paymentIntentId = null;

      await project.save();
    }
    // 💰 Pricing logic
    const opsConfig = await Config.findOne();

    if (!opsConfig) {
      return res.status(500).json({
        error: "Operations configuration not found.",
      });
    }

    const basePrice = opsConfig.songPrice * 100;
    const promoDisc = opsConfig.introDiscount * 100;

    // Add-on pricing (in cents)
    const addonsPrice =
      (project.addons?.fastTrack ? opsConfig.fastTrackPrice * 100 : 0) +
      (project.addons?.nextDay ? opsConfig.nextDayPrice * 100 : 0) +
      (project.addons?.lyricVideo ? opsConfig.lyricVideoPrice * 100 : 0) +
      (project.addons?.commercialRights
        ? opsConfig.commercialRightsPrice * 100
        : 0);

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

    const finalAmount = basePrice + addonsPrice - promoDisc - voucherDiscount;

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
    project.addonsPrice = addonsPrice;

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
