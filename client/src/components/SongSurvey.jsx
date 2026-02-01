import React, { useState, useRef, useEffect } from "react";
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";


const API_BASE = process.env.REACT_APP_API_URL || '';
const OPTIONS_genre = [
  "Worship","Jazz","R&B / Soul","Country","Pop","Rap / Hip-hop", "Electronic","Reggae", "Indie Pop Rock", "Latin-Inspired", "Chorale", "Cinematic / Epic"
];
const OPTIONS_relation = [
  "Wife","Husband","Girlfriend","Boyfriend","Son","Daughter","Mom","Dad","Sibling","Friend","For Me","Other"
];
const OPTIONS_agegroup = [
  "Adult","Child","Teen","Young Adult","Older Adult", "Unspecified"
];

const OPTIONS_voice = [
  "Male (Deep/Warm)","Male (Bright/Higher-Pitched)", "Female (Soft/Expressive)", "Female (Bright/Powerful)", "Neutral", "No Preference - Surprise Me"
];


const GENRE_EXPLANATIONS = 
{ 
  Worship: "Uplifting and spiritual, focused on devotion, gratitude, and heartfelt messages.", 
  Jazz: "Smooth, expressive, and improvisational, with rich melodies and soulful instrumentals.", 
  "R&B / Soul": "Emotional and melodic, full of smooth vocals, rhythm, and heartfelt feeling.", 
  Country: "Story-driven and warm, with guitars or banjo, capturing life, love, and memories.", 
  Pop: "Catchy and upbeat, with memorable hooks, bright melodies, and feel-good energy.", 
  "Rap / Hip-hop": "Rhythmic, lyrical, and bold, with strong beats and storytelling vocals.",
  Electronic: "Modern, synth-driven, and energetic, ranging from danceable to atmospheric vibes.",
  Reggae: "Laid-back, groovy, and positive, with offbeat rhythms and chill energy.",
  "Indie Pop Rock": "Melodic and alternative, blending indie authenticity with catchy, feel-good hooks.",
  "Latin-Inspired": "Vibrant rhythms and soulful melodies influenced by Latin sounds",
  Chorale: "Harmonized group vocals, often cinematic, classical, or sacred in sound.",
  "Cinematic / Epic": "Big, dramatic, and emotional, with sweeping orchestration and powerful builds."
};

const VOICE_EXPLANATIONS = 
{ 
  'Male (Deep/Warm)': "Strong, rich, and emotional male tone.", 
  'Male (Bright/Higher-Pitched)': "Energetic, light, or uplifting male tone.", 
  "Female (Soft/Expressive)": "Gentle, emotional, or intimate female tone.", 
  "Female (Bright/Powerful)": "Energetic, bold, or soaring female tone.", 
  Neutral: "Gender-ambiguous voice that isn’t strongly male or female.", 
  "No Preference - Surprise Me": "Let our composer pick the best fit for your song." };



export default function SongRequestForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    relation: "",
    recepient: "",
    agegroup: "",
    qualities: "",
    moment: "",
    specialmsg: "",
    genre: "",
    voice: "",
    email: ""
  });
  const [status, setStatus] = useState(null);
  const [touched, setTouched] = useState({ otherRelation: false, recepient: false });
  const voice_explanation = form.voice ? VOICE_EXPLANATIONS[form.voice] : "";  
  const genre_explanation = form.genre ? GENRE_EXPLANATIONS[form.genre] : "";  

  const validateStep = (s) => {
  if (s === 1) {
    if (form.relation === 'Other') {
      return form.otherRelation.trim() !== "" && form.recepient !== "" && form.agegroup !== "";
    } else {
      return form.relation !== "" && form.recepient !== "" && form.agegroup !== "";
    }
  }

  if (s === 2) return form.qualities !== ""
  if (s === 3) return form.moment !== ""
  if (s === 4) return form.specialmsg !== ""
  if (s === 5) return form.genre !== "" && form.voice !== ""
  

  // if (s === 1) return form.genre !== "";
    // if (s === 2) return form.whoFor.trim() !== "" && form.description.trim() !== "";
    // if (s === 3) return form.otherMessage.trim() !== "" && /\S+@\S+\.\S+/.test(form.email);
    return false;
  };

  const next = () => { if (validateStep(step)) setStep(step + 1); };
  const back = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    try {
      setStatus("Saving...");
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("Saved successfully.");
      setForm({ relation:"", recepient:"", agerange:"", qualities:"", momnent:"", specialmsg:"", genre:"", voice:"", email:"" });
      setStep(1);
    } catch (err) {
      setStatus("Error saving: " + err.message);
    }
  };

