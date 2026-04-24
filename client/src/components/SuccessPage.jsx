import { useParams } from "react-router-dom";

export default function SuccessPage() {
  const { projectId } = useParams();

  return (
    <div className="max-w-xl mx-auto p-10 text-center">
      <h1 className="text-3xl font-bold text-green-700">
        Payment Successful 🎉
      </h1>

      <p className="mt-4 text-gray-700">Your order has been received.</p>

      <p className="mt-2 text-sm text-gray-500">Project ID: {projectId}</p>
    </div>
  );
}
