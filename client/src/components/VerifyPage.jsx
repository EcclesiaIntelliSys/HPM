import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "./Modal"; // adjust path if needed

const VerifyPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");
  const [showModal, setShowModal] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/verify/${token}`);
        setMessage(res.data.message);
      } catch (err) {
        setMessage(
          "Email verification failed due to invalid or expired token. Please obtain a new voucher code and re-register.",
        );
        try {
          // Call backend to delete unverified user
          await axios.delete(`${API_BASE}/api/auth/delete-unverified/${token}`);
        } catch (err) {
          console.error("Error deleting unverified user:", err);
        }
      } finally {
        setShowModal(true); // always show modal after attempt
      }
    };
    verifyEmail();
  }, [token, API_BASE]);

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/creatives"); // redirect to creatives page
  };

  return (
    <>
      {showModal && (
        <Modal
          title=""
          onClose={() => {
            setShowModal(false);
            navigate("/creatives");
          }}
        >
          <p>{message}</p>
        </Modal>
      )}
    </>
  );
};

export default VerifyPage;
