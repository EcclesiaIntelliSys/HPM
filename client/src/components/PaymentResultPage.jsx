import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function PaymentResultPage() {
  const API_BASE = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialStatus = searchParams.get("status");
  const initialMessage = searchParams.get("message");

  const projectId = searchParams.get("projectId");

  const socketRef = useRef(null);
  const pollingRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [project, setProject] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
  };

  const loadProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}`);

      if (!res.ok) {
        throw new Error("Unable to load project");
      }

      const data = await res.json();

      setProject(data);

      if (data.paymentStatus === "paid") {
        setPaymentStatus("success");
        setLoading(false);
        stopPolling();
      }
    } catch (err) {
      console.error(err);
      setPaymentStatus("failed");
      setErrorMessage("Unable to verify payment status.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) {
      setPaymentStatus("failed");
      setErrorMessage("Missing project reference.");
      setLoading(false);
      return;
    }
    if (initialStatus === "failed") {
      setPaymentStatus("failed");
      setErrorMessage(initialMessage || "Payment failed.");
      setLoading(false);
      return;
    }
    loadProject();

    socketRef.current = io(API_BASE);

    socketRef.current.emit("join-project", projectId);

    socketRef.current.on("payment-confirmed", async () => {
      await loadProject();

      setPaymentStatus("success");
      setLoading(false);
    });

    pollingRef.current = setInterval(async () => {
      await loadProject();
    }, 3000);

    const timeout = setTimeout(() => {
      setLoading(false);

      setPaymentStatus((prev) => {
        if (prev === "success") return prev;

        return "failed";
      });

      if (!errorMessage) {
        setErrorMessage("Payment confirmation is taking longer than expected.");
      }

      stopPolling();
    }, 20000);

    return () => {
      clearTimeout(timeout);
      stopPolling();

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-olive-100 flex items-center justify-center p-4 font-montserrat">
      <div className="w-full max-w-xl bg-sand-300 border-2 border-gray-300 shadow-xl rounded-xl p-8 text-center">
        <img
          src="/images/mylogo5.png"
          alt="Heart Prayer Music logo"
          className="w-32 mx-auto mb-6"
        />

        {loading && (
          <>
            <h1 className="text-2xl font-bold text-blue-900 mb-4">
              Finalizing Your Payment...
            </h1>

            <p className="text-gray-700">
              Please wait while we confirm your payment.
            </p>

            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
          </>
        )}

        {!loading && paymentStatus === "success" && (
          <>
            <h1 className="text-3xl font-bold text-green-700 mb-4">
              Payment Received
            </h1>

            <p className="text-gray-800 text-lg leading-relaxed">
              Your order is confirmed and our creatives team will start work on
              it.
            </p>

            <p className="mt-4 text-xl font-bold text-blue-900">
              Song Code: {project?.songcode}
            </p>

            <p className="mt-2 text-gray-700">
              Please keep this code for tracking your order status.
            </p>

            <button
              onClick={() => navigate("/")}
              className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-md"
            >
              Return Home
            </button>
          </>
        )}

        {!loading && paymentStatus === "failed" && (
          <>
            <h1 className="text-3xl font-bold text-red-700 mb-4">
              Payment Unsuccessful
            </h1>

            <p className="text-gray-700 leading-relaxed">
              {errorMessage || "Your payment could not be confirmed."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => navigate(-1)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-md"
              >
                Try Again
              </button>

              <button
                onClick={() => navigate("/")}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-md"
              >
                Return Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
