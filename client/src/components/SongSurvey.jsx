import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import {
  FaRegArrowAltCircleLeft,
  FaRegArrowAltCircleRight,
} from "react-icons/fa";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";
import { GiCheckMark } from "react-icons/gi";
import Modal from "./Modal.jsx";

const API_BASE = process.env.REACT_APP_API_URL || "";
const REG_PRICE = 100;
const INTRO_DISC = 15;

const OPTIONS_genre = [
  "Worship",
  "Jazz",
  "R&B / Soul",
  "Country",
  "Pop",
  "Rap / Hip-hop",
  "Electronic",
  "Reggae",
  "Indie Pop Rock",
  "Latin-Inspired",
  "Chorale",
  "Cinematic / Epic",
];
const OPTIONS_relation = [
  "Wife",
  "Husband",
  "Girlfriend",
  "Boyfriend",
  "Son",
  "Daughter",
  "Mom",
  "Dad",
  "Sibling",
  "Friend",
  "For Me",
  "Other",
];
const OPTIONS_agegroup = [
  "Adult",
  "Child",
  "Teen",
  "Young Adult",
  "Older Adult",
  "Unspecified",
];

const OPTIONS_voice = [
  "Male (Deep/Warm)",
  "Male (Bright/Higher-Pitched)",
  "Female (Soft/Expressive)",
  "Female (Bright/Powerful)",
  "Neutral",
  "No Preference - Surprise Me",
];

const GENRE_EXPLANATIONS = {
  Worship:
    "Uplifting and spiritual, focused on devotion, gratitude, and heartfelt messages.",
  Jazz: "Smooth, expressive, and improvisational, with rich melodies and soulful instrumentals.",
  "R&B / Soul":
    "Emotional and melodic, full of smooth vocals, rhythm, and heartfelt feeling.",
  Country:
    "Story-driven and warm, with guitars or banjo, capturing life, love, and memories.",
  Pop: "Catchy and upbeat, with memorable hooks, bright melodies, and feel-good energy.",
  "Rap / Hip-hop":
    "Rhythmic, lyrical, and bold, with strong beats and storytelling vocals.",
  Electronic:
    "Modern, synth-driven, and energetic, ranging from danceable to atmospheric vibes.",
  Reggae:
    "Laid-back, groovy, and positive, with offbeat rhythms and chill energy.",
  "Indie Pop Rock":
    "Melodic and alternative, blending indie authenticity with catchy, feel-good hooks.",
  "Latin-Inspired":
    "Vibrant rhythms and soulful melodies influenced by Latin sounds",
  Chorale:
    "Harmonized group vocals, often cinematic, classical, or sacred in sound.",
  "Cinematic / Epic":
    "Big, dramatic, and emotional, with sweeping orchestration and powerful builds.",
};

const VOICE_EXPLANATIONS = {
  "Male (Deep/Warm)": "Strong, rich, and emotional male tone.",
  "Male (Bright/Higher-Pitched)": "Energetic, light, or uplifting male tone.",
  "Female (Soft/Expressive)": "Gentle, emotional, or intimate female tone.",
  "Female (Bright/Powerful)": "Energetic, bold, or soaring female tone.",
  Neutral: "Gender-ambiguous voice that isn’t strongly male or female.",
  "No Preference - Surprise Me":
    "Let our composer pick the best fit for your song.",
};

