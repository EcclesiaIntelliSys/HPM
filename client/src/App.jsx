import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import RegisterForm from "./components/RegisterForm";
import VerifyPage from "./components/VerifyPage";
import LyricistProject from "./components/LyricistProject";
import SongartistProject from "./components/SongartistProject";
import QualityassuranceProject from "./components/QualityassuranceProject";
import ArtistPending from "./components/ArtistPending";
import { useNavigate } from "react-router-dom";

export default function App() {
  const [project, setProject] = useState(null);

  // Wrappers stay as normal components that use useNavigate internally
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

  function PaymentWrapper() {
    const navigate = useNavigate();
    return <PaymentMock project={project} onDone={() => navigate("/")} />;
  }

  function ArtistSignOnWrapper() {
    const navigate = useNavigate();
    return (
      <ArtistSignOn
        onSuccess={() => {
          console.log("Login successful!");
          navigate("/workflow");
        }}
      />
    );
  }

  // ✅ Define routes with createBrowserRouter
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <div className="min-h-screen bg-sand-100 text-olive-900">
          <Banner />
          <Carousel />
          <MenuNav />
          <Market />
          <OurProcess id="ourprocess-section" />
          <SampleAudio id="sampleaudio-section" />
          <Footer />
        </div>
      ),
    },
    {
      path: "/create",
      element: <SongSurveyWrapper />,
    },
    {
      path: "/payment",
      element: <PaymentWrapper />,
    },
    {
      path: "/creatives",
      element: <ArtistSignOnWrapper />,
    },
    {
      path: "/register",
      element: <RegisterForm />,
    },
    {
      path: "/workflow",
      element: (
        <ProtectedRoute>
          <WorkflowABC />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vouchermanage",
      element: (
        <ProtectedRoute>
          <VoucherManage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/projectmanage",
      element: (
        <ProtectedRoute>
          <ProjectManage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/lyricist/:id",
      element: (
        <ProtectedRoute>
          <LyricistProject />
        </ProtectedRoute>
      ),
    },
    {
      path: "/songartist/:id",
      element: (
        <ProtectedRoute>
          <SongartistProject />
        </ProtectedRoute>
      ),
    },
    {
      path: "/qualityassurance/:id",
      element: (
        <ProtectedRoute>
          <QualityassuranceProject />
        </ProtectedRoute>
      ),
    },
    {
      path: "/artistpending",
      element: (
        <ProtectedRoute>
          <ArtistPending />
        </ProtectedRoute>
      ),
    },
    {
      path: "/verify/:token",
      element: <VerifyPage />,
    },
  ]);

  return <RouterProvider router={router} />;
}
