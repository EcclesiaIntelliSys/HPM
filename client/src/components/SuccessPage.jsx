import { useParams, useNavigate } from "react-router-dom";

export default function SuccessPage() {
  const { songcode } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-olive-100 flex items-center justify-center p-4 font-montserrat">
      <div className="w-full max-w-xl bg-sand-300 border-2 border-gray-300 shadow-xl rounded-xl p-8 text-center">
        <img
          src="/images/mylogo5.png"
          alt="Heart Prayer Music logo"
          className="w-32 mx-auto mb-6"
        />
        <p className="text-2xl font-bold text-green-700">
          Free Order Received!
        </p>

        <p className="text-gray-800 text-md leading-relaxed">
          Our creatives team will start work on it.
        </p>

        <p className="mt-4 font-bold text-blue-900">Song Code: {songcode}</p>

        <p className="mt-2 text-gray-700">
          Please keep this code for tracking your order status.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-md"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
