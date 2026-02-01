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

export default function App() {
  const [project, setProject] = useState(null);

  // Wrapper that sets project then navigates to /payment
  function SongSurveyWrapper() {
    const navigate = useNavigate();
    return (
      <SongSurvey
        onNext={(data) => {
          setProject(data);
          navigate("/payment"); // pushes a new history entry
        }}
      />
    );
  }

  //   Wrapper for PaymentMock so it can navigate back to home
  function PaymentWrapper() {
    const navigate = useNavigate();
     return (
      <PaymentMock
        project={project}
        onDone={() => navigate("/")} // pushes home
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
                <Banner />        {/* Banner will use useNavigate internally */}
                <Carousel />
                <MenuNav />
                <Market />        {/* Market will use useNavigate internally */}
                <OurProcess />    {/* This will use useNavigate internally */}           
                <SampleAudio />   {/* This will use useNavigate internally */}          
                <Footer />
              </>
            }
          />
          <Route path="/create" element={<SongSurveyWrapper />} />
          <Route path="/payment" element={<PaymentWrapper />} />
          <Route path="/artist/flow" element={<ArtistSignOn />} />
          <Route path="/workflow" element={<WorkflowABC />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
