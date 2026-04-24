import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import Modal from "./Modal.jsx";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    voucherCode: "",
    firstname: "",
    middlename: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "password") {
      validatePassword(value);
    }

    if (name === "profilePicture") {
      if (!files || files.length === 0) {
        // ✅ User cleared the file input
        setFormData((prev) => ({ ...prev, profilePicture: null }));
        setPreview(null);
        setFileError("");
        return;
      }
      const file = files[0]; // ✅ File size limit (2 MB)
      if (file.size > 2 * 1024 * 1024) {
        setFileError("File size exceeds 2 MB limit");
        setFormData((prev) => ({ ...prev, profilePicture: null }));
        setPreview(null);
        return;
      }
      setFileError("");
      setFormData((prev) => ({ ...prev, profilePicture: file })); // ✅ Preview image
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === "voucherCode") {
      !value
        ? (newErrors.voucherCode = "Voucher code is required")
        : delete newErrors.voucherCode;
    }
    if (name === "firstname") {
      !value
        ? (newErrors.firstname = "First name is required")
        : delete newErrors.firstname;
    }
    if (name === "lastname") {
      !value
        ? (newErrors.lastname = "Last name is required")
        : delete newErrors.lastname;
    }
    if (name === "username") {
      !value
        ? (newErrors.username = "Username is required")
        : delete newErrors.username;
    }
    if (name === "email") {
      if (!value) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        newErrors.email = "Invalid email format";
      else delete newErrors.email;
    }
    if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else if (!Object.values(passwordStrength).every(Boolean)) {
        // ✅ fails strength test
        newErrors.password = "Password too weak";
      } else {
        delete newErrors.password;
      }
    }
    if (name === "confirmPassword") {
      if (!value) {
        newErrors.confirmPassword = "You need to confirm your Password";
      } else if (formData.password !== value) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const validatePassword = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#]/.test(password),
    });
  };

  useEffect(() => {
    const {
      voucherCode,
      firstname,
      lastname,
      username,
      email,
      password,
      confirmPassword,
    } = formData;

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordsMatch =
      password && confirmPassword && password === confirmPassword;
    const requiredFieldsFilled =
      voucherCode && firstname && lastname && username && email;
    const passwordStrong = Object.values(passwordStrength).every(Boolean);
    const fileValid = !fileError;

    setIsValid(
      requiredFieldsFilled &&
        emailValid &&
        passwordsMatch &&
        passwordStrong &&
        fileValid,
    );
  }, [formData, fileError]);

  const API_BASE = process.env.REACT_APP_API_URL || "";

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalNavigate, setModalNavigate] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); //

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const text = await res.json();
        console.error("Server error response:", text.error);
        setModalMessage(`Error: ${res.status} ${text.error}`);
        setModalOpen(true);
        return;
      }

      const result = await res.json();
      // console.log("Server response:", result);
      setModalMessage(result.message || result.error);
      setModalOpen(true);
      setModalNavigate(true);
    } catch (err) {
      console.error("Fetch error:", err);
      setModalMessage("Network error - could not reach backend");
      setModalOpen(true);
    } finally {
      setLoading(false); //
    }
  };

  return (
    <main>
      <img
        src="/images/mylogo5.png"
        alt="Heart Prayer Music logo"
        loading="lazy"
        className="w-32 md:w-40 lg:w-48 object-contain mx-auto mb-6"
      />
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 font-montserrat">
        <h2 className="text-2xl font-bold text-center mb-4">
          Welcome! Let's Setup Your Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required fields */}
          <div>
            <input
              type="text"
              name="voucherCode"
              placeholder="Voucher Code"
              value={formData.voucherCode}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${
                errors.voucherCode
                  ? "border-red-500"
                  : formData.voucherCode
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />
            {errors.voucherCode && (
              <p className="text-red-600 text-xs mt-1">{errors.voucherCode}</p>
            )}
            {!errors.voucherCode && formData.voucherCode && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>
          <div>
            <input
              type="text"
              name="firstname"
              placeholder="First Name"
              value={formData.firstname}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${
                errors.firstname
                  ? "border-red-500"
                  : formData.firstname
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />
            {errors.firstname && (
              <p className="text-red-600 text-xs mt-1">{errors.firstname}</p>
            )}
            {!errors.firstname && formData.firstname && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>
          <div>
            <input
              type="text"
              name="lastname"
              placeholder="Last Name"
              value={formData.lastname}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${
                errors.lastname
                  ? "border-red-500"
                  : formData.lastname
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />

            {errors.lastname && (
              <p className="text-red-600 text-xs mt-1">{errors.lastname}</p>
            )}
            {!errors.lastname && formData.lastname && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>
          <div>
            <input
              type="text"
              name="middlename"
              placeholder="Middle Name (Optional)"
              value={formData.middlename}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${
                errors.username
                  ? "border-red-500"
                  : formData.username
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="text-red-600 text-xs mt-1">{errors.username}</p>
            )}
            {!errors.username && formData.username && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${
                errors.email
                  ? "border-red-500"
                  : formData.email
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
            {!errors.email && formData.email && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>
          {/* Password field with strength */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded px-3 py-2 pr-10 ${
                  errors.password
                    ? "border-red-500"
                    : formData.password &&
                        Object.values(passwordStrength).every(Boolean) // ✅ only green if ALL rules pass
                      ? "border-green-500"
                      : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}

            {/* Success checkmark only when all strength rules pass */}
            {!errors.password &&
              formData.password &&
              Object.values(passwordStrength).every(Boolean) && (
                <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
              )}
          </div>
          {/* Password strength checklist */}
          <div className="text-xs mt-2 space-y-1 mt-1">
            <p
              className={
                passwordStrength.length ? "text-green-600" : "text-red-600"
              }
            >
              • At least 8 characters
            </p>
            <p
              className={
                passwordStrength.uppercase ? "text-green-600" : "text-red-600"
              }
            >
              • Contains uppercase letter
            </p>
            <p
              className={
                passwordStrength.lowercase ? "text-green-600" : "text-red-600"
              }
            >
              • Contains lowercase letter
            </p>
            <p
              className={
                passwordStrength.number ? "text-green-600" : "text-red-600"
              }
            >
              • Contains number
            </p>
            <p
              className={
                passwordStrength.special ? "text-green-600" : "text-red-600"
              }
            >
              • Contains special character (@$!%*?&#)
            </p>
          </div>

          {/* Password strength bar */}
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div
              className={`h-2 rounded transition-all duration-300 ${
                Object.values(passwordStrength).filter(Boolean).length <= 2
                  ? "bg-red-500 w-1/5"
                  : Object.values(passwordStrength).filter(Boolean).length === 3
                    ? "bg-yellow-500 w-2/5"
                    : Object.values(passwordStrength).filter(Boolean).length ===
                        4
                      ? "bg-blue-500 w-3/5"
                      : "bg-green-600 w-full"
              }`}
            ></div>
          </div>

          {/* Confirm password field */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded px-3 py-2 ${
                  errors.confirmPassword
                    ? "border-red-500"
                    : formData.confirmPassword
                      ? "border-green-500"
                      : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
            {!errors.confirmPassword && formData.confirmPassword && (
              <FaCheckCircle className="absolute right-2 top-2 text-green-500" />
            )}
          </div>

          {/* Profile picture upload */}
          <div className="text-xs">
            <p>Upload Profile Photo:</p>
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 text-xs${
                errors.profilePicture
                  ? "border-red-500"
                  : formData.profilePicture
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
            />
            {errors.profilePicture && (
              <p className="text-red-600 text-xs">{errors.profilePicture}</p>
            )}

            {/* Preview */}
            {preview && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">Selected:</p>
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-24 h-24 object-cover rounded-full border"
                />
              </div>
            )}
          </div>

          {/* Register button disabled until validations pass */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-2 rounded flex items-center justify-center ${
              isValid && !loading
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                ></path>
              </svg>
            ) : (
              "Register"
            )}
          </button>

          {modalOpen &&
            (modalNavigate ? (
              <Modal
                title=""
                onClose={() => {
                  setModalOpen(false);
                  navigate("/creatives");
                }}
              >
                <p>Congratulation! Your profile has been created.</p>
                <p>
                  We have sent a verification mail to the email address you
                  registered. Make sure to click the Verify Email link within 24
                  hours.
                </p>
              </Modal>
            ) : (
              <Modal
                title=""
                onClose={() => {
                  setModalOpen(false);
                  setModalNavigate(false);
                }}
              >
                <p>{modalMessage}</p>
              </Modal>
            ))}
        </form>
      </div>
    </main>
  );
}
