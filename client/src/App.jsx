import {
  createBrowserRouter,
  RouterProvider,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";

import Banner from "./components/Banner";
import Carousel from "./components/Carousel";
import MenuNav from "./components/MenuNav";
import OurProcess from "./components/OurProcess";
import SampleAudio from "./components/SampleAudio";
import Market from "./components/Market";
import Features from "./components/Features";
import Footer from "./components/Footer";
import SongSurvey from "./components/SongSurvey";
import CheckoutPage from "./components/CheckoutPage";
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
import ArtistClockify from "./components/ArtistClockify";
import AdminPending from "./components/AdminPending";
import SongDetails from "./components/SongDetails";
import AudioPlayer from "./components/AudioPlayer";
import OrderTracker from "./components/Tracker";
import CheckoutWrapper from "./components/CheckoutWrapper";
import SuccessPage from "./components/SuccessPage";
import PromoBanner from "./components/PromoBanner";

import { useNavigate } from "react-router-dom";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
  : null;

export default function App() {
  // const [project, setProject] = useState(null);

  // Wrappers stay as normal components that use useNavigate internally
  // function SongSurveyWrapper() {
  //   const navigate = useNavigate();
  //   return (
  //     <SongSurvey
  //       onNext={(data) => {
  //         setProject(data);
  //         navigate(`/payment/${project._id}`);
  //       }}
  //     />
  //   );
  // }

  // function PaymentWrapper() {
  //   return (
  //     <Elements stripe={stripePromise}>
  //       <CheckoutPage project={project} />
  //     </Elements>
  //   );
  // }

  function ArtistSignOnWrapper() {
    const navigate = useNavigate();
    return (
      <ArtistSignOn
        onSuccess={() => {
          // console.log("Login successful!");
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
          <PromoBanner />
          <Banner />
          <Carousel />
          <MenuNav />
          <Market />
          <OurProcess id="ourprocess-section" />
          <SampleAudio id="sampleaudio-section" />
          <Features id="features-section" />
          <OrderTracker id="ordertracker-section" />

          <Footer />
        </div>
      ),
    },
    {
      path: "/create",
      element: <SongSurvey />,
    },
    // {
    //   path: "/payment/:projectId",
    //   element: <PaymentWrapper />,
    // },
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
      path: "/artistclockify",
      element: (
        <ProtectedRoute>
          <ArtistClockify />
        </ProtectedRoute>
      ),
    },
    {
      path: "/adminpending",
      element: (
        <ProtectedRoute>
          <AdminPending />
        </ProtectedRoute>
      ),
    },
    {
      path: "/songdetails/:id",
      element: (
        <ProtectedRoute>
          <SongDetails />
        </ProtectedRoute>
      ),
    },
    {
      path: "/hpmPlayer/:publicId",
      element: <AudioPlayer />,
    },
    {
      path: "/verify/:token",
      element: <VerifyPage />,
    },
    {
      path: "/checkout/:projectId",
      element: <CheckoutWrapper />,
    },
    {
      path: "/success/:projectId",
      element: <SuccessPage />,
    },
  ]);

  return <RouterProvider router={router} />;
}
