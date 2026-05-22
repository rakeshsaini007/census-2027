import React, { useState } from "react";
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
import { checkIsResidential } from "../utils/sorting";
import { 
  Home, 
  User, 
  Phone, 
  Layers, 
  Users, 
  Droplet, 
  Flame, 
  Laptop, 
  Bike, 
  Car, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Check, 
  IdCard,
  Building,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface PlotCardProps {
  key?: string | number;
  plotNo: string;
  records: CensusRecord[];
  onSaveRecord: (record: CensusRecord) => Promise<boolean>;
  onDeleteRecord: (lineNo: number | string) => Promise<boolean>;
  onAddRecordToPlot: (plotNo: string, buildingNo: string) => void;
}

export default function PlotCard({ 
  plotNo, 
  records, 
  onSaveRecord, 
  onDeleteRecord, 
  onAddRecordToPlot 
}: PlotCardProps) {
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editFormData, setEditFormData] = useState<CensusRecord | null>(null);
  const [expandedHouseIds, setExpandedHouseIds] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteLineNo, setConfirmDeleteLineNo] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  // Common building number from records (all records in same plot usually share the building number, but we handle variations fallback)
  const buildingNo = records[0]?.["भवन नंबर"] || "N/A";

  const toggleHouseExpand = (id: string) => {
    setExpandedHouseIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartEdit = (record: CensusRecord) => {
    setEditingId(record["लाइन क्रमांक"]);
    setEditFormData({ ...record });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleFieldChange = (field: keyof CensusRecord, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    
    setIsSaving(true);
    try {
      const isEditFormResidential = editFormData["जनगणना मकान का उपयोग"] === "आवास" || editFormData["जनगणना मकान का उपयोग"] === "आवास-सह-अन्य उपयोग";
      
      if (!isEditFormResidential && !String(editFormData["गैर आवासीय मकान का नाम"] || "").trim()) {
        alert("कृपया गैर आवासीय मकान का नाम दर्ज करें।");
        setIsSaving(false);
        return;
      }

      const cleanedData: CensusRecord = {
        ...editFormData,
        "भवन नंबर": String(editFormData["भवन नंबर"] || "").trim().toUpperCase(),
        "जनगणना मकान नंबर": String(editFormData["जनगणना मकान नंबर"] || "").trim().toUpperCase(),
        "गैर आवासीय मकान का नाम": !isEditFormResidential ? String(editFormData["गैर आवासीय मकान का नाम"] || "").trim() : "",
        "परिवार क्रमांक": isEditFormResidential ? (String(editFormData["परिवार क्रमांक"] || "").trim().toUpperCase() || "F001") : "",
        "परिवार के मुखिया का नाम": String(editFormData["परिवार के मुखिया का नाम"] || "").trim(),
        "मोबाइल नंबर": String(editFormData["मोबाइल नंबर"] || "").trim(),
        "लिंग": editFormData["लिंग"] || "",
        "SC/ST/अन्य": editFormData["SC/ST/अन्य"] || "",
        "मकान के स्वामित्व की स्थिति": editFormData["मकान के स्वामित्व की स्थिति"] || "",
        "परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या": isEditFormResidential ? editFormData["परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या"] : "",
        "परिवार में रहने वालों की कुल संख्या": isEditFormResidential ? editFormData["परिवार में रहने वालों की कुल संख्या"] : "",
        "विवाहित जोड़ों की संख्या": isEditFormResidential ? editFormData["विवाहित जोड़ों की संख्या"] : "",
        "पेयजल का मुख्य स्रोत": isEditFormResidential ? editFormData["पेयजल का मुख्य स्रोत"] : "",
        "पेयजल स्रोत की उपलब्धता": isEditFormResidential ? editFormData["पेयजल स्रोत की उपलब्धता"] : "",
        "LPG/PNG": isEditFormResidential ? editFormData["LPG/PNG"] : "",
        "LAPTOP/ COMPUTER": isEditFormResidential ? editFormData["LAPTOP/ COMPUTER"] : "",
        "साइकिल/ स्कूटर": isEditFormResidential ? editFormData["साइकिल/ स्कूटर"] : "",
        "कार/ जीप/ वैन": isEditFormResidential ? editFormData["कार/ जीप/ वैन"] : ""
      };

      const success = await onSaveRecord(cleanedData);
      if (success) {
        setEditingId(null);
        setEditFormData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lineNo: number | string) => {
    setIsDeleting(true);
    try {
      await onDeleteRecord(lineNo);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteLineNo(null);
    }
  };

  // A helper to check if a record is completely empty/blank
  const isBlankRecord = (r: CensusRecord): boolean => {
    return !String(r["जनगणना मकान नंबर"] || "").trim() &&
           !String(r["परिवार क्रमांक"] || "").trim() &&
           !String(r["परिवार के मुखिया का नाम"] || "").trim();
  };

  // Keep only one completely empty/blank record in the view to prevent clutter
  const getDisplayFamilies = (families: CensusRecord[]) => {
    const checked: CensusRecord[] = [];
    let hasEmpty = false;
    families.forEach(f => {
      if (isBlankRecord(f)) {
        if (!hasEmpty) {
          checked.push(f);
          hasEmpty = true;
        }
      } else {
        checked.push(f);
      }
    });
    return checked;
  };

  // Group families/records residing in the same Census House (मकान) under this plot
  const uniqueHouses: {
    houseNo: string;
    families: CensusRecord[];
  }[] = [];

  records.forEach(record => {
    const rawHouseNo = String(record["जनगणना मकान नंबर"] || "").trim().toUpperCase();
    // Group all empty/blank house numbers under a single "EMPTY" key
    const houseNo = rawHouseNo || "EMPTY";
    
    const existing = uniqueHouses.find(h => h.houseNo === houseNo);
    if (existing) {
      existing.families.push(record);
    } else {
      uniqueHouses.push({
        houseNo,
        families: [record]
      });
    }
  });

  // Count active unique houses (exclude "EMPTY" house if it contains only blank records)
  const activeHousesCount = uniqueHouses.filter(h => {
    if (h.houseNo !== "EMPTY") return true;
    return h.families.some(f => !isBlankRecord(f));
  }).length;

  // Group records by Building, then by House for the tree-structure representation
  const buildingsMap: Record<string, Record<string, CensusRecord[]>> = {};
  records.forEach(record => {
    const bNo = String(record["भवन नंबर"] || "N/A").trim().toUpperCase();
    const hNo = String(record["जनगणना मकान नंबर"] || "N/A").trim().toUpperCase();
    if (!buildingsMap[bNo]) {
      buildingsMap[bNo] = {};
    }
    if (!buildingsMap[bNo][hNo]) {
      buildingsMap[bNo][hNo] = [];
    }
    buildingsMap[bNo][hNo].push(record);
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mb-6" id={`plot-card-${plotNo}`}>
      {/* Card Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-xl p-2.5 shadow-sm">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">प्लॉट क्रमांक</span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{plotNo}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              भवन नंबर: <span className="text-blue-600">{buildingNo}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            मकान संख्या: {activeHousesCount}
          </span>
          <button
            onClick={() => onAddRecordToPlot(plotNo, buildingNo)}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-1.5 px-3 rounded-lg smooth-hover"
            id={`add-house-btn-${plotNo}`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>नया मकान जोड़ें</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="bg-slate-50/40 border-b border-slate-100 px-6 py-2.5 flex items-center justify-between">
        <div className="flex gap-2 bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list" 
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            विवरण सूची (Detailed List)
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "tree" 
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            ढांचा वृक्ष (Structure Tree)
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">नियम-८ पदानुक्रम वृक्ष दृश्य संकुल</span>
      </div>

      {viewMode === "list" ? (
        /* House List Container */
        <div className="p-6 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
        {uniqueHouses.map((house, houseIdx) => {
          const displayFamilies = getDisplayFamilies(house.families);
          return (
            <div key={house.houseNo} className={`${houseIdx > 0 ? "pt-6 mt-6 pb-2" : "pb-2"} first:pt-0 first:mt-0 border-t first:border-0 border-slate-100`} id={`house-card-group-${house.houseNo}`}>
              {/* Census House Title / Info Header */}
              <div className="bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl mb-3.5 flex flex-wrap items-center justify-between gap-1.5 shadow-sm font-sans">
                <span className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 font-sans">
                  <Home className="h-4 w-4 text-blue-600" />
                  जनगणना मकान संख्या: <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-extrabold">{house.houseNo.startsWith("EMPTY") ? "अनिर्धारित" : house.houseNo}</span>
                  {displayFamilies.length > 1 && (
                    <span className="bg-amber-100 text-amber-805 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                      संयुक्त मकान ({displayFamilies.length} परिवार)
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md font-sans">
                  उपयोग: {Array.from(new Set(house.families.map(f => f["जनगणना मकान का उपयोग"] || "अघोषित/रिक्त"))).join(" + ")}
                </span>
              </div>

              <div className="space-y-4">
                {displayFamilies.map((record, index) => {
          const isEditing = editingId === record["लाइन क्रमांक"];
          const isExpanded = expandedHouseIds[record["लाइन क्रमांक"]] !== false; // Default expanded
          const isEditFormResidential = isEditing && editFormData
            ? checkIsResidential(editFormData["जनगणना मकान का उपयोग"])
            : false;
          const isRes = checkIsResidential(record["जनगणना मकान का उपयोग"] || "");

          return (
            <div key={record["लाइन क्रमांक"]} className={`${index > 0 ? "pt-4 mt-4 border-t border-dashed border-slate-200" : ""} first:pt-0 first:mt-0`} id={`house-record-${record["लाइन क्रमांक"]}`}>
              {isEditing && editFormData ? (
                /* Edit Mode Form */
                <form onSubmit={handleSave} className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-105">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Edit2 className="h-4 w-4 text-slate-500" />
                      संशोधन करें - मकान नंबर: {record["जनगणना मकान नंबर"]}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      आईडी: #{record["लाइन क्रमांक"]}
                    </span>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Census House details */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        जनगणना मकान नंबर <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData["जनगणना मकान नंबर"]}
                        onChange={(e) => handleFieldChange("जनगणना मकान नंबर", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        जनगणना मकान का उपयोग (उपयोग चुनें) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editFormData["जनगणना मकान का उपयोग"]}
                        onChange={(e) => handleFieldChange("जनगणना मकान का उपयोग", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {HOUSE_USE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {!isEditFormResidential && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          गैर आवासीय मकान का नाम <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData["गैर आवासीय मकान का नाम"] || ""}
                          onChange={(e) => handleFieldChange("गैर आवासीय मकान का नाम", e.target.value)}
                          placeholder="उदा. शर्मा जनरल स्टोर / एसबीआई एटीएम / पंचायत भवन"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-550 text-slate-900 font-semibold"
                        />
                      </div>
                    )}

                     {isEditFormResidential ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            परिवार क्रमांक <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editFormData["परिवार क्रमांक"] || ""}
                            onChange={(e) => handleFieldChange("परिवार क्रमांक", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                          />
                        </div>

                        {/* Head of Family details */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            परिवार के मुखिया का नाम <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editFormData["परिवार के मुखिया का नाम"] || ""}
                            onChange={(e) => handleFieldChange("परिवार के मुखिया का नाम", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            मोबाइल नंबर (10 अंक)
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            pattern="[0-9]{10}"
                            value={editFormData["मोबाइल नंबर"] || ""}
                            onChange={(e) => handleFieldChange("मोबाइल नंबर", e.target.value.replace(/\D/g, ""))}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="99XXXXXXXX"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            लिंग
                          </label>
                          <select
                            value={editFormData["लिंग"] || GENDER_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("लिंग", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {GENDER_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            SC/ST/अन्य
                          </label>
                          <select
                            value={editFormData["SC/ST/अन्य"] || CASTE_OPTIONS[2]}
                            onChange={(e) => handleFieldChange("SC/ST/अन्य", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {CASTE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* House details */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            मकान के स्वामित्व की स्थिति
                          </label>
                          <select
                            value={editFormData["मकान के स्वामित्व की स्थिति"] || OWNERSHIP_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("मकान के स्वामित्व की स्थिति", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {OWNERSHIP_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={editFormData["परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या"] !== undefined ? editFormData["परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या"] : 1}
                            onChange={(e) => handleFieldChange("परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या", parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            परिवार में रहने वालों की कुल संख्या <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={editFormData["परिवार में रहने वालों की कुल संख्या"] !== undefined ? editFormData["परिवार में रहने वालों की कुल संख्या"] : 1}
                            onChange={(e) => handleFieldChange("परिवार में रहने वालों की कुल संख्या", parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            विवाहित जोड़ों की संख्या <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={editFormData["विवाहित जोड़ों की संख्या"] !== undefined ? editFormData["विवाहित जोड़ों की संख्या"] : 0}
                            onChange={(e) => handleFieldChange("विवाहित जोड़ों की संख्या", parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Water source details */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            पेयजल का मुख्य स्रोत
                          </label>
                          <select
                            value={editFormData["पेयजल का मुख्य स्रोत"] || WATER_SOURCE_OPTIONS[3]}
                            onChange={(e) => handleFieldChange("पेयजल का मुख्य स्रोत", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {WATER_SOURCE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            पेयजल स्रोत की उपलब्धता
                          </label>
                          <select
                            value={editFormData["पेयजल स्रोत की उपलब्धता"] || WATER_AVAILABILITY_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("पेयजल स्रोत की उपलब्धता", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {WATER_AVAILABILITY_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Amenities & assets */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            LPG/PNG गैस कनेक्शन
                          </label>
                          <select
                            value={editFormData["LPG/PNG"] || YES_NO_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("LPG/PNG", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {YES_NO_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            LAPTOP/ COMPUTER
                          </label>
                          <select
                            value={editFormData["LAPTOP/ COMPUTER"] || YES_NO_OPTIONS[1]}
                            onChange={(e) => handleFieldChange("LAPTOP/ COMPUTER", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {YES_NO_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            साइकिल/ स्कूटर
                          </label>
                          <select
                            value={editFormData["साइकिल/ स्कूटर"] || VEHICLE_OPTIONS[3]}
                            onChange={(e) => handleFieldChange("साइकिल/ स्कूटर", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {VEHICLE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            कार/ जीप/ वैन
                          </label>
                          <select
                            value={editFormData["कार/ जीप/ वैन"] || YES_NO_OPTIONS[1]}
                            onChange={(e) => handleFieldChange("कार/ जीप/ वैन", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {YES_NO_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-full bg-amber-50 text-amber-900 border border-amber-100 rounded-xl p-4 text-xs font-medium">
                          <p className="font-bold">⚠️ गैर-आवासीय उपयोग (Non-Residential Usage: {editFormData["जनगणना मकान का उपयोग"]})</p>
                          <p className="text-amber-800 font-sans mt-0.5">नियम-३ के अनुसार परिवार एवं परिसंपत्ति विवरण प्रखण्डों को छुपाया गया है। कृपया संचालक हेतु ५ आवश्यक संपर्क जानकारी भरें।</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            मुखिया / संपत्ति संचालक का नाम <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editFormData["परिवार के मुखिया का नाम"] || ""}
                            onChange={(e) => handleFieldChange("परिवार के मुखिया का नाम", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            संपर्क मोबाइल नंबर (10 अंक) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            pattern="[0-9]{10}"
                            required
                            value={editFormData["मोबाइल नंबर"] || ""}
                            onChange={(e) => handleFieldChange("मोबाइल नंबर", e.target.value.replace(/\D/g, ""))}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                            placeholder="99XXXXXXXX"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            लिंग <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={editFormData["लिंग"] || GENDER_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("लिंग", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                          >
                            {GENDER_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            SC/ST/अन्य <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={editFormData["SC/ST/अन्य"] || CASTE_OPTIONS[2]}
                            onChange={(e) => handleFieldChange("SC/ST/अन्य", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                          >
                            {CASTE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            मकान के स्वामित्व की स्थिति <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={editFormData["मकान के स्वामित्व की स्थिति"] || OWNERSHIP_OPTIONS[0]}
                            onChange={(e) => handleFieldChange("मकान के स्वामित्व की स्थिति", e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                          >
                            {OWNERSHIP_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="cursor-pointer px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 text-xs font-semibold smooth-hover"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm smooth-hover"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 w-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                          <span>सुरक्षित हो रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>सुरक्षित करें</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Detail View Mode */
                <div className="space-y-4">
                  {/* Household Quick Bar */}
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold font-mono">
                        मकान: {record["जनगणना मकान नंबर"] || "अनिर्धारित"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">
                          {record["परिवार के मुखिया का नाम"] || "अघोषित मुखिया"}
                          {!isRes && (
                            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              गैर-आवासीय संपर्क
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500 font-medium font-sans">
                          {isRes ? (
                            `परिवार संख्या: ${record["परिवार क्रमांक"] || "N/A"} • सदस्य: ${record["परिवार में रहने वालों की कुल संख्या"] || 0}`
                          ) : (
                            record["गैर आवासीय मकान का नाम"] 
                              ? `🏡 प्रतिष्ठान/मकान का नाम: ${record["गैर आवासीय मकान का नाम"]}` 
                              : `परिवार संख्या: N/A • सदस्य: N/A`
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {confirmDeleteLineNo === record["लाइन क्रमांक"] ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg animate-fadeIn text-[10px] md:text-xs font-semibold">
                          <span className="text-red-700">हटाएं?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(record["लाइन क्रमांक"])}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-md cursor-pointer smooth-hover flex items-center justify-center"
                            title="हाँ, हटाएं"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLineNo(null)}
                            disabled={isDeleting}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1 rounded-md cursor-pointer smooth-hover flex items-center justify-center"
                            title="रद्द करें"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(record)}
                            className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg smooth-hover cursor-pointer"
                            title="संशोधन करें"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteLineNo(record["लाइन क्रमांक"])}
                            className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg smooth-hover cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleHouseExpand(record["लाइन क्रमांक"].toString())}
                        className="p-2 text-slate-400 hover:text-slate-600 smooth-hover cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Household Card Grid Layout */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn transition-all">
                      {/* Family details block */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-700">
                            {isRes ? "परिवार तथा मुखिया विवरण" : "सम्पर्क एवं मुखिया विवरण"}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>मुखिया नाम:</span>
                            <span className="font-semibold text-slate-800">{record["परिवार के मुखिया का नाम"] || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>लिंग:</span>
                            <span className="font-semibold text-slate-800">{record["लिंग"] || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SC/ST/अन्य:</span>
                            <span className="font-semibold text-slate-800">{record["SC/ST/अन्य"] || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>कुल सदस्य:</span>
                            <span className="font-semibold text-slate-800 text-wrap">
                              {isRes ? (record["परिवार में रहने वालों की कुल संख्या"] !== undefined ? record["परिवार में रहने वालों की कुल संख्या"] : "N/A") : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between font-sans">
                            <span>विवाहित जोड़े:</span>
                            <span className="font-semibold text-slate-800 font-sans">
                              {isRes ? (record["विवाहित जोड़ों की संख्या"] !== undefined ? record["विवाहित जोड़ों की संख्या"] : "N/A") : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>मोबाइल संख्या:</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 text-slate-400" />
                              {record["मोबाइल नंबर"] || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Property Status block */}
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <Layers className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-700">मकान एवं उपयोग की स्थिति</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400 text-[10px]">मकान का उपयोग:</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate block" title={record["जनगणना मकान का उपयोग"]}>
                              {record["जनगणना मकान का उपयोग"] || "N/A"}
                            </span>
                          </div>
                          {!isRes && record["गैर आवासीय मकान का नाम"] && (
                            <div className="flex flex-col gap-0.5 animate-fadeIn">
                              <span className="text-amber-700 text-[10px] font-bold">गैर आवासीय मकान का नाम:</span>
                              <span className="font-bold text-amber-950 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[11px] truncate block" title={record["गैर आवासीय मकान का नाम"]}>
                                {record["गैर आवासीय मकान का नाम"]}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400 text-[10px]">स्वामित्व की स्थिति:</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate text-wrap block leading-relaxed">
                              {record["मकान के स्वामित्व की स्थिति"] || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100/50">
                            <span>उपलब्ध कमरे:</span>
                            <span className="font-semibold text-slate-800">
                              {isRes ? (record["परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या"] !== undefined ? record["परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या"] : "N/A") : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amenities (Water, Gas) */}
                      {isRes ? (
                        <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                            <Droplet className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-700">पेयजल एवं गैस सुविधा</span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-400 text-[10px]">पेयजल का स्रोत:</span>
                              <span className="font-semibold text-slate-800 truncate" title={record["पेयजल का मुख्य स्रोत"]}>
                                {record["पेयजल का मुख्य स्रोत"] || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>उपलब्धता:</span>
                              <span className="font-semibold text-slate-800">{record["पेयजल स्रोत की उपलब्धता"] || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>LPG/PNG गैस:</span>
                              <span className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${record["LPG/PNG"] === "हाँ" ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"}`}>
                                {record["LPG/PNG"] || "नहीं"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50/25 p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center text-[10px] text-slate-400 font-medium">
                          ❌ पेयजल/गैस आँकड़े गैर-आवासीय संपत्ति के लिए लागू नहीं हैं।
                        </div>
                      )}

                      {/* Assets / Electronic & Vehicles */}
                      {isRes ? (
                        <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                            <Bike className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-700">पारिवारिक संपत्ति / वाहिनी</span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1 bg-slate-100/30 px-1 rounded">
                                <Laptop className="h-3 w-3 text-slate-500" />
                                लैपटॉप/कंप्यूटर:
                              </span>
                              <span className={`font-bold ${record["LAPTOP/ COMPUTER"] === "हाँ" ? "text-slate-900" : "text-slate-400"}`}>
                                {record["LAPTOP/ COMPUTER"] || "नहीं"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1 bg-slate-100/30 px-1 rounded">
                                <Bike className="h-3 w-3 text-slate-500" />
                                साइकिल/स्कूटर:
                              </span>
                              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[130px]" title={record["साइकिल/ स्कूटर"]}>
                                {record["साइकिल/ स्कूटर"] || "नहीं"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1 bg-slate-100/30 px-1 rounded">
                                <Car className="h-3 w-3 text-slate-500" />
                                कार/जीप/वैन:
                              </span>
                              <span className={`font-bold ${record["कार/ जीप/ वैन"] === "हाँ" ? "text-green-600 bg-green-50 px-1 rounded" : "text-slate-400"}`}>
                                {record["कार/ जीप/ वैन"] || "नहीं"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50/25 p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center text-[10px] text-slate-400 font-medium">
                          ❌ परिवार एसेट/वाहन आँकड़े गैर-आवासीय संपत्ति के लिए लागू नहीं हैं।
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        /* Render Tree View */
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/50 rounded-b-2xl" id={`tree-view-${plotNo}`}>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 font-mono text-xs leading-relaxed text-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-blue-800 font-extrabold border-b border-slate-100 pb-3 font-sans">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>प्लॉट: {plotNo} (कुल पदानुक्रम ढांचा)</span>
            </div>
            
            <div className="space-y-4 pl-1">
              {Object.keys(buildingsMap)
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                .map((bNo, bIdx, bArr) => {
                  const isLastBuilding = bIdx === bArr.length - 1;
                  const houses = buildingsMap[bNo];
                  const houseKeys = Object.keys(houses).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

                  return (
                    <div key={bNo} className="relative">
                      {/* Vertical line connecting buildings */}
                      {!isLastBuilding && (
                        <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-slate-200" />
                      )}

                      {/* Building Row */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">{isLastBuilding ? "└──" : "├──"}</span>
                        <span className="bg-amber-500/10 text-amber-850 border border-amber-200/65 px-2.5 py-0.5 rounded text-[10px] font-extrabold font-sans flex items-center gap-1">
                          🏢 भवन: {bNo}
                        </span>
                      </div>

                      {/* Houses under Building */}
                      <div className="pl-6 mt-1.5 space-y-3 relative">
                        {houseKeys.map((hNo, hIdx) => {
                          const isLastHouse = hIdx === houseKeys.length - 1;
                          const houseRecords = houses[hNo];
                          const displayRecords = getDisplayFamilies(houseRecords);
                          const firstRec = displayRecords[0] || houseRecords[0];
                          const isRes = checkIsResidential(firstRec["जनगणना मकान का उपयोग"] || "");
                          const isBlank = isBlankRecord(firstRec);

                          return (
                            <div key={hNo} className="relative">
                              {/* Vertical line for house if not last house */}
                              {!isLastHouse && (
                                <div className="absolute left-[9px] top-5 bottom-0 w-0.5 border-l border-slate-200" />
                              )}

                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 font-semibold">{isLastHouse ? "└──" : "├──"}</span>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-700 font-sans">
                                    <span className="bg-blue-500/10 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-extrabold font-mono text-[10px]">
                                      🏠 मकान: {hNo === "N/A" || hNo === "" || hNo === "EMPTY" ? "अनिर्धारित" : hNo}
                                    </span>
                                    <span className="text-slate-400 font-black">➔</span>
                                    
                                    <div className="flex flex-wrap gap-2.5 items-center">
                                      {displayRecords.map(r => {
                                        const rIsRes = checkIsResidential(r["जनगणना मकान का उपयोग"] || "");
                                        const rIsBlank = isBlankRecord(r);

                                        if (rIsBlank) {
                                          return (
                                            <span key={r["लाइन क्रमांक"]} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold font-sans">
                                              📝 अपूर्ण ड्राफ्ट रिकॉर्ड
                                            </span>
                                          );
                                        }

                                        if (rIsRes) {
                                          return (
                                            <div key={r["लाइन क्रमांक"]} className="bg-emerald-50 text-emerald-850 border border-emerald-250/50 px-2 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                              <span className="text-emerald-700">परिवार {r["परिवार क्रमांक"] || "F001"}:</span>
                                              <span className="text-slate-800 font-sans font-semibold text-[9.5px]">{r["परिवार के मुखिया का नाम"] || "अज्ञात मुखिया"}</span>
                                              {r["मोबाइल नंबर"] && (
                                                <span className="text-slate-500 text-[8.5px] pl-0.5 font-normal font-mono">({r["मोबाइल नंबर"]})</span>
                                              )}
                                            </div>
                                          );
                                        }

                                        // Non-Residential (e.g. shop/दुकान)
                                        return (
                                          <div key={r["लाइन क्रमांक"]} className="bg-rose-50/90 text-rose-850 border border-rose-250/50 px-2.5 py-0.5 rounded font-sans text-[10px] font-bold flex flex-wrap items-center gap-1.5 shadow-sm">
                                            <span className="text-[11px]">💼</span>
                                            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-sans text-[9px] font-extrabold uppercase">
                                              {r["जनगणना मकान का उपयोग"] || "गैर-आवासीय"}
                                            </span>
                                            {r["गैर आवासीय मकान का नाम"] && (
                                              <span className="bg-amber-100/90 text-amber-950 px-1.5 py-0.5 rounded font-sans text-[9px] font-black border border-amber-300">
                                                {r["गैर आवासीय मकान का नाम"]}
                                              </span>
                                            )}
                                            {r["परिवार के मुखिया का नाम"] && (
                                              <div className="flex items-center gap-1 text-[9px] font-sans font-bold">
                                                <span className="text-slate-400">संचालक:</span>
                                                <span className="text-slate-850 font-sans font-extrabold text-[9.5px]">{r["परिवार के मुखिया का नाम"]}</span>
                                                {r["मोबाइल नंबर"] && (
                                                  <span className="text-slate-500 font-mono font-medium pl-0.5">({r["मोबाइल नंबर"]})</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
