module.exports = async (req, res) => {
  // console.log("🔥 WEBHOOK HIT");
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const Project = require("../models/Project");
  const Voucher = require("../models/Voucher");
  const { emitLyricistQueue } = require("../utils/queueEmitter");
  const transporter = require("../utils/mailer"); // adjust path

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
      const actor = "SYSTEM";
      const timestamp = new Date();
      const message = "Payment Confirmed. Queuing for Lyricist Action.";

      if (!project) return res.sendStatus(200);

      // console.log("💰 PaymentIntent ID:", paymentIntent.id);
      // console.log("📦 Project ID:", projectId);
      // console.log("📊 Current status:", project.paymentStatus);

      // ✅ Prevent duplicate execution
      if (project.paymentStatus === "paid") {
        return res.status(200).json({
          error: "Project already paid",
        });
      }

      // ✅ Mark as paid
      project.paymentStatus = "paid";
      project.status = "Queued for Lyricist";
      project.logs.push({ timestamp, actor, message });

      await project.save();
      // console.log("✅ Project marked as PAID");

      // CLAIM VOUCHER HERE
      if (project.voucherNo) {
        await Voucher.findOneAndUpdate(
          { vouchercode: project.voucherNo },
          {
            valid: false,
            claimed: true,
            claimedby: project.email,
            claimdate: new Date(),
          },
          //     { new: true },
        );
      }

      // ✅ SEND EMAIL HERE (REAL CONFIRMATION)

      await transporter.sendMail({
        from: process.env.TITAN_FROM,
        to: project.email,
        subject: "Your Heart’s Prayer Is Being Crafted Into a Song",
        html: ` <p>Thank you for trusting <strong>HeartPrayerMusic</strong> to transform your heart’s prayer into a song. We’re honored to be part of something so personal and meaningful.</p>
              <p>Our gifted artists are already prayerfully and thoughtfully working on your custom song, giving careful attention to every detail so it reflects your heart and intention.</p>
              <p>Your custom song will be delivered to you on or before <strong>${
                project.targetdate
                  ? new Date(project.targetdate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "your scheduled delivery date"
              }</strong>. You may track the status of your custom song by referencing Song Code # <strong style="text-decoration: underline;">${project.songcode}</strong>.</p>
          <br></br>
                    <div className="w-3/4 shadow-md py-8 px-14 bg-gray-100 text-sm font-montserrat border-2 border-gray-200">
            <div className="my-0">
              <p className="text-center font-black">
                <strong>CUSTOM SONG SPECIFICATION</strong>
              </p>
              <br/>
              <p className="font-light">
                A custom song dedicated to
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${project.recipient}
                </span></strong>
                (
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${project.relation}
                </span></strong>
                ). <span> </span>
                ${project.recipient}'s age group is
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${project.agegroup}
                </span></strong>
                .
              </p>
              <div className="flex text-md gap-5">
                <strong><span className="w-1/4 text-right">Special Qualities :</span></strong>
                <span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${project.qualities}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <strong><span className="w-1/4 text-right">Memorable Moments :</span></strong>
                <span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${project.moment}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <strong><span className="w-1/4 text-right">
                  What This Song Should Say :
                </span></strong>
                <span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${project.specialmsg}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <strong><span className="w-1/4 text-right">Song Style / Genre :</span></strong>
                <span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${project.genre}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <strong><span className="w-1/4 text-right">
                  Preferred Voice Gender :
                </span></strong>
                <span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${project.voice}
                </span>
              </div>
              <br/><br/>
              <p>Thank you again for allowing us to serve you through music and prayer.<p>
              <p>Warm blessings,</p>
              <br/>
              <p><strong>HeartPrayerMusic Creatives Team</strong></p>
          `,
      });

      // ✅ START WORK HERE
      const io = req.app.get("io");
      // await emitLyricistQueue(req);
      await emitLyricistQueue(io);
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }
  }

  res.sendStatus(200);
};
