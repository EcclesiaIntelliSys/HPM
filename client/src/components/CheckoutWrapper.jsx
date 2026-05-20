import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutPage from "./CheckoutPage";

const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
  : null;

export default function CheckoutWrapper() {
  const API_BASE = process.env.REACT_APP_API_URL;
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const appearance = {
    theme: "stripe",

    variables: {
      colorPrimary: "#556B2F", // olive
      colorBackground: "#F5F1E8", // sand
      colorText: "#1F2937", // dark neutral
      colorDanger: "#dc2626",

      fontFamily: "Montserrat, system-ui, sans-serif",
      borderRadius: "10px",
      spacingUnit: "6px",
    },

    rules: {
      ".Input": {
        border: "1px solid #ddd",
        padding: "12px",
        boxShadow: "none",
      },
      ".Label": {
        fontWeight: "600",
        color: "#374151",
      },
      ".Tab": {
        borderRadius: "10px",
      },
    },
  };

  useEffect(() => {
    const init = async () => {
      try {
        const intentRes = await fetch(
          `${API_BASE}/api/payments/intent/${projectId}`,
        );
        const intentData = await intentRes.json();

        if (!intentRes.ok) {
          navigate(
            `/payment-result?projectId=${projectId}&status=failed&message=${encodeURIComponent(
              intentData.error,
            )}`,
          );

          return;
        }

        // NOW fetch project AFTER it was updated
        const projectRes = await fetch(`${API_BASE}/api/projects/${projectId}`);
        const projectData = await projectRes.json();

        setClientSecret(intentData.clientSecret);
        setProject(projectData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [projectId]);

  if (loading || !clientSecret || !project) {
    return <div>Loading payment...</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <CheckoutPage project={project} />
    </Elements>
  );
}
