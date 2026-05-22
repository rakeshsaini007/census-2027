import React, { useState, useEffect } from "react";
import { CensusRecord } from "./types";
import { sortCensusRecords, naturalCompare } from "./utils/sorting";
import PlotCard from "./components/PlotCard";
import CreateRecordForm from "./components/CreateRecordForm";
import { 
  Building, 
  Search, 
  Plus, 
  Link2, 
  Database, 
  Globe, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Users, 
  Flame, 
  Laptop, 
  MapPin, 
  TrendingUp, 
  X,
  FileText
} from "lucide-react";

// अपना Google Apps Script Web App URL यहाँ दर्ज करें (Paste your Google Apps Script Web App URL here)
// Example: "https://script.google.com/macros/s/AKfycbwqZbe62-mQ-Mh5L6W8_mR8k3YqO2qLpB1lM4Z7G-W9/exec"
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFAx6i89GC3nftP3Ukc4YQGN6Ks1wyL-SPe3OyyOi5Vnhuj-YBj0KP6eqDpTuGb31pmQ/exec"; 

export default function App() {
  const [records, setRecords] = useState<CensusRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledPlotNo, setPrefilledPlotNo] = useState("");
  const [prefilledBuildingNo, setPrefilledBuildingNo] = useState("");

  // Clean fetch from Web App URL
  const fetchRecords = async () => {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_WEB_APP_URL_HERE")) {
      setError("कृपया /src/App.tsx के शीर्ष पर 'APPS_SCRIPT_URL' में अपना वैध Google Apps Script Web App URL दर्ज करें।");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
      });
      const result = await response.json();
      if (result.status === "success" && Array.isArray(result.data)) {
        const sorted = sortCensusRecords(result.data);
        const reindexed = sorted.map((rec, idx) => ({
          ...rec,
          "लाइन क्रमांक": idx + 1
        }));
        setRecords(reindexed);
      } else {
        setError(`डेटा लोड विफलता: ${result.message || "अज्ञात कारण"}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(`कनेक्शन विफल: लाइव गूगल शीट से संपर्क नहीं हो पाया। कृपया सुनिश्चित करें कि Apps Script सही ढंग से डिप्लॉय है और CORS सक्षम है।`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live records on load
  useEffect(() => {
    fetchRecords();
  }, []);

  // Save census record to live Google Sheet
  const handleSaveRecord = async (recordToSave: CensusRecord): Promise<boolean> => {
    if (!APPS_SCRIPT_URL) {
      setError("Google Apps Script Web App URL परिभाषित नहीं है।");
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        body: JSON.stringify({
          action: "save",
          records: [recordToSave]
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        await fetchRecords(); // Reload latest synchronized entries
        return true;
      } else {
        setError(`सेव करने में विफल: ${result.message || "अज्ञात त्रुटि"}`);
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setError(`कनेक्शन विफलता: लाइव स्प्रेडशीट में डेटा सहेजने में असमर्थ। (${err.toString()})`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete census record from live Google Sheet
  const handleDeleteRecord = async (lineNo: number | string): Promise<boolean> => {
    if (!APPS_SCRIPT_URL) {
      setError("Google Apps Script Web App URL परिभाषित नहीं है।");
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        body: JSON.stringify({
          action: "delete",
          "लाइन क्रमांक": lineNo
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        await fetchRecords(); // Reload latest data
        return true;
      } else {
        setError(`हटाने में विफल: ${result.message || "अज्ञात त्रुटि"}`);
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setError(`कनेक्शन विफलता: लाइव गूगल शीट से इस रिकॉर्ड को हटाया नहीं जा सका। (${err.toString()})`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddRecordToPlot = (plotNo: string, buildingNo: string) => {
    setPrefilledPlotNo(plotNo);
    setPrefilledBuildingNo(buildingNo);
    setShowCreateModal(true);
  };

  const handleOpenGlobalCreate = () => {
    setPrefilledPlotNo("");
    setPrefilledBuildingNo("");
    setShowCreateModal(true);
  };



  // Group records by Plot Number
  const plotsMap: Record<string, CensusRecord[]> = {};
  records.forEach(record => {
    const plotNo = String(record["प्लॉट क्रमांक"] || "").trim();
    if (plotNo) {
      if (!plotsMap[plotNo]) {
        plotsMap[plotNo] = [];
      }
      plotsMap[plotNo].push(record);
    }
  });

  // Search filter (by Plot Number or Bhawan Number, and only active when searchQuery is not empty)
  const filteredPlotsKeys = searchQuery.trim() === ""
    ? []
    : Object.keys(plotsMap)
        .filter(plotKey => {
          const query = searchQuery.trim().toLowerCase();
          const plotNoMatch = plotKey.toLowerCase().includes(query);
          const bhawanNoMatch = plotsMap[plotKey].some(record => 
            String(record["भवन नंबर"] || "").toLowerCase().includes(query)
          );
          return plotNoMatch || bhawanNoMatch;
        })
        .sort((keyA, keyB) => naturalCompare(keyA, keyB));

  // Calculate statistics for the Bento cards (only from searched matching records)
  const filteredRecords = searchQuery.trim() === ""
    ? []
    : records.filter(r => {
        const query = searchQuery.trim().toLowerCase();
        const plotNo = String(r["प्लॉट क्रमांक"] || "").trim().toLowerCase();
        const bhawanNo = String(r["भवन नंबर"] || "").trim().toLowerCase();
        return plotNo.includes(query) || bhawanNo.includes(query);
      });

  // Filter out empty rows/records that don't have any house, family, or head info
  const validFilteredRecords = filteredRecords.filter(r => 
    String(r["जनगणना मकान नंबर"] || "").trim() !== "" || 
    String(r["परिवार क्रमांक"] || "").trim() !== "" || 
    String(r["परिवार के मुखिया का नाम"] || "").trim() !== ""
  );

  const totalPlotsCount = new Set(validFilteredRecords.map(r => String(r["प्लॉट क्रमांक"] || "").trim())).size;
  const totalHouseholdsCount = validFilteredRecords.length;
  const totalMembersCount = validFilteredRecords.reduce((sum, r) => {
    const val = parseInt(String(r["परिवार में रहने वालों की कुल संख्या"] || "0"), 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const lpgCount = validFilteredRecords.filter(r => r["LPG/PNG"] === "हाँ").length;
  const lpgPercent = validFilteredRecords.length > 0
    ? Math.round((lpgCount / validFilteredRecords.length) * 100)
    : 0;

  const laptopCount = validFilteredRecords.filter(r => r["LAPTOP/ COMPUTER"] === "हाँ").length;
  const laptopPercent = validFilteredRecords.length > 0
    ? Math.round((laptopCount / validFilteredRecords.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 relative overflow-x-hidden" id="app-root">
      
      {/* Layer 1: Animated Background System */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" id="bg-layer">
        {/* Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-550 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>
        {/* Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${(i * 7 + 13) % 100}%`,
              left: `${(i * 11 + 7) % 100}%`,
              animation: `float ${8 + (i % 5) * 4}s linear infinite`,
              animationDelay: `${(i % 3) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Premium Header */}
      <header className="bg-white/5 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-2xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-2.5 shadow-2xl shadow-indigo-500/50 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-400/20">डिजिटल जनगणना प्रणाली</span>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mt-1">
                प्लॉट एवं जनगणना रिकॉर्ड <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">मैनेजर</span>
              </h1>
            </div>
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">

        {/* HIGH-LEVEL BENTO ANALYTICS BOARD */}
        {searchQuery.trim() !== "" && filteredPlotsKeys.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" id="analytics-board">
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="bg-blue-500/10 text-blue-300 rounded-xl p-3 border border-blue-400/15">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">कुल प्लॉट संख्या</p>
                <h4 className="text-2xl font-black text-white font-mono mt-0.5">{totalPlotsCount}</h4>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
              <div className="bg-indigo-500/10 text-indigo-300 rounded-xl p-3 border border-indigo-400/15">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">कुल मकान (परिवार)</p>
                <h4 className="text-2xl font-black text-white font-mono mt-0.5">{totalHouseholdsCount}</h4>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="bg-emerald-500/10 text-emerald-300 rounded-xl p-3 border border-emerald-400/15">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">कुल सदस्यों की संख्या</p>
                <h4 className="text-2xl font-black text-white font-mono mt-0.5">{totalMembersCount}</h4>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-500/10 text-amber-300 rounded-md border border-amber-400/15">
                    <Flame className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block leading-none">LPG कनेक्शन</span>
                    <span className="font-extrabold text-sm text-white font-mono leading-tight">{lpgPercent}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-sky-500/10 text-sky-300 rounded-md border border-sky-400/15">
                    <Laptop className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block leading-none">लैपटॉप/PC</span>
                    <span className="font-extrabold text-sm text-white font-mono leading-tight">{laptopPercent}%</span>
                  </div>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* Live Sheet Connection Error / Setup Banner */}
        {error && (
          <div className="bg-rose-500/15 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fadeIn" id="google-sheet-error">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h5 className="font-bold text-rose-300">लाइव डेटाबेस कनेक्शन विफलता (Google Sheet Connection Issue)</h5>
              <p className="mt-1 leading-relaxed text-slate-350">{error}</p>
              <button
                onClick={fetchRecords}
                className="mt-2.5 bg-white/10 hover:bg-white/15 text-white font-bold border border-white/15 py-1.5 px-3 rounded-lg shadow-sm smooth-hover flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />
                <span>पुनः कनेक्ट करें (Retry Sync)</span>
              </button>
            </div>
          </div>
        )}

        {/* SEARCH AND CONTROL ACTION STRIP */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          
          {/* Enhanced search functionality */}
          <div className="flex-1 w-full max-w-lg relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोजने के लिए प्लॉट क्रमांक या भवन नंबर दर्ज करें... (उदा. 101)"
              className="w-full bg-white/5 pl-11 pr-4 py-2.5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-550 placeholder-slate-500 shadow-inner"
              id="search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-white/10 text-slate-400 rounded-full h-5 w-5 flex items-center justify-center hover:bg-white/20"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={handleOpenGlobalCreate}
            className="cursor-pointer w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:scale-[1.02] transform transition-all duration-300 active:scale-95 border border-white/10 shrink-0"
            id="add-entry-btn"
          >
            <Plus className="h-4 w-4 text-indigo-250" />
            <span>नया जनगणना प्रविष्टि जोड़ें</span>
          </button>

        </div>

        {/* PLOT CARDS DISPLAYER SECTION */}
        <div className="space-y-6">
          {loading ? (
            /* Loading State Animation */
            <div className="py-20 flex flex-col items-center justify-center space-y-4" id="loading-state">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-semibold">सरल जनगणना डेटा लोड किया जा रहा है...</p>
            </div>
          ) : searchQuery.trim() === "" ? (
            /* Empty Search Query Welcome State */
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl py-16 px-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm" id="empty-search-state">
              <div className="bg-indigo-550/10 text-indigo-300 rounded-3xl p-5 mb-2 border border-indigo-400/20">
                <Search className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">प्लॉट क्रमांक या भवन नंबर दर्ज करें</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  जनगणना और प्लॉट कार्ड जानकारी देखने के लिए कृपया ऊपर बने सर्च बॉक्स में **प्लॉट क्रमांक** या **भवन नंबर** (जैसे 101, 102, 12 या 150) दर्ज करें।
                </p>
              </div>
            </div>
          ) : filteredPlotsKeys.length === 0 ? (
            /* Empty / No Results State */
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl py-12 px-6 flex flex-col items-center justify-center text-center space-y-4" id="empty-state">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-400 shadow-inner">
                <FileText className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">समान प्लॉट क्रमांक या भवन नंबर नहीं मिला!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  आपके दर्ज किए गए शब्द "{searchQuery}" के लिए कोई जनगणना रिकॉर्ड उपलब्ध नहीं है।
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-1.5 px-3 rounded-lg smooth-hover"
                >
                  खोज साफ करें
                </button>
              )}
            </div>
          ) : (
            /* Normal Plot Cards Display */
            <div className="grid grid-cols-1 gap-6">
              {filteredPlotsKeys.map(plotKey => (
                <PlotCard
                  key={plotKey}
                  plotNo={plotKey}
                  records={plotsMap[plotKey]}
                  onSaveRecord={handleSaveRecord}
                  onDeleteRecord={handleDeleteRecord}
                  onAddRecordToPlot={handleOpenAddRecordToPlot}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* CREATE MODAL POPUP DIALOG */}
      {showCreateModal && (
        <CreateRecordForm
          allRecords={records}
          initialPlotNo={prefilledPlotNo}
          initialBuildingNo={prefilledBuildingNo}
          onSave={handleSaveRecord}
          onClose={() => {
            setShowCreateModal(false);
            setPrefilledPlotNo("");
            setPrefilledBuildingNo("");
          }}
        />
      )}

      {/* Styled Footer */}
      <footer className="border-t border-white/10 bg-black/10 py-6 mt-12 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 भारत सरकार जनगणना रिपोर्टिंग पोर्टल • प्लॉट डेटा व्यवस्थापक</p>
          <div className="flex gap-4 font-semibold text-[11px] text-slate-500">
            <span>सॉफ्टवेयर संस्करण: 1.4.0 (हिंदी समर्थित)</span>
            <span>•</span>
            <span>तैयारकर्ता: स्थानीय सुरक्षित डेटाबेस + React Node</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
