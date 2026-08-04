module.exports = async (req, res) => {
  // console.log("🔥 WEBHOOK HIT");
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const Project = require("../models/Project");
  const Voucher = require("../models/Voucher");
  const { emitLyricistQueue } = require("../utils/queueEmitter");
  const transporter = require("../utils/mailer");
  const buildPaymentEmail = require("../emails/paymentConfirmation");

  const sig = req.headers["stripe-signature"];

  if (!stripe) {
    return res.status(400).send("Stripe not configured");
  }
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // console.log("✅ Webhook received:", event.type);
  if (event.type === "payment_intent.succeeded") {
    try {
      const paymentIntent = event.data.object;
      const projectId = paymentIntent.metadata.projectId;
      if (!projectId) {
        console.error("❌ Missing projectId in metadata");
        return res.sendStatus(200);
      }

      const project = await Project.findById(projectId);
      if (project.paymentIntentId !== paymentIntent.id) {
        console.error("❌ PaymentIntent mismatch");

        return res.sendStatus(200);
      }
      if (paymentIntent.amount !== project.amount) {
        console.error("❌ Amount mismatch");

        return res.sendStatus(200);
      }
      const actor = "SYSTEM";
      const timestamp = new Date();
      const message = "Payment Confirmed. Queuing for Lyricist Action.";
      const targetdate = new Date();
      targetdate.setDate(targetdate.getDate() + project.deliveryDays);

      const updatedProject = await Project.findOneAndUpdate(
        {
          _id: projectId,
          paymentStatus: { $ne: "paid" },
        },
        {
          paymentStatus: "paid",
          status: "Queued for Lyricist",
          targetdate,
          $push: {
            logs: { timestamp, actor, message },
          },
        },
        { new: true },
      );

      if (!project) return res.sendStatus(200);

      // console.log("💰 PaymentIntent ID:", paymentIntent.id);
      // console.log("📦 Project ID:", projectId);
      // console.log("📊 Current status:", project.paymentStatus);

      // ✅ Prevent duplicate execution
      if (!updatedProject) {
        return res.sendStatus(200);
      }

      // ✅ Mark as paid
      project.paymentStatus = "paid";
      project.status = "Queued for Lyricist";
      project.logs.push({ timestamp, actor, message });

      await project.save();
      console.log(
        `✅ Project ${project._id} marked PAID via PaymentIntent ${paymentIntent.id}`,
      );
      const io = req.app.get("io");

      /* ---------------- SOCKET EVENT ---------------- */

      try {
        io.to(projectId).emit("payment-confirmed", {
          projectId,
          songcode: project.songcode,
        });

        console.log("Socket payment-confirmed emitted");
      } catch (err) {
        console.error("Socket emit failed:", err);
      }

      /* ---------------- CLAIM VOUCHER ---------------- */

      if (project.voucherNo) {
        try {
          const voucher = await Voucher.findOne({
            vouchercode: project.voucherNo,
          });

          if (voucher) {
            voucher.claimedby = voucher.claimedby
              ? `${voucher.claimedby} ${project.email.toUpperCase()}`
              : project.email.toUpperCase();

            voucher.quantity -= 1;
            voucher.claimdate = new Date();

            if (voucher.quantity <= 0) {
              voucher.quantity = 0;
              voucher.valid = false;
            }

            await voucher.save();
            console.log("Voucher claimed");
          }
        } catch (err) {
          console.error("Voucher claim failed:", err);
        }
      }

      // SEND EMAIL HERE (REAL CONFIRMATION)
      try {
        await transporter.sendMail({
          from: process.env.TITAN_FROM,
          to: project.email,
          subject: "Your Heart’s Prayer Is Being Crafted Into a Song",
          html: buildPaymentEmail(project),
        });
        console.log("✅ Confirmation email sent");
      } catch (err) {
        console.error("❌ Email send failed:", err);
      }

      /* ---------------- REFRESH QUEUES ---------------- */

      try {
        await emitLyricistQueue(io);

        console.log("✅ Lyricist queue emitted");
      } catch (err) {
        console.error("❌ Queue emit failed:", err);
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }
  }

  res.sendStatus(200);
};