export default function SongRequestForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    relation: "",
    recipient: "",
    agegroup: "",
    qualities: "",
    moment: "",
    specialmsg: "",
    genre: "",
    voice: "",
    email: "",
    ack: false,
    voucherNo: "",
  });
  const [status, setStatus] = useState(null);
  const [touched, setTouched] = useState({
    otherRelation: false,
    recipient: false,
  });

  const [orderRef, setOrderRef] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVouchers(data);
        } else {
          console.error("Unexpected vouchers response:", data);
          setVouchers([]); // fallback to empty array
        }
      })
      .catch((err) => {
        console.error("Error fetching vouchers:", err);
        setVouchers([]);
      });
  }, []);

  const matchedVoucher =
    Array.isArray(vouchers) &&
    vouchers.find(
      (v) =>
        v.vouchercode === form.voucherNo &&
        v.valid === true &&
        v.claimed === false,
    );

  let voucherError = "";
  if (form.voucherNo) {
    if (!matchedVoucher || matchedVoucher.valid === false) {
      voucherError = "Invalid voucher code";
    } else if (matchedVoucher.claimed === true) {
      voucherError = "Voucher already claimed";
    }
  }
  const voucherDisc = matchedVoucher ? matchedVoucher.discount : 0;
  const nett = REG_PRICE - INTRO_DISC - (REG_PRICE * voucherDisc) / 100;

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const voice_explanation = form.voice ? VOICE_EXPLANATIONS[form.voice] : "";
  const genre_explanation = form.genre ? GENRE_EXPLANATIONS[form.genre] : "";

  const validateStep = (s) => {
    if (s === 1) {
      if (form.relation === "Other") {
        return (
          form.otherRelation.trim() !== "" &&
          form.recipient !== "" &&
          form.agegroup !== ""
        );
      } else {
        return (
          form.relation !== "" && form.recipient !== "" && form.agegroup !== ""
        );
      }
    }

    if (s === 2) return form.qualities !== "";
    if (s === 3) return form.moment !== "";
    if (s === 4) return form.specialmsg !== "";
    if (s === 5) return form.genre !== "" && form.voice !== "";
    if (s === 6)
      return (
        /\S+@\S+\.\S+/.test(form.email) &&
        form.ack === true &&
        form.voucherNo.trim() !== ""
      );

    // if (s === 1) return form.genre !== "";
    // if (s === 2) return form.whoFor.trim() !== "" && form.description.trim() !== "";
    // if (s === 3) return form.otherMessage.trim() !== "" && /\S+@\S+\.\S+/.test(form.email);
    return false;
  };

  const next = () => {
    if (validateStep(step)) setStep(step + 1);
  };
  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(6)) return;
    // Build payload: if relation is "Other", use otherRelation instead
    const payload = {
      ...form,
      relation: form.relation === "Other" ? form.otherRelation : form.relation,
    };
    delete payload.otherRelation; // remove helper field
    // console.log("Payload for Postman:\n", JSON.stringify(payload, null, 2));
    try {
      setStatus("Saving...");

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStatus("Saved successfully.");
      setOrderRef(data.songcode);
      setModalOpen(true);
      setForm({
        relation: "",
        recipient: "",
        agegroup: "",
        qualities: "",
        moment: "",
        specialmsg: "",
        genre: "",
        voice: "",
        email: "",
        ack: false,
        voucherNo: "",
      });
    } catch (err) {
      setStatus("Error saving: " + err.message);
    }
  };

  const totalSteps = 6;
  const progress = Math.round((step / totalSteps) * 100);

  const isOtherVisible = form.relation === "Other";
  const isOtherError = touched.otherRelation && !form.otherRelation?.trim();
  const isRecipientError = touched.recipient && !form.recipient?.trim();
  const isQualitiesError = touched.qualities && !form.qualities?.trim();
  const isMomentError = touched.moment && !form.moment?.trim();
  const isSpecialmsgError = touched.specialmsg && !form.moment?.trim();
  const isEmailError = touched.email && !form.email?.trim();
  const isAckError = touched.ack && !form.ack;

  const handleNext = () => {
    // mark step-1 fields as touched
    if (step === 1) {
      setTouched((prev) => ({ ...prev, recipient: true, otherRelation: true }));
    }

    // run your validateStep logic and only advance if valid
    const errors = validateStep(step, form);
    if (Object.keys(errors).length === 0) {
      setStep((prev) => prev + 1);
    }
  };

  const otherRef = useRef(null);
  const rafId = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    if (form.relation === "Other") {
      // schedule focus after the input mounts
      rafId.current = requestAnimationFrame(() => {
        // modern browsers support preventScroll; fallback if not supported
        try {
          otherRef.current?.focus?.({ preventScroll: true });
        } catch {
          otherRef.current?.focus?.();
        }
      });
    }

    // cleanup: cancel any pending rAF when effect re-runs or component unmounts
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [form.relation]);

  useEffect(() => {
    if (step === 6 && emailRef.current) {
      emailRef.current.focus();
    }
  }, [step]);

  return (
    <form className="max-w-3xl mx-auto p-4" onSubmit={handleSubmit} noValidate>
      {/* Page label and progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 font-serif">
          <div className="text-sm font-medium text-gray-700">
            {" "}
            {step === 6 ? "Final Step" : `Step ${step} of ${totalSteps}`}{" "}
          </div>
          <div className="text-sm text-gray-600">{progress}% complete</div>
        </div>

        <div
          className="w-full h-2 bg-gray-200 rounded overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Progress ${progress} percent`}
        >
          <div
            className="h-full bg-olive-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ...rest of the form (pages, navigation, status) */}

      {/* Page 1 */}
      {step === 1 && (
        <div>
          <h2 className="roboto-condensed-forms text-2xl text-center">
            Let's Create A Song. What's In Your Heart?
          </h2>
          <br />

          {/* SELECT RELATIONSHIP */}

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            Who is this song for? <span className="text-sm font-light">*</span>
          </h3>

          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_relation.map((opt) => {
              const selected = form.relation === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800 hover:scale-105 
                    ${selected ? "bg-olive-800 text-white" : "border-gray-200 bg-white hover:shadow-md hover:bg-olive-100"} `}
                >
                  <input
                    type="radio"
                    name="relation"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                      if (opt === "Other") {
                        setForm((prev) => ({
                          ...prev,
                          relation: "Other",
                          otherRelation: "",
                        }));
                        setTouched((prev) => ({
                          ...prev,
                          otherRelation: false,
                        })); // reset visibility
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          relation: opt,
                          otherRelation: "",
                        }));
                      }
                    }}
                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          </div>

          {/* SPECIFIC OTHER
          show input only when Other is selected */}

          {isOtherVisible && (
            <div className="mt-3 w-full max-w-lg roboto-condensed-forms">
              <label className="block">
                <span className="block text-sm font-mediun text-gray-700">
                  Please specify: *
                </span>

                <input
                  ref={otherRef}
                  type="text"
                  id="otherRelation"
                  placeholder="e.g., My Pastor, My Colleague..."
                  value={form.otherRelation || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      otherRelation: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, otherRelation: true }))
                  }
                  aria-invalid={isOtherError}
                  aria-describedby={
                    isOtherError ? "otherRelation-error" : undefined
                  }
                  className={`mt-1 w-full rounded-md p-4 roboto-condensed-forms focus:outline-none
                  ${
                    isOtherError
                      ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                      : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
                  }`}
                />
              </label>

              {isOtherError && (
                <p
                  id="otherRelation-error"
                  className="font-thin font-mono mt-1 text-xs text-red-600 text-sm italic"
                >
                  Please specify who the song is for.
                </p>
              )}
            </div>
          )}

          <br />
          <br />

          {/* INPUT NAME OF SPECIAL PERSON */}
          <div>
            <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms ">
              What's Their Name? <span className="text-sm font-light">*</span>
            </h3>
            <label className="block mb-3">
              <input
                className={`mt-1 w-full rounded-md p-4 text-black font-mono cursor-pointer border focus:outline-none
        ${
          isRecipientError
            ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
            : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
        }`}
                value={form.recipient}
                onChange={(e) =>
                  setForm({ ...form, recipient: e.target.value })
                }
                required
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, recipient: true }))
                }
                aria-invalid={isRecipientError}
                aria-describedby={
                  isRecipientError ? "recipient-error" : undefined
                }
                maxLength={100} // ✅ enforce max length
              />
            </label>

            {/* Error message */}
            {isRecipientError && (
              <p
                id="recipient-error"
                className="font-thin font-mono mt-1 text-xs text-red-600 text-sm italic"
              >
                Please tell us their name.
              </p>
            )}

            {/* Hint */}
            <p className="font-thin font-mono mt-1 text-xs text-gray-600 italic">
              Hint: Tell us how you'd pronounce their name too. E.g. Leila:
              lay-luh (or lie-luh).
            </p>
          </div>

          <br />
          <br />
          {/* SELECT AGE GROUP */}

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            What's Their Age Group?{" "}
            <span className="text-sm font-light">*</span>
          </h3>

          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_agegroup.map((opt) => {
              const selected = form.agegroup === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? "bg-olive-800 text-white" : "border-gray-200 bg-white"}`}
                >
                  <input
                    type="radio"
                    name="agegroup"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                      setForm((prev) => ({ ...prev, agegroup: opt }));
                    }}
                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Page 2 */}
      {step === 2 && (
        // {/* QUALITIES */}

        <div>
          <h2 className="roboto-condensed-forms text-2xl text-center">
            What Makes Them Songworthy
          </h2>
          <br />

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            Their Special Qualities{" "}
            <span className="text-sm font-light">*</span>
          </h3>

          <label className="block mb-0">
            <textarea
              className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${
                isQualitiesError
                  ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                  : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
              rows={3}
              value={form.qualities}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, qualities: e.target.value }))
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, qualities: true }))
              }
              required
              aria-invalid={isQualitiesError}
              aria-describedby={
                isQualitiesError ? "qualities-error" : undefined
              }
              placeholder="Write With Your Heart! E.g. 'He makes me feel loved in a way no one else ever has.' Or 'Kind-hearted, loyal, and endlessly loving.'"
              maxLength={250} // ✅ enforce max length
            />
          </label>

          {isQualitiesError && (
            <p
              id="qualities-error"
              className="font-thin font-mono mt-1 text-xs text-red-600 italic"
            >
              Please say something.
            </p>
          )}
          {/* Character counter */}
          <p className="font-thin font-mono mt-0 text-xs text-gray-600 italic text-end p-0">
            {form.qualities.length}/250
          </p>
        </div>
      )}

      {/* Page 3 */}
      {step === 3 && (
        // {/* MEMORIES */}
        <div>
          <h2 className="roboto-condensed-forms text-2xl text-center">
            Which Memories Stand Out The Most
          </h2>
          <br />

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            Some Moments You’ll Always Remember{" "}
            <span className="text-sm font-light">*</span>
          </h3>

          <label className="block mb-0">
            <textarea
              className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${
                isMomentError
                  ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                  : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
              rows={3}
              value={form.moment}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, moment: e.target.value }))
              }
              onBlur={() => setTouched((prev) => ({ ...prev, moment: true }))}
              required
              aria-invalid={isMomentError}
              aria-describedby={isMomentError ? "moment-error" : undefined}
              placeholder="Hint: These can be big milestones or small everyday moments—anything that feels meaningful to you. A moment with them you’ll never forget, a shared adventure, or even a quiet memory that means a lot."
              maxLength={250} // ✅ enforce max length
            />
          </label>

          {isMomentError && (
            <p
              id="moment-error"
              className="font-thin font-mono mt-1 text-xs text-red-600 italic"
            >
              Any standout memory with them?.
            </p>
          )}
          {/* Character counter */}
          <p className="font-thin font-mono mt-0 text-xs text-gray-600 italic text-end p-0">
            {form.moment.length}/250
          </p>
        </div>
      )}

      {step === 4 && (
        // {/* SPECIAL MESSAGE */}
        <div>
          <h2 className="roboto-condensed-forms text-2xl text-center">
            A Note Straight From The Heart
          </h2>
          <br />

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            What should this song say for you?{" "}
            <span className="text-sm font-light">*</span>
          </h3>

          <label className="block mb-0">
            <textarea
              className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${
                isSpecialmsgError
                  ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                  : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
              rows={3}
              value={form.specialmsg}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, specialmsg: e.target.value }))
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, specialmsg: true }))
              }
              required
              aria-invalid={isSpecialmsgError}
              aria-describedby={
                isSpecialmsgError ? "specialmsg-error" : undefined
              }
              placeholder="We’ll try our best to weave this message into the song, so write what you want them to hear when the music plays."
              maxLength={250} // ✅ enforce max length
            />
          </label>

          {isSpecialmsgError && (
            <p
              id="specialmsg-error"
              className="font-thin font-mono mt-1 text-xs text-red-600 italic"
            >
              What's in your heart?.
            </p>
          )}
          {/* Character counter */}
          <p className="font-thin font-mono mt-0 text-xs text-gray-600 italic text-end p-0">
            {form.specialmsg.length}/250
          </p>
        </div>
      )}

      {step === 5 && (
        // {/* GENRE */}
        <div>
          <h2 className="roboto-condensed-forms text-2xl text-center">
            Let's Style Your Song
          </h2>
          <br />

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            Your Preferred Musical Style?{" "}
            <span className="text-sm font-light">*</span>
          </h3>
          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_genre.map((opt) => {
              const selected = form.genre === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? "bg-olive-800 text-white" : "border-gray-200 bg-white hover:shadow-md hover:bg-olive-100"}`}
                >
                  <input
                    type="radio"
                    name="genre"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                      setForm((prev) => ({ ...prev, genre: opt }));
                    }}
                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          </div>
          {/* genre explanation paragraph */}
          <p
            id="genre-explanation"
            className={`mt-3 text-xs font-mono italic ${genre_explanation ? "text-gray-700" : "text-gray-400 italic"}`}
            aria-live="polite"
          >
            {genre_explanation}
          </p>
          <br />
          <br />

          {/* VOICE GENDER */}
          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
            Your Preferred Voice Gender{" "}
            <span className="text-sm font-light">*</span>
          </h3>
          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_voice.map((opt) => {
              const selected = form.voice === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? "bg-olive-800 text-white" : "border-gray-200 bg-white hover:shadow-md hover:bg-olive-100"}`}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                      setForm((prev) => ({ ...prev, voice: opt }));
                    }}
                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          </div>

          {/* voice explanation paragraph */}
          <p
            id="voice-explanation"
            className={`mt-3 text-xs font-mono italic ${voice_explanation ? "text-gray-700" : "text-gray-400 italic"}`}
            aria-live="polite"
          >
            {voice_explanation}
          </p>
        </div>
      )}

      {step === 6 && (
        // {/* CHECKOUT */}
        <div className="overflow-hidden">
          <h2 className="roboto-condensed-forms text-2xl text-center">
            Lets Pack Your Gift For{" "}
            <span className="font-bold mogra-regular text-3xl">
              {form.recipient}!
            </span>
          </h2>
          <br />

          <div className="w-full shadow-md py-8 px-14 bg-gray-100 text-sm font-mono border-2 border-gray-200 carrois-gothic-sc-regular">
            <div className="my-0">
              <p className="text-center font-black">
                CUSTOM SONG SPECIFICATION
              </p>
              <br></br>
              <p className="font-light">
                A custom song dedicated to{" "}
                <span className="font-black text-blue-800 italic delius-regular">
                  {form.recipient}{" "}
                </span>
                (
                <span className="font-black text-blue-800 italic delius-regular">
                  {form.relation === "Other"
                    ? form.otherRelation
                    : form.relation}
                </span>
                ). <span> </span>
                {form.recipient}'s age group is{" "}
                <span className="font-black text-blue-800 italic delius-regular">
                  {form.agegroup}
                </span>
                .
              </p>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Special Qualities :</span>
                <span className="w-3/4 text-blue-800 italic text-left border-2 px-1 font-black text-blue-800 italic delius-regular">
                  {form.qualities}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Memorable Moments :</span>
                <span className="w-3/4 text-blue-800 italic text-left border-2 px-1 font-black text-blue-800 italic delius-regular">
                  {form.moment}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">
                  What This Song Should Say :
                </span>
                <span className="w-3/4 text-blue-800 italic text-left border-2 px-1 font-black text-blue-800 italic delius-regular">
                  {form.specialmsg}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Song Style / Genre :</span>
                <span className="w-3/4 text-blue-800 italic text-left border-2 px-1 font-black text-blue-800 italic delius-regular">
                  {form.genre}
                </span>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">
                  Preferred Voice Gender :
                </span>
                <span className="w-3/4 text-blue-800 italic text-left border-2 px-1 font-black text-blue-800 italic delius-regular">
                  {form.voice}
                </span>
              </div>

              <br></br>
              <br></br>
            </div>
            <div className="flex flex-col md:flex-row gap-6 ">
              <div className="w-2/4 shadow-md p-4 bg-sand-300 radius-md shadow-xl border-gray-300 border-2">
                <div className="font-mono text-xl font-black">
                  Order Summary
                </div>
                <br></br>
                <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2">
                  <span>Delivery Date:</span>
                  <span className="justify-end text-blue-900 text-xl font-black">
                    {new Date(
                      new Date().setDate(new Date().getDate() + 7),
                    ).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <br></br>
                <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2">
                  <span>Heart's Prayer in a Song:</span>
                  <span className="justify-end text-blue-900 font-black">
                    ${REG_PRICE} USD
                  </span>
                </div>
                <hr></hr>
                <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2">
                  <span>Less: Introductory Discount:</span>
                  <span className="justify-end text-red-900 font-black">
                    (${INTRO_DISC} USD)
                  </span>
                </div>
                {form.voucherNo &&
                  vouchers.find(
                    (v) =>
                      v.vouchercode === form.voucherNo &&
                      v.valid === true &&
                      v.claimed === false,
                  ) && (
                    <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2">
                      {" "}
                      <span>Less: Voucher Discount</span>{" "}
                      <span className="justify-end text-red-900 font-black">
                        {" "}
                        ({" "}
                        {
                          vouchers.find((v) => v.vouchercode === form.voucherNo)
                            .discount
                        }{" "}
                        %){" "}
                      </span>{" "}
                    </div>
                  )}
                <br></br>
                <div className="flex carrois-gothic-sc-regular text-md justify-between items-end border-blue-100 border-b-2">
                  <span className="font-black text-xl font-mono">NETT:</span>
                  <span className="justify-end text-blue-900 text-2xl font-black">
                    ${nett} USD
                  </span>
                </div>
              </div>

              <div className="w-2/4 delius-regular text-md space-y-0">
                {/* Existing feature list */}
                <div className="border-2 border-gray-200 bg-gradient-to-b from-black to-yellow-700 px-4 py-2 shadow rounded-xl mb-4">
                  <div className="flex gap-2 items-center ">
                    <GiCheckMark className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">
                      Custom Song delivered in 7 days
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <GiCheckMark className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">
                      Recorded in High-fidelity Audio
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <GiCheckMark className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">
                      30-day Money-Back Guarantee
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <GiCheckMark className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">
                      Prayerfully and artistically crafted
                    </span>
                  </div>
                </div>
                {/* New email input */}
                <div className="flex flex-col carrois-gothic-sc-regular ">
                  <label htmlFor="email" className="text-black text-sm">
                    Email Address:
                    <br />
                    <span className="text-xs italic text-gray-600">
                      (We will deliver your song here)
                    </span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    placeholder="Enter a valid email address"
                    className="border border-gray-600 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm tracking-tight"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, email: true }))
                    }
                    aria-invalid={isEmailError}
                    aria-describedby={isEmailError ? "email-error" : undefined}
                    maxLength={150}
                  />
                </div>

                {/* ✅ New Voucher No. field */}
                <div className="flex flex-col carrois-gothic-sc-regular pt-2">
                  <label htmlFor="voucherNo" className="text-black text-sm">
                    Voucher No.
                  </label>
                  <input
                    type="text"
                    id="voucherNo"
                    name="voucherNo"
                    value={form.voucherNo}
                    placeholder="Enter your voucher number"
                    className={`border rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 font-mono text-sm tracking-tight 
                    ${voucherError ? "border-red-600 focus:ring-red-500" : "border-gray-600 focus:ring-blue-500"}`}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voucherNo: e.target.value.toUpperCase(),
                      })
                    }
                    maxLength={50}
                    aria-invalid={!!voucherError}
                    aria-describedby={
                      voucherError ? "voucher-error" : undefined
                    }
                  />

                  {/* ✅ Error message */}
                  {voucherError && (
                    <span
                      id="voucher-error"
                      className="text-red-600 text-xs mt-1"
                    >
                      {voucherError}
                    </span>
                  )}
                </div>

                <br />
                {/* New Terms of Service checkbox */}
                <div className="flex items-center space-x-2">
                  {" "}
                  <input
                    type="checkbox"
                    id="ack"
                    name="ack"
                    checked={form.ack}
                    onChange={(e) =>
                      setForm({ ...form, ack: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border border-gray-600 rounded focus:ring-blue-500"
                    required
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, ack: true }))
                    }
                    aria-invalid={isAckError}
                    aria-describedby={isAckError ? "ack-error" : undefined}
                  />{" "}
                  <label
                    htmlFor="ack"
                    className="text-black text-lg carrois-gothic-sc-regular text-xs"
                  >
                    {" "}
                    I accept the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {" "}
                      Terms of Service{" "}
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {" "}
                      Privacy Policy{" "}
                    </button>{" "}
                  </label>{" "}
                  {showTerms && (
                    <Modal
                      title="Terms of Service"
                      filePath="/tos.html"
                      onClose={() => setShowTerms(false)}
                    />
                  )}{" "}
                  {showPrivacy && (
                    <Modal
                      title="Privacy Policy"
                      filePath="/pp.html"
                      onClose={() => setShowPrivacy(false)}
                    />
                  )}{" "}
                </div>
                {/* Terms of Service and Privacy Policy block */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}

      <div className="flex justify-between mt-4 roboto-condensed-forms font-light">
        {step === 6 ? (
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded ${step === 1 ? "bg-gray-200 text-gray-500" : "bg-olive-800 text-white hover:shadow-md hover:bg-olive-900"}`}
          >
            <FaRegArrowAltCircleLeft />
            Review Survey
          </button>
        ) : (
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded ${step === 1 ? "bg-gray-200 text-gray-500" : "bg-olive-800 text-white hover:shadow-md hover:bg-olive-900"}`}
          >
            <FaRegArrowAltCircleLeft />
            Back
          </button>
        )}

        {step < 6 ? (
          <button
            type="button"
            onClick={next}
            disabled={!validateStep(step)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${validateStep(step) ? "bg-olive-800 text-white hover:shadow-md hover:bg-olive-900" : "bg-gray-200 text-gray-500"}`}
          >
            Next
            <FaRegArrowAltCircleRight />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!validateStep(6)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${validateStep(6) ? "bg-olive-800 text-white hover:shadow-md hover:bg-olive-900" : "bg-gray-200 text-gray-500"}`}
          >
            <MdOutlineShoppingCartCheckout />
            Checkout
          </button>
        )}
      </div>
      {modalOpen && (
        <Modal
          title="Thank you for your order"
          onClose={() => {
            setModalOpen(false);
            navigate("/");
            // ✅ redirect to front page
          }}
        >
          {" "}
          <p>
            {" "}
            Our creatives team will start work on it.
            <br /> Order Reference # {orderRef}{" "}
          </p>{" "}
        </Modal>
      )}
    </form>
  );
}
