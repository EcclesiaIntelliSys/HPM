import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";
import Banner from "./components/Banner";
import Carousel from "./components/Carousel";
import MenuNav from "./components/MenuNav";
import OurProcess from "./components/OurProcess";
import SampleAudio from "./components/SampleAudio";
import Market from "./components/Market";
import Footer from "./components/Footer";
import SongSurvey from "./components/SongSurvey";
import PaymentMock from "./components/PaymentMock";
import ArtistSignOn from "./components/ArtistSignOn";
import WorkflowABC from "./components/WorkflowABC";
import VoucherManage from "./components/VoucherManage";
import ProjectManage from "./components/ProjectsManagement";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [project, setProject] = useState(null);

  // Wrapper that sets project then navigates to /payment
  function SongSurveyWrapper() {
    const navigate = useNavigate();
    return (
      <SongSurvey
        onNext={(data) => {
          setProject(data);
          navigate("/payment");
        }}
      />
    );
  }

  // Wrapper for PaymentMock so it can navigate back to home
  function PaymentWrapper() {
    const navigate = useNavigate();
    return <PaymentMock project={project} onDone={() => navigate("/")} />;
  }

  // ✅ Wrapper for ArtistSignOn so it navigates to WorkflowABC
  function ArtistSignOnWrapper() {
    const navigate = useNavigate();
    return (
      <ArtistSignOn
        onSuccess={() => {
          console.log("Login successful!");
          navigate("/workflow"); // push to WorkflowABC route
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-sand-100 text-olive-900">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Banner />
                <Carousel />
                <MenuNav />
                <Market />
                <OurProcess id="ourprocess-section" />
                {/* optional: add id for other sections */}
                <SampleAudio id="sampleaudio-section" />
                <Footer />
              </>
            }
          />
          <Route path="/create" element={<SongSurveyWrapper />} />
          <Route path="/payment" element={<PaymentWrapper />} />
          <Route path="/creatives" element={<ArtistSignOnWrapper />} />
          <Route path="/workflow" element={<WorkflowABC />} />{" "}
          {/* Protected route */}
          <Route
            path="/vouchermanage"
            element={
              <ProtectedRoute>
                {" "}
                <VoucherManage />{" "}
              </ProtectedRoute>
            }
          />{" "}
          <Route
            path="/projectmanage"
            element={
              <ProtectedRoute>
                {" "}
                <ProjectManage />{" "}
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
