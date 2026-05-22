import React, { useState, useEffect } from "react";
import { 
  CensusRecord, 
  HOUSE_USE_OPTIONS, 
  OWNERSHIP_OPTIONS, 
  WATER_SOURCE_OPTIONS, 
  WATER_AVAILABILITY_OPTIONS, 
  VEHICLE_OPTIONS, 
  GENDER_OPTIONS, 
  CASTE_OPTIONS, 
  YES_NO_OPTIONS 
} from "../types";
import { 
  getGlobalNextBuildingNo, 
  getGlobalNextHouseNo, 
  getGlobalNextFamilyNo,
  checkIsResidential
} from "../utils/sorting";
import { 
  Plus, 
  X, 
  Save, 
  Clipboard, 
  PlusCircle, 
  FileText,
  Building2,
  Home,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Building,
  User,
  Flame,
  Laptop,
  Bike,
  Car,
  Check
} from "lucide-react";

interface CreateRecordFormProps {
  initialPlotNo?: string;
  initialBuildingNo?: string;
  allRecords: CensusRecord[];
  onSave: (record: CensusRecord) => Promise<boolean>;
  onClose: () => void;
}

export default function CreateRecordForm({ 
  initialPlotNo = "", 
  initialBuildingNo = "", 
  allRecords = [],
  onSave, 
  onClose 
}: CreateRecordFormProps) {
  // Wizard Core Steps: 
  // 1: Plot, 2: Building, 3: House, 4: Usage, 5: Family Details / Preview
  const [step, setStep] = useState<number>(1);

  // Form Field States
  const [plotNo, setPlotNo] = useState(initialPlotNo);
  const [buildingDecision, setBuildingDecision] = useState<"existing" | "new" | "">("");
  const [buildingNo, setBuildingNo] = useState(initialBuildingNo);
  
  const [houseDecision, setHouseDecision] = useState<"existing" | "new" | "">("");
  const [houseNo, setHouseNo] = useState("");
  const [houseUse, setHouseUse] = useState(HOUSE_USE_OPTIONS[0]); // default is "आवास"
  const [familyNo, setFamilyNo] = useState("");

  // Family details state (only active if residential)
  const [headName, setHeadName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);
  const [caste, setCaste] = useState(CASTE_OPTIONS[2]); // Default is "अन्य"
  const [ownership, setOwnership] = useState(OWNERSHIP_OPTIONS[0]);
  const [roomsCount, setRoomsCount] = useState<number | string>(1);
  const [membersCount, setMembersCount] = useState<number | string>(1);
  const [marriedCouples, setMarriedCouples] = useState<number | string>(1);

  // Amenity details state
  const [waterSource, setWaterSource] = useState(WATER_SOURCE_OPTIONS[3]); // hand pump
  const [waterAvailability, setWaterAvailability] = useState(WATER_AVAILABILITY_OPTIONS[0]); // inside premises
  const [lpg, setLpg] = useState(YES_NO_OPTIONS[0]); // हाँ
  const [laptop, setLaptop] = useState(YES_NO_OPTIONS[1]); // नहीं
  const [vehicle, setVehicle] = useState(VEHICLE_OPTIONS[3]); // नहीं
  const [car, setCar] = useState(YES_NO_OPTIONS[1]); // नहीं

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if chosen usage is residential using reusable helper function
  const isResidential = checkIsResidential(houseUse);

  // Unique plot suggestions extraction
  const uniquePlots = Array.from(new Set(allRecords.map(r => String(r["प्लॉट क्रमांक"] || "").trim()).filter(Boolean)));

  // Existing buildings in this plot
  const existingBuildingsInPlot = plotNo.trim() 
    ? Array.from(new Set(allRecords.filter(r => String(r["प्लॉट क्रमांक"]).trim() === plotNo.trim()).map(r => String(r["भवन नंबर"] || "").trim()).filter(Boolean)))
    : [];

  // Existing houses in this building (and this plot)
  const existingHousesInBuilding = (plotNo.trim() && buildingNo.trim())
    ? Array.from(new Set(allRecords.filter(r => String(r["प्लॉट क्रमांक"]).trim() === plotNo.trim() && String(r["भवन नंबर"]).trim() === buildingNo.trim()).map(r => String(r["जनगणना मकान नंबर"] || "").trim()).filter(Boolean)))
    : [];

  // GLOBAL AUTOMATIC SEQUENCE GENERATION LOGIC
  const suggestedBuilding = getGlobalNextBuildingNo(allRecords);
  const suggestedHouse = getGlobalNextHouseNo(allRecords);
  const suggestedFamily = getGlobalNextFamilyNo(allRecords);

  // Automatically update building selection options on load / plotNo change
  useEffect(() => {
    if (plotNo) {
      const buildings = allRecords.filter(r => String(r["प्लॉट क्रमांक"]).trim() === plotNo.trim()).map(r => String(r["भवन नंबर"] || "").trim()).filter(Boolean);
      if (buildings.length === 0) {
        // Automatically set decision to new since no buildings exist
        setBuildingDecision("new");
        setBuildingNo(suggestedBuilding);
      } else if (buildingNo && buildings.includes(buildingNo)) {
        setBuildingDecision("existing");
      }
    }
  }, [plotNo]);

  // When building changes, update house decision helper
  useEffect(() => {
    if (plotNo && buildingNo) {
      const houses = allRecords.filter(r => String(r["प्लॉट क्रमांक"]).trim() === plotNo.trim() && String(r["भवन नंबर"]).trim() === buildingNo.trim()).map(r => String(r["जनगणना मकान नंबर"] || "").trim()).filter(Boolean);
      if (houses.length === 0) {
        setHouseDecision("new");
        setHouseNo(suggestedHouse);
      }
    }
  }, [buildingNo]);

  // Handle building decision changes
  const handleBuildingDecisionChange = (decision: "existing" | "new") => {
    setBuildingDecision(decision);
    if (decision === "new") {
      setBuildingNo(suggestedBuilding);
      setHouseDecision("new");
      setHouseNo(suggestedHouse);
    } else {
      setBuildingNo(existingBuildingsInPlot[0] || "");
      setHouseDecision("");
      setHouseNo("");
    }
  };

  // Handle house decision changes
  const handleHouseDecisionChange = (decision: "existing" | "new") => {
    setHouseDecision(decision);
    if (decision === "new") {
      setHouseNo(suggestedHouse);
    } else {
      setHouseNo(existingHousesInBuilding[0] || "");
    }
  };

  // Keep F number updated based on usage
  useEffect(() => {
    if (isResidential) {
      setFamilyNo(suggestedFamily);
    } else {
      setFamilyNo("");
    }
  }, [houseUse]);

  // Validation Checks
  const isFamilyDuplicate = isResidential && familyNo.trim() && allRecords.some(r => 
    String(r["परिवार क्रमांक"] || "").trim().toUpperCase() === familyNo.trim().toUpperCase()
  );

  const isHouseDuplicate = houseDecision === "new" && houseNo.trim() && allRecords.some(r => 
    String(r["जनगणना मकान नंबर"] || "").trim().toUpperCase() === houseNo.trim().toUpperCase()
  );

  const isBuildingDuplicate = buildingDecision === "new" && buildingNo.trim() && allRecords.some(r => 
    String(r["भवन नंबर"] || "").trim().toUpperCase() === buildingNo.trim().toUpperCase()
  );

  // Stepping navigation validations
  const handleNextStep = () => {
    if (step === 1) {
      if (!plotNo.trim()) {
        alert("कृपया आगे बढ़ने के लिए प्लॉट क्रमांक दर्ज करें या सूची से चुनें।");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!buildingDecision) {
        alert("कृपया भवन निर्णय का चयन करें (मौजूदा भवन या नया भवन)।");
        return;
      }
      if (!buildingNo.trim()) {
        alert("कृपया भवन संख्या दर्ज करें।");
        return;
      }
      if (isBuildingDuplicate) {
        alert("चेतावनी: यह भवन संख्या पहले से ही मौजूद है। कृपया एक नया नंबर उपयोग करें या मौजूदा भवन का चयन करें।");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!houseDecision) {
        alert("कृपया मकान निर्णय का चयन करें (मौजूदा मकान या नया मकान)।");
        return;
      }
      if (!houseNo.trim()) {
        alert("कृपया जनगणना मकान संख्या दर्ज करें।");
        return;
      }
      if (isHouseDuplicate) {
        alert("चेतावनी: यह मकान संख्या पहले से ही किसी अन्य भवन में उपयोग की जा चुकी है। कृपया एक नया मकान नंबर उपयोग करें या 'मौजूदा मकान' चुनें।");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!houseUse) {
        alert("कृपया मकान का उपयोग चयन करें।");
        return;
      }
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotNo.trim() || !buildingNo.trim() || !houseNo.trim()) {
      alert("कृपया पदानुक्रम डेटा पूरा भरें।");
      return;
    }

    if (isResidential) {
      if (!familyNo.trim()) {
        alert("कृपया परिवार क्रमांक दर्ज करें।");
        return;
      }
      if (!headName.trim()) {
        alert("कृपया परिवार के मुखिया का नाम दर्ज करें।");
        return;
      }
      if (isFamilyDuplicate) {
        alert("त्रुटि: यह परिवार संख्या पहले से मौजूद है। नियमों के अनुसार द्विरुक्ति निषिद्ध है।");
        return;
      }
    } else {
      // Non-Residential: only headName, mobile, gender, caste, ownership are visible and required
      if (!headName.trim()) {
        alert("कृपया मुखिया/संपर्क व्यक्ति का नाम दर्ज करें।");
        return;
      }
      if (!mobile.trim() || mobile.trim().length !== 10) {
        alert("कृपया मान्य १० अंकों का संपर्क मोबाइल नंबर दर्ज करें।");
        return;
      }
      if (!gender) {
        alert("कृपया लिंग का चयन करें।");
        return;
      }
      if (!caste) {
        alert("कृपया श्रेणी SC/ST/अन्य का चयन करें।");
        return;
      }
      if (!ownership) {
        alert("कृपया मकान के स्वामित्व की स्थिति का चयन करें।");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const recordToSave: CensusRecord = {
        "लाइन क्रमांक": "", // automatically sorted and written sequentially in sheet
        "प्लॉट क्रमांक": plotNo.trim(),
        "भवन नंबर": buildingNo.trim().toUpperCase(),
        "जनगणना मकान नंबर": houseNo.trim().toUpperCase(),
        "जनगणना मकान का उपयोग": houseUse,
        "परिवार क्रमांक": isResidential ? (familyNo.trim().toUpperCase() || "F001") : "",
        "परिवार के मुखिया का नाम": headName.trim(),
        "मोबाइल नंबर": mobile.trim(),
        "लिंग": gender,
        "SC/ST/अन्य": caste,
        "मकान के स्वामित्व की स्थिति": ownership,
        "परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या": isResidential ? (Number(roomsCount) || 0) : "",
        "परिवार में रहने वालों की कुल संख्या": isResidential ? (Number(membersCount) || 0) : "",
        "विवाहित जोड़ों की संख्या": isResidential ? (Number(marriedCouples) || 0) : "",
        "पेयजल का मुख्य स्रोत": isResidential ? waterSource : "",
        "पेयजल स्रोत की उपलब्धता": isResidential ? waterAvailability : "",
        "LPG/PNG": isResidential ? lpg : "",
        "LAPTOP/ COMPUTER": isResidential ? laptop : "",
        "साइकिल/ स्कूटर": isResidential ? vehicle : "",
        "कार/ जीप/ वैन": isResidential ? car : ""
      };

      const success = await onSave(recordToSave);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      alert("डेटा सहेजने में त्रुटी: " + err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fadeIn animate-duration-200" id="create-record-modal">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Title Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-2xl p-2.5 shadow-md flex items-center justify-center">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">जनगणना स्मार्ट विज़ार्ड (Enumeration Wizard)</h2>
              <p className="text-[11px] text-slate-500 font-medium">पदानुक्रम नियमबद्ध सुदृढ़ प्रवाह: Plot ➔ Building ➔ House ➔ Usage ➔ Family</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Board */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { idx: 1, label: "प्लॉट" },
              { idx: 2, label: "भवन" },
              { idx: 3, label: "मकान" },
              { idx: 4, label: "उपयोग" },
              { idx: 5, label: "विवरण/पुष्टि" }
            ].map(s => {
              const isActive = step === s.idx;
              const isCompleted = step > s.idx;
              return (
                <div key={s.idx} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow" 
                        : isCompleted 
                          ? "bg-emerald-500 text-white shadow-sm" 
                          : "bg-slate-100 text-slate-400 border border-slate-205"
                    }`}>
                      {isCompleted ? <Check className="h-4.5 w-4.5" /> : s.idx}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      isActive ? "text-blue-600 font-extrabold" : isCompleted ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {s.idx < 5 && (
                    <div className="flex-1 h-0.5 mx-2 bg-slate-200 relative">
                      <div className="absolute inset-0 bg-emerald-500 transition-all duration-500" style={{ width: isCompleted ? "100%" : "0%" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Wizard Steps Form Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* STEP 1: SELECT PLOT */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn" id="wizard-step-1">
              <div className="border border-blue-50 bg-blue-50/30 rounded-2xl p-4 flex gap-3 text-xs text-blue-800">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <strong className="block font-bold">चरण १: प्लॉट का चुनाव (Plot Enumeration)</strong>
                  <p className="leading-relaxed text-blue-750">जनगणना प्रक्रिया शुरू करने के लिए उचित प्लॉट नंबर दर्ज करें। यदि यह नया प्लॉट है, तो नंबर सीधा दर्ज करें; अन्यथा सूची में से चयन करें।</p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5 max-w-md">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    प्लॉट क्रमांक (Plot Number) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="plots-datalist"
                    value={plotNo}
                    onChange={(e) => {
                      setPlotNo(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""));
                      // reset child steps as plot changes to avoid inconsistent groupings
                      setBuildingDecision("");
                      setBuildingNo("");
                      setHouseDecision("");
                      setHouseNo("");
                    }}
                    placeholder="उदा. 461, 461-A, 102"
                    className="w-full px-4 py-3 text-base bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-slate-800 transition-all"
                  />
                  <datalist id="plots-datalist">
                    {uniquePlots.map(p => (
                      <option key={p} value={p}>{p} (मौजूदा प्लॉट)</option>
                    ))}
                  </datalist>
                  <p className="text-[10px] text-slate-400 font-medium">शीट से खोज कर मौजूदा प्लॉट यहाँ ऑटो-दिखाई दे रहे हैं।</p>
                </div>

                {plotNo.trim() !== "" && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                    <span>सक्रिय चयन: <strong>प्लॉट क्रमांक - {plotNo}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BUILDING DECISION */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn" id="wizard-step-2">
              <div className="border border-blue-50 bg-blue-50/30 rounded-2xl p-4 flex gap-3 text-xs text-blue-800">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <strong className="block font-bold">चरण २: भवन का निर्णय (Building Number Decision)</strong>
                  <p className="leading-relaxed">क्या आप इस प्लॉट <strong>[{plotNo}]</strong> में पहले से मौजूद भवन नंबर पर काम करना चाहते हैं या एक नया भवन संख्या जोड़ना चाहते हैं? नए भवनों के लिए वैश्विक क्रमिक संख्या ऑटो-सुझाई जाएगी।</p>
                </div>
              </div>

              {/* Decision Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option Existing */}
                <div 
                  onClick={() => existingBuildingsInPlot.length > 0 && handleBuildingDecisionChange("existing")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                    existingBuildingsInPlot.length === 0 
                      ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" 
                      : buildingDecision === "existing"
                        ? "border-blue-600 bg-blue-50/30 shadow-md"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Building className={`h-6 w-6 ${buildingDecision === "existing" ? "text-blue-600" : "text-slate-400"}`} />
                    {buildingDecision === "existing" && <div className="h-4 w-4 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">मौजूदा भवन चुनें (Select Existing)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">प्लॉट {plotNo} में पूर्व-नियोजित भवनों में से चुनें।</p>
                  </div>
                  {existingBuildingsInPlot.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600 font-semibold">
                      <span>उपलब्ध: </span>
                      {existingBuildingsInPlot.map(b => (
                        <span key={b} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{b}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded inline-block mt-2">इस प्लॉट में कोई पूर्व भवन नहीं है</span>
                  )}
                </div>

                {/* Option Create New */}
                <div 
                  onClick={() => handleBuildingDecisionChange("new")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                    buildingDecision === "new"
                      ? "border-blue-600 bg-blue-50/30 shadow-md"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Sparkles className={`h-6 w-6 ${buildingDecision === "new" ? "text-blue-600" : "text-amber-500"}`} />
                    {buildingDecision === "new" && <div className="h-4 w-4 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">नया भवन जोड़ें (Create New)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">पूरी जनगणना शीट्स में अद्वितीय अगला भवन नंबर ऑटो-जेनरेट करें।</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded w-max mt-2">
                    सुझाया गया नया: {suggestedBuilding} (Global sequence)
                  </span>
                </div>

              </div>

              {/* Selection Input Area based on decision */}
              {buildingDecision === "existing" && (
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700">मौजूदा भवन नंबर चयन करें:</label>
                  <select
                    value={buildingNo}
                    onChange={(e) => {
                      setBuildingNo(e.target.value);
                      setHouseDecision("");
                      setHouseNo("");
                    }}
                    className="w-full max-w-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold focus:outline-none"
                  >
                    <option value="">-- भवन चुनें --</option>
                    {existingBuildingsInPlot.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {buildingDecision === "new" && (
                <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-amber-900">ऑटो-जेनरेटेड नया भवन नंबर:</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={buildingNo}
                      onChange={(e) => setBuildingNo(e.target.value.toUpperCase())}
                      className="max-w-[150px] px-3 py-2 bg-white border border-amber-200 text-amber-950 font-mono text-base font-extrabold focus:outline-none rounded-xl"
                    />
                    <span className="text-[10px] font-semibold text-amber-700">नियम: भवन क्रमिक सुसंगति (कभी रीसेट नहीं होती)</span>
                  </div>
                  {isBuildingDuplicate && (
                    <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>यह भवन संख्या पहले से प्रयुक्त है। कृपया अगला उचित अद्वितीय मान चुनें।</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* STEP 3: HOUSE DECISION */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn" id="wizard-step-3">
              <div className="border border-blue-50 bg-blue-50/30 rounded-2xl p-4 flex gap-3 text-xs text-blue-800">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <strong className="block font-bold">चरण ३: मकान का निर्णय (Census House Number Decision)</strong>
                  <p className="leading-relaxed">भवन <strong>[{buildingNo}]</strong> के अंतर्गत मकान संख्या क्या है? यदि संकुल में नए मकान की रचना हो रही है तो 'नया मकान' चुनें। यदि केवल संयुक्त परिवार (नया परिवार) जोड़ रहे हैं, तो 'मौजूदा मकान' चुनें।</p>
                </div>
              </div>

              {/* Decision Cards for House */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option Existing House */}
                <div 
                  onClick={() => existingHousesInBuilding.length > 0 && handleHouseDecisionChange("existing")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                    existingHousesInBuilding.length === 0 
                      ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" 
                      : houseDecision === "existing"
                        ? "border-blue-600 bg-blue-50/30 shadow-md"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Home className={`h-6 w-6 ${houseDecision === "existing" ? "text-blue-600" : "text-slate-400"}`} />
                    {houseDecision === "existing" && <div className="h-4 w-4 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">मौजूदा मकान चुनें (Select Existing House)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">इस भवन में रहने वाले पहले के रिकॉर्डेड मकान का चयन करें।</p>
                  </div>
                  {existingHousesInBuilding.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600 font-semibold">
                      <span>मौजूद: </span>
                      {existingHousesInBuilding.map(h => (
                        <span key={h} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px]">{h}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded inline-block mt-2">इस भवन में पूर्व मकान नहीं है</span>
                  )}
                </div>

                {/* Option Create New House */}
                <div 
                  onClick={() => handleHouseDecisionChange("new")}
                  className={`border-2 rounded-2xl p-5 cursor-pointer flex flex-col gap-3 transition-all ${
                    houseDecision === "new"
                      ? "border-blue-600 bg-blue-50/30 shadow-md"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <Sparkles className={`h-6 w-6 ${houseDecision === "new" ? "text-blue-600" : "text-amber-505"}`} />
                    {houseDecision === "new" && <div className="h-4 w-4 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">नया मकान जोड़ें (Create New House)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">वैश्विक क्रमिक जनगणना मकान (H) संख्या स्व-गणना करके जोड़ें।</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded w-max mt-2">
                    नया नंबर: {suggestedHouse} (Global continuous)
                  </span>
                </div>

              </div>

              {/* Interactive choices rendering */}
              {houseDecision === "existing" && (
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700">मौजूदा मकान का क्रमांक चुनें:</label>
                  <select
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold focus:outline-none"
                  >
                    <option value="">-- मकान चुनें --</option>
                    {existingHousesInBuilding.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}

              {houseDecision === "new" && (
                <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-amber-900">ऑटो-जेनरेटेड जनगणना मकान नंबर:</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value.toUpperCase())}
                      className="max-w-[150px] px-3 py-2 bg-white border border-amber-200 text-amber-950 font-mono text-base font-extrabold focus:outline-none rounded-xl"
                    />
                    <span className="text-[10px] font-semibold text-amber-700">वैश्विक नियम: मकान नंबर कभी भी भवन के लिए रीसेट नहीं होता।</span>
                  </div>
                  {isHouseDuplicate && (
                    <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="h-3.5 w-3.5 animate-bounce" />
                      <span>त्रुटि: {houseNo} नंबर पहले से ही किसी अन्य प्लॉट या भवन में उपयोग में है। दुघर्टनावश दोहराव से बचें!</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* STEP 4: SELECT USAGE */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn" id="wizard-step-4">
              <div className="border border-blue-50 bg-blue-50/30 rounded-2xl p-4 flex gap-3 text-xs text-blue-800">
                <Info className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <strong className="block font-bold">चरण ४: जनगणना मकान का उपयोग (House Property Usage)</strong>
                  <p className="leading-relaxed">इस मकान का वर्तमान में उपयोग किस श्रेणी में किया जा रहा है? यदि उपयोग 'आवास' या 'आवास-सह-अन्य उपयोग' है तो परिवार प्रविष्टि व विवरण प्रखण्ड सक्रिय होगा, अन्यथा स्वतः बाईपास होगा।</p>
                </div>
              </div>

              {/* Grid Choice of Usages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {HOUSE_USE_OPTIONS.map(opt => {
                  const isSelected = houseUse === opt;
                  const resType = opt === "आवास" || opt === "आवास-सह-अन्य उपयोग";
                  return (
                    <div
                      key={opt}
                      onClick={() => setHouseUse(opt)}
                      className={`cursor-pointer border border-slate-200 rounded-2xl p-4 text-center flex flex-col justify-center items-center gap-2.5 transition-all ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50 text-blue-800 shadow shadow-blue-500/10 font-bold"
                          : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {opt === "आवास" && <Home className="h-5 w-5" />}
                        {opt === "आवास-सह-अन्य उपयोग" && <Building2 className="h-5 w-5" />}
                        {opt === "दुकान" && <Building className="h-5 w-5" />}
                        {opt === "कार्यालय" && <Clipboard className="h-5 w-5" />}
                        {opt === "विद्यालय" && <Building2 className="h-5 w-5" />}
                        {opt === "अस्पताल" && <Home className="h-5 w-5" />}
                        {opt === "खाली" && <X className="h-5 w-5" />}
                        {opt === "अन्य" && <HelpCircle className="h-5 w-5" />}
                      </div>
                      <span className="text-[11px] leading-tight font-bold">{opt}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        resType ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {resType ? "आवासीय" : "गैर-आवासीय"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>चयनित मकान उपयोग: <strong className="text-slate-900">{houseUse}</strong></span>
                <span className="text-blue-600 font-bold">{isResidential ? "💡 परिवार फॉर्म सक्रिय होगा" : "⚠️ परिवार विवरण छोड़ा जाएगा"}</span>
              </div>
            </div>
          )}

          {/* STEP 5: HOUSEHOLD DETAILS / SAVE ACTION */}
          {step === 5 && (
            <div className="space-y-5 animate-fadeIn" id="wizard-step-5">
              
              {isResidential ? (
                /* Residential Household Complex form flow */
                <div className="space-y-5">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800">
                    <strong>२.१ परिवार क्रमांक तथा मुखिया विवरण (Family Registration)</strong>
                    <p className="mt-0.5 leading-relaxed">परिवार संख्या <strong>F क्रमांक</strong> वैश्विक रूप से सतत है जो रीसेट नहीं होता। मुखिया विवरण दर्ज करें।</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {/* Family No */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">परिवार क्रमांक <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={familyNo}
                          onChange={(e) => setFamilyNo(e.target.value.toUpperCase())}
                          placeholder="उदा. F001"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                        />
                        {isFamilyDuplicate && (
                          <div className="text-[9px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>यह परिवार संख्या प्रणाली में पहले से ही दर्ज है।</span>
                          </div>
                        )}
                      </div>

                      {/* Head Name */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">परिवार के मुखिया का नाम <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={headName}
                          onChange={(e) => setHeadName(e.target.value)}
                          placeholder="मुखिया का पूरा नाम दर्ज करें"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">मोबाइल नंबर (10 अंक)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                          placeholder="99XXXXXXXX"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">लिंग (Gender)</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold"
                        >
                          {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      {/* Caste */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">SC/ST/अन्य (Category)</label>
                        <select
                          value={caste}
                          onChange={(e) => setCaste(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold"
                        >
                          {CASTE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Ownership status */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">मकान के स्वामित्व की स्थिति</label>
                        <select
                          value={ownership}
                          onChange={(e) => setOwnership(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold"
                        >
                          {OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      {/* Rooms Count */}
                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="block text-xs font-bold text-slate-700">उपलब्ध कमरों की संख्या</label>
                        <input
                          type="number"
                          min={0}
                          value={roomsCount}
                          onChange={(e) => setRoomsCount(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                        />
                      </div>

                      {/* Members count */}
                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="block text-xs font-bold text-slate-700">रहने वालों की कुल संख्या</label>
                        <input
                          type="number"
                          min={1}
                          value={membersCount}
                          onChange={(e) => setMembersCount(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                        />
                      </div>

                      {/* Married couples */}
                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="block text-xs font-bold text-slate-700">विवाहित जोड़ों की संख्या</label>
                        <input
                          type="number"
                          min={0}
                          value={marriedCouples}
                          onChange={(e) => setMarriedCouples(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Section: Amenities & Property details */}
                  <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                    <strong className="text-xs text-blue-700 uppercase block tracking-wider border-b border-slate-200 pb-1.5">२.२ पेयजल, सुविधा एवं पारिवारिक संपत्तियाँ</strong>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-3.5 bg-white p-4 rounded-xl border border-slate-200/50">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">पेयजल का मुख्य स्रोत</label>
                          <select
                            value={waterSource}
                            onChange={(e) => setWaterSource(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {WATER_SOURCE_OPTIONS.map(ws => <option key={ws} value={ws}>{ws}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">पेयजल स्रोत की उपलब्धता</label>
                          <select
                            value={waterAvailability}
                            onChange={(e) => setWaterAvailability(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {WATER_AVAILABILITY_OPTIONS.map(wa => <option key={wa} value={wa}>{wa}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">LPG/PNG गैस कनेक्शन</label>
                          <select
                            value={lpg}
                            onChange={(e) => setLpg(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {YES_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3.5 bg-white p-4 rounded-xl border border-slate-200/50">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">कंप्यूटर/लैपटॉप</label>
                          <select
                            value={laptop}
                            onChange={(e) => setLaptop(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {YES_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">साइकिल/मोटर साइकिल/स्कूटर</label>
                          <select
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {VEHICLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">कार/जीप/वैन</label>
                          <select
                            value={car}
                            onChange={(e) => setCar(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-150 rounded-lg focus:outline-none font-semibold text-slate-800"
                          >
                            {YES_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                /* Non Residential Form: Only 5 essential fields visible and required */
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900 font-medium">
                    🏢 <strong>गैर-आवासीय संपत्ति ("{houseUse}") प्रविष्टि</strong>
                    <p className="mt-0.5 leading-relaxed">
                      चूंकि जनगणना उपयोग गैर-आवासीय श्रेणी का है, इसलिए परिवार एवं परिसंपत्ति विवरण प्रखण्डों को नियम ३ के तहत छुपाया गया है। कृपया निम्नलिखित ५ आवश्यक संपर्क जानकारी भरें।
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Contact person name */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">मुखिया / संपत्ति संचालक का नाम <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={headName}
                          onChange={(e) => setHeadName(e.target.value)}
                          placeholder="दर्ज करें"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-805"
                        />
                      </div>

                      {/* Mobile */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">मोबाइल नंबर (10 अंक) <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                          placeholder="99XXXXXXXX"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">लिंग (Gender) <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-805 font-bold cursor-pointer"
                        >
                          {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      {/* Caste Category */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">SC/ST/अन्य (Category) <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={caste}
                          onChange={(e) => setCaste(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-805 font-bold cursor-pointer"
                        >
                          {CASTE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Ownership status */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">मकान के स्वामित्व की स्थिति <span className="text-red-500">*</span></label>
                        <select
                          required
                          value={ownership}
                          onChange={(e) => setOwnership(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-805 font-bold cursor-pointer"
                        >
                          {OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Wizard Navigation Action Strip Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="cursor-pointer px-4 py-2 border border-slate-200 bg-white hover:border-slate-350 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 smooth-hover"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>पीछे जाएं (Back)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-semibold smooth-hover"
            >
              रद्द करें
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="cursor-pointer px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 smooth-hover"
              >
                <span>आगे बढ़ें (Next)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (isResidential && isFamilyDuplicate)}
                className="cursor-pointer px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/15 smooth-hover"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 w-3 border-2 border-white/60 border-t-white rounded-full animate-spin shrink-0"></div>
                    <span>लाइव शीट में सहेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>शीट में सुरक्षित करें (Save Entry)</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