const totalSteps = 6;
const progress = Math.round((step / totalSteps) * 100);

const isOtherVisible = form.relation === "Other";
const isOtherError = touched.otherRelation && !form.otherRelation?.trim();
const isRecepientError = touched.recepient && !form.recepient?.trim();
const isQualitiesError = touched.qualities && !form.qualities?.trim();
const isMomentError = touched.moment && !form.moment?.trim();
const isSpecialmsgError = touched.specialmsg && !form.moment?.trim();

const handleNext = () => {
  // mark step-1 fields as touched
  if (step === 1) {
    setTouched(prev => ({ ...prev, recepient: true, otherRelation: true }));
  }

  // run your validateStep logic and only advance if valid
  const errors = validateStep(step, form);
  if (Object.keys(errors).length === 0) {
    setStep(prev => prev + 1);
  }
};

const otherRef = useRef(null);
const rafId = useRef(null);

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



return (
  <form className="max-w-3xl mx-auto p-4" onSubmit={handleSubmit} noValidate>
    {/* Page label and progress bar */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 font-serif">
        <div className="text-sm font-medium text-gray-700"> {step === 6 ? "Final Step" : `Step ${step} of ${totalSteps}`} </div>
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
          <h2 className="roboto-condensed-forms text-2xl text-center">Let's Create A Song. What's In Your Heart?</h2>
          <br />

          {/* SELECT RELATIONSHIP */}

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">Who is this song for? <span className="text-sm font-light">*</span></h3>

          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_relation.map(opt => {
              const selected = form.relation === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800 hover:scale-105 
                    ${selected ? 'bg-olive-800 text-white' : 'border-gray-200 bg-white hover:shadow-md hover:bg-olive-100'} `}
                >
                  <input
                    type="radio"
                    name="relation"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                      if (opt === "Other") {
                        setForm(prev => ({ ...prev, relation: "Other", otherRelation: "" }));
                        setTouched(prev => ({ ...prev, otherRelation: false })); // reset visibility
                      } else {
                        setForm(prev => ({ ...prev, relation: opt, otherRelation: "", whoFor: opt }));
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
              <span className="block text-sm font-mediun text-gray-700">Please specify: *</span>

              <input
                ref={otherRef}
                type="text"
                id="otherRelation"
                placeholder="e.g., My Pastor, My Colleague..."
                value={form.otherRelation || ""}
                onChange={e => setForm(prev => ({ ...prev, otherRelation: e.target.value }))}
                onBlur={() => setTouched(prev => ({ ...prev, otherRelation: true }))}
                aria-invalid={isOtherError}
                aria-describedby={isOtherError ? "otherRelation-error" : undefined}
                className={`mt-1 w-full rounded-md p-4 roboto-condensed-forms focus:outline-none
                  ${isOtherError
                    ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                    : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
                  }`}
              />
            </label>

            {isOtherError && (
              <p id="otherRelation-error" className="font-thin font-mono mt-1 text-xs text-red-600 text-sm italic">
                Please specify who the song is for.
              </p>
            )}
          </div>
          )}

          <br/><br/>

         {/* INPUT NAME OF SPECIAL PERSON */}
          <div>
              <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms ">What's Their Name? <span className="text-sm font-light">*</span></h3>
              <label className="block mb-3">
                  <input 
                      className={`mt-1 w-full rounded-md p-4 text-black font-mono cursor-pointer border border-olive-800 focus:outline-none
                          ${isRecepientError
                           ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                           : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
                          }`}
                      value={form.recepient}
                      onChange={e => setForm({...form, recepient: e.target.value})} required 
                      onBlur={() => setTouched(prev => ({ ...prev, recepient: true }))}
                      aria-invalid={isRecepientError}
                      aria-describedby={isRecepientError ? "recepient-error" : undefined} />
              </label>
              {isRecepientError && (
                  <p id="recepient-error" className="font-thin font-mono mt-1 text-xs text-red-600 text-sm italic">
                      Please tell us their name.
                  </p>
              )}              
              <p className="font-thin font-mono mt-1 text-xs text-gray-600 text-sm italic">
                  Hint: Tell us how you'd pronounce their name too. E.g. Leila: lay-luh (or lie-luh).
              </p>

          </div>
          

          <br/><br/>
          {/* SELECT AGE GROUP */}

          <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">What's Their Age Group? <span className="text-sm font-light">*</span></h3>

          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_agegroup.map(opt => {
              const selected = form.agegroup === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? 'bg-olive-800 text-white' : 'border-gray-200 bg-white'}`}
                >
                  <input
                    type="radio"
                    name="agegroup"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                        setForm(prev => ({ ...prev, agegroup: opt }));
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
        <h2 className="roboto-condensed-forms text-2xl text-center">What Makes Them Songworthy</h2>
        <br />

        <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
          Their Special Qualities <span className="text-sm font-light">*</span>
        </h3>

        <label className="block mb-3">
          <textarea
            className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${isQualitiesError
                ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
            rows={3}
            value={form.qualities}
            onChange={e => setForm(prev => ({ ...prev, qualities: e.target.value }))}
            onBlur={() => setTouched(prev => ({ ...prev, qualities: true }))}
            required
            aria-invalid={isQualitiesError}
            aria-describedby={isQualitiesError ? "qualities-error" : undefined}
            placeholder="Write With Your Heart! E.g. 'He makes me feel loved in a way no one else ever has.' Or 'Kind-hearted, loyal, and endlessly loving.'"            
          />
        </label>

        {isQualitiesError && (
          <p id="qualities-error" className="font-thin font-mono mt-1 text-xs text-red-600 italic">
            Please say something.
          </p>
        )}

      </div>
      )}

      {/* Page 3 */}
      {step === 3 && (
      // {/* MEMORIES */}
      <div>
        <h2 className="roboto-condensed-forms text-2xl text-center">Which Memories Stand Out The Most</h2>
        <br />

        <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
          Some Moments You’ll Always Remember <span className="text-sm font-light">*</span>
        </h3>

        <label className="block mb-3">
          <textarea
            className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${isMomentError
                ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
            rows={3}
            value={form.moment}
            onChange={e => setForm(prev => ({ ...prev, moment: e.target.value }))}
            onBlur={() => setTouched(prev => ({ ...prev, moment: true }))}
            required
            aria-invalid={isMomentError}
            aria-describedby={isMomentError ? "moment-error" : undefined}
            placeholder="Hint: These can be big milestones or small everyday moments—anything that feels meaningful to you. A moment with them you’ll never forget, a shared adventure, or even a quiet memory that means a lot."         
          />
        </label>

        {isMomentError && (
          <p id="moment-error" className="font-thin font-mono mt-1 text-xs text-red-600 italic">
            Any standout memory with them?.
          </p>
        )}
      </div>
      )}


      {step === 4 && (
      // {/* SPECIAL MESSAGE */}
      <div>
        <h2 className="roboto-condensed-forms text-2xl text-center">A Note Straight From The Heart</h2>
        <br />

        <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
          What should this song say for you? <span className="text-sm font-light">*</span>
        </h3>

        <label className="block mb-3">
          <textarea
            className={` mt-1 w-full rounded-md p-4 border font-mono text-black focus:outline-none placeholder:text-sm placeholder:italic
              ${isSpecialmsgError
                ? "border-2 border-red-600 focus:ring-2 focus:ring-red-400"
                : "border border-olive-800 focus:ring-2 focus:ring-olive-400"
              }`}
            rows={3}
            value={form.specialmsg}
            onChange={e => setForm(prev => ({ ...prev, specialmsg: e.target.value }))}
            onBlur={() => setTouched(prev => ({ ...prev, specialmsg: true }))}
            required
            aria-invalid={isSpecialmsgError}
            aria-describedby={isSpecialmsgError ? "specialmsg-error" : undefined}
            placeholder="We’ll try our best to weave this message into the song, so write what you want them to hear when the music plays."         
          />
        </label>

        {isSpecialmsgError && (
          <p id="specialmsg-error" className="font-thin font-mono mt-1 text-xs text-red-600 italic">
            What's in your heart?.
          </p>
        )}
      </div>
      )}

      {step === 5 && (
      // {/* GENRE */}
      <div>
        <h2 className="roboto-condensed-forms text-2xl text-center">Let's Style Your Song</h2>
        <br />

        <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
          Your Preferred Musical Style? <span className="text-sm font-light">*</span>
        </h3>
          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_genre.map(opt => {
              const selected = form.genre === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? 'bg-olive-800 text-white' : 'border-gray-200 bg-white hover:shadow-md hover:bg-olive-100'}`}
                >
                  <input
                    type="radio"
                    name="genre"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                        setForm(prev => ({ ...prev, genre: opt }));
                    }}

                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          
          </div>
          {/* genre explanation paragraph */}
          <p id="genre-explanation" className={`mt-3 text-xs font-mono italic ${genre_explanation ? "text-gray-700" : "text-gray-400 italic"}`} aria-live="polite" >
            {genre_explanation}
          </p>
          <br /><br />
        

        {/* VOICE GENDER */}
        <h3 className="text-lg text-black font-semibold mb-3 roboto-condensed-forms">
          Your Preferred Voice Gender <span className="text-sm font-light">*</span>
        </h3>
          <div className="flex flex-wrap gap-3 roboto-condensed-forms">
            {OPTIONS_voice.map(opt => {
              const selected = form.voice === opt;
              return (
                <label
                  key={opt}
                  className={`cursor-pointer p-3 rounded-full min-w-[70px] border border-olive-800
                    ${selected ? 'bg-olive-800 text-white' : 'border-gray-200 bg-white hover:shadow-md hover:bg-olive-100'}`}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={opt}
                    className="hidden"
                    checked={selected}
                    onChange={() => {
                        setForm(prev => ({ ...prev, voice: opt }));
                    }}

                  />
                  <div className="text-center font-medium">{opt}</div>
                </label>
              );
            })}
          </div>
          
          {/* voice explanation paragraph */}
          <p id="voice-explanation" className={`mt-3 text-xs font-mono italic ${voice_explanation ? "text-gray-700" : "text-gray-400 italic"}`} aria-live="polite" >
            {voice_explanation}
          </p>

      </div>
      )}

      {step === 6 && (
      // {/* CHECKOUT */}
      <div>
        <h2 className="roboto-condensed-forms text-2xl text-center">Lets Pack Your Gift For <span className="font-bold mogra-regular text-3xl">{form.recepient}!</span></h2>
        <br />
      </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-4 roboto-condensed-forms font-light">
        <button type="button" onClick={back} disabled={step===1}
          className={`flex items-center gap-2 px-4 py-2 rounded ${step===1 ? 'bg-gray-200 text-gray-500' : 'bg-olive-800 text-white hover:shadow-md hover:bg-olive-900'}`}><FaRegArrowAltCircleLeft />Back</button>

        {step < 6 ? (
          <button type="button" onClick={next} disabled={!validateStep(step)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${validateStep(step) ? 'bg-olive-800 text-white hover:shadow-md hover:bg-olive-900' : 'bg-gray-200 text-gray-500'}`}>Next<FaRegArrowAltCircleRight /></button>
        ) : (
          <button type="submit" disabled={!validateStep(3)}
            className={`px-4 py-2 rounded ${validateStep(3) ? 'bg-olive-800 text-white' : 'bg-gray-200 text-gray-500'}`}>Submit</button>
        )}
      </div>

      {status && <p className="mt-3 text-sm">{status}</p>}
    </form>    
  );
}
