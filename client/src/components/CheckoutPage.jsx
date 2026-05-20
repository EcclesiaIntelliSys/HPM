import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import Modal from "./Modal.jsx";
import { io } from "socket.io-client";

export default function CheckoutPage({ project }) {
  const API_BASE = process.env.REACT_APP_API_URL;
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const paymentCompletedRef = useRef(false);
  const timeoutRef = useRef(null);
  const pollingRef = useRef(null);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const cleanupTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
  };

  const finalizeSuccess = () => {
    if (paymentCompletedRef.current) return;

    paymentCompletedRef.current = true;

    cleanupTimers();

    setPaying(false);

    navigate(`/payment-result?projectId=${project._id}`);
  };

  const checkPaymentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${project._id}/status`);

      if (!res.ok) return;

      const data = await res.json();

      if (data.status === "paid") {
        finalizeSuccess();
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  console.log("Submit clicked");
  console.log("stripe:", stripe);
  console.log("elements:", elements);
  console.log("paying:", paying);
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || paying) {
      console.log("BLOCKED:", {
        stripeExists: !!stripe,
        elementsExists: !!elements,
        paying,
      });
      return;
    }
    setPaying(true);
    paymentCompletedRef.current = false;
    cleanupTimers();
    // IMPORTANT FOR PAYMENT ELEMENT
    const submitResult = await elements.submit();

    if (submitResult.error) {
      setErrorMessage(submitResult.error.message);

      setPaying(false);

      return;
    }

    // TIMEOUT NOW WAITS FOR WEBHOOK/SOCKET
    timeoutRef.current = setTimeout(() => {
      if (!paymentCompletedRef.current) {
        navigate(
          `/payment-result?projectId=${project._id}&status=failed&message=${encodeURIComponent(
            "Payment confirmation is taking longer than expected.",
          )}`,
        );
        setPaying(false);
      }
    }, 20000);

    // FALLBACK POLLING
    pollingRef.current = setInterval(() => {
      if (!paymentCompletedRef.current) {
        checkPaymentStatus();
      }
    }, 3000);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-result?projectId=${project._id}`,
      },
      redirect: "if_required",
    });

    if (error) {
      cleanupTimers();
      setPaying(false);
      navigate(
        `/payment-result?projectId=${project._id}&status=failed&message=${encodeURIComponent(error.message || "Payment failed")}`,
      );

      return;
    }
    // Webhook + socket/polling are the source of truth
  };

  useEffect(() => {
    socketRef.current = io(API_BASE);

    // JOIN ROOM IMMEDIATELY
    socketRef.current.emit("join-project", project._id);

    // SOCKET SUCCESS
    socketRef.current.on("payment-confirmed", (data) => {
      finalizeSuccess();
    });

    // OPTIONAL DEBUGGING
    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      cleanupTimers();

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center z-10">
      {/* 🌟 Logo */}
      <img
        src="/images/mylogo5.png"
        alt="Heart Prayer Music logo"
        loading="lazy"
        className="w-28 sm:w-32 md:w-36 lg:w-40 object-contain mb-1 sm:mb-2 mt-4"
      />

      <div className="w-full md:w-8/12 lg:w-6/12 mx-auto p-4 grid md:grid-cols-2 font-montserrat gap-4 bg-olive-100">
        {/* ORDER SUMMARY */}
        <div>
          <div className="w-full shadow-md p-6 bg-sand-300 radius-md shadow-xl border-gray-300 border-2">
            <div className="text-xl font-bold mb-4">Order Summary</div>

            <br />

            {/* DELIVERY DATE */}
            <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2 pb-2">
              <span>Delivery Date:</span>
              <span className="text-blue-900 text-xl font-black">
                {new Date(
                  new Date().setDate(new Date().getDate() + 7),
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <br />

            {/* BASE PRICE */}
            {project.basePrice > 0 && (
              <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2 pb-2">
                <span>Heart's Prayer in a Song:</span>
                <span className="text-blue-900 font-black">
                  ${(project.basePrice / 100).toFixed(2)}
                </span>
              </div>
            )}

            {/* INTRO DISCOUNT */}
            {project.promoDisc > 0 && (
              <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2 pb-2">
                <span>Less: Promotional Discount:</span>
                <span className="text-red-900 font-black">
                  (${(project.promoDisc / 100).toFixed(2)})
                </span>
              </div>
            )}

            {/* VOUCHER DISCOUNT (optional) */}
            {project.voucherNo && project.voucherDiscount > 0 && (
              <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2 pb-2">
                <span>Less: Voucher Discount:</span>
                <span className="text-red-900 font-black">
                  (${(project.voucherDiscount / 100).toFixed(2)})
                </span>
              </div>
            )}

            <br />

            {/* NET TOTAL */}
            {project.amount > 0 && (
              <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2 pb-2">
                <span className="font-black text-xl font-mono">NETT:</span>
                <span className="text-blue-900 text-2xl font-black">
                  ${(project?.amount / 100).toFixed(2)} USD
                </span>
              </div>
            )}
          </div>
          <div className="font-montserrat text-xs p-2 mt-2 px-6 border-1 bg-white">
            <p>
              <strong>Important Note:</strong>
            </p>
            <p className="pt-1">
              Your custom song will be delivered via an audio player link sent
              to the email address you provided in the questionnaire. Delivery
              will be completed on or before the date indicated above, or within
              seven (7) days from payment confirmation—whichever comes later.
            </p>
            <p className="pt-1">
              Upon successful payment, you will receive an Order Confirmation
              email. If you do not see it in your inbox, please check your spam
              or junk folder. You may reach out to us at{" "}
              <a
                href="mailto:info@heartprayermusic.com"
                className="text-blue-600 underline hover:text-blue-800"
              >
                info@heartprayermusic.com
              </a>{" "}
              for assistance.
            </p>
            {/* Terms of Service */}{" "}
            <p className="pt-2">
              Please take a moment to read our{" "}
              <button
                onClick={() => setShowTerms(true)}
                className="text-blue-600 underline hover:text-blue-800"
              >
                {" "}
                Terms of Service{" "}
              </button>{" "}
              and
              {/* Privacy Policy */}{" "}
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-blue-600 text-sand-700 text-xs underline hover:text-blue-800"
              >
                {" "}
                Privacy Policy{" "}
              </button>
            </p>
            {showTerms && (
              <Modal
                title=""
                filePath="/tos.html"
                onClose={() => setShowTerms(false)}
              />
            )}{" "}
            {showPrivacy && (
              <Modal
                title=""
                filePath="/pp.html"
                onClose={() => setShowPrivacy(false)}
              />
            )}{" "}
          </div>
        </div>

        {/* PAYMENT */}
        <div className="shadow-md p-6 border bg-sand-300">
          <h2 className="text-xl font-bold mb-4">Payment</h2>

          <form className="carrois-gothic-sc-regular" onSubmit={handlePayment}>
            <PaymentElement />

            <button
              type="submit"
              disabled={!stripe || paying}
              className="mt-4 w-8/12 mx-auto block bg-green-600 hover:bg-green-800 text-white py-2 rounded-full shadow-md"
            >
              {paying ? "Finalizing Payment..." : "Pay Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
