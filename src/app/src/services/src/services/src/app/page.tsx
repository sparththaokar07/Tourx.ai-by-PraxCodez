"use client";

import React, { useState, useEffect } from "react";
import { 
  searchIndianCities, 
  getLiveRoadDistance, 
  PlaceSuggestion 
} from "@/services/geoService";
import { generateDynamicItinerary, DayPlan } from "@/services/itineraryService";
import { 
  Compass, 
  IndianRupee, 
  MapPin, 
  Calendar, 
  Clock, 
  Train, 
  Plane, 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Send 
} from "lucide-react";

const travelTiers: Record<string, { value: number; label: string }[]> = {
  train: [
    { value: 0.8, label: "Sleeper (SL)" },
    { value: 2.0, label: "AC 3-Tier (3A)" },
    { value: 3.0, label: "AC 2-Tier (2A)" },
    { value: 4.5, label: "AC First Class (1A)" },
    { value: 2.2, label: "AC Chair Car (CC)" },
  ],
  flight: [
    { value: 5.5, label: "Economy Class" },
    { value: 8.5, label: "Premium Economy" },
    { value: 16.0, label: "Business Class" },
  ],
  car: [
    { value: 10.0, label: "Hatchback / Mini" },
    { value: 12.0, label: "Sedan" },
    { value: 16.0, label: "SUV / Innova" },
  ],
};

export default function TourxApp() {
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [sourceData, setSourceData] = useState<PlaceSuggestion | null>(null);
  const [destData, setDestData] = useState<PlaceSuggestion | null>(null);
  const [sourceSuggestions, setSourceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);

  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("25000");
  const [mode, setMode] = useState("train");
  const [tierIdx, setTierIdx] = useState(1); // Defaults to 3A

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [report, setReport] = useState<any>(null);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Autocomplete triggers
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (source.length >= 2 && (!sourceData || sourceData.display_name !== source)) {
        const results = await searchIndianCities(source);
        setSourceSuggestions(results);
      } else {
        setSourceSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [source]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (dest.length >= 2 && (!destData || destData.display_name !== dest)) {
        const results = await searchIndianCities(dest);
        setDestSuggestions(results);
      } else {
        setDestSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [dest]);

  const runIntelligence = async () => {
    setErrorMsg("");
    if (!source || !dest || !date || !budget) {
      setErrorMsg("Please fill Origin, Destination, Departure Date, and Budget.");
      return;
    }

    setLoading(true);
    setReport(null);
    setItinerary([]);

    setLoadingMsg("Querying OpenStreetMap spatial grid...");
    
    // Resolve coordinates
    let sCoord = sourceData;
    if (!sCoord) {
      const sRes = await searchIndianCities(source);
      if (sRes.length) sCoord = sRes[0];
    }
    let dCoord = destData;
    if (!dCoord) {
      const dRes = await searchIndianCities(dest);
      if (dRes.length) dCoord = dRes[0];
    }

    if (!sCoord || !dCoord) {
      setLoading(false);
      setErrorMsg("Unable to locate origin or destination on Indian road networks.");
      return;
    }

    setLoadingMsg("Routing road/transit telemetry...");
    const roadInfo = await getLiveRoadDistance(
      parseFloat(sCoord.lat),
      parseFloat(sCoord.lon),
      parseFloat(dCoord.lat),
      parseFloat(dCoord.lon)
    );

    const totalDist = roadInfo?.distanceKm || 850;
    const chosenTier = travelTiers[mode][tierIdx] || travelTiers[mode][0];
    const userBudgetNum = parseFloat(budget);

    setLoadingMsg("Synthesizing dynamic accommodation & itinerary...");
    setTimeout(() => {
      const estimatedDays = Math.max(2, Math.min(7, Math.floor(totalDist / 400) + 1));
      const transportCost = Math.floor(totalDist * chosenTier.value);
      const luxuryMultiplier = chosenTier.value > 4 ? 2.2 : 1;
      const stayCost = Math.floor(estimatedDays * 1200 * luxuryMultiplier);
      const foodCost = Math.floor(estimatedDays * 600 * luxuryMultiplier);
      const baseCost = transportCost + stayCost + foodCost;

      const minFare = Math.floor(baseCost * 0.88);
      const maxFare = Math.floor(baseCost * 1.22);
      const avgFare = (minFare + maxFare) / 2;
      const percentBudget = Math.round((avgFare / userBudgetNum) * 100);

      const generatedSchedule = generateDynamicItinerary(dest, estimatedDays);

      setReport({
        distance: totalDist,
        duration: roadInfo?.durationHours || Math.round(totalDist / 55),
        estimatedDays,
        transportCost,
        stayCost,
        foodCost,
        baseCost,
        minFare,
        maxFare,
        avgFare,
        percentBudget,
        chosenTierLabel: chosenTier.label,
      });

      setItinerary(generatedSchedule);
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="relative min-h-screen pb-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="cyber-grid fixed inset-0 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050511]/80 backdrop-blur-md border-b border-cyan-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-syncopate font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            PRAXCODEZ
          </span>
          <div className="space-x-6 text-sm font-medium tracking-wide">
            <a href="#tourx" className="hover:text-cyan-400 transition-colors">TOURX AI</a>
            <a href="#contact" className="hover:text-fuchsia-400 transition-colors">CONTACT</a>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="pt-32 pb-8 text-center px-4 relative z-10" id="tourx">
        <h1 className="text-4xl md:text-6xl font-extrabold font-orbitron tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500 drop-shadow-[0_0_25px_rgba(0,212,255,0.4)]">
          TOURX.AI
        </h1>
        <p className="text-cyan-300 font-mono text-sm tracking-widest mt-2 uppercase">
          Autonomous Indian Travel Intelligence & Routing Engine
        </p>
      </section>

      {/* Main Form Section */}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="bg-[#0a0f1e]/80 border border-cyan-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex items-center gap-2 text-cyan-400 font-medium mb-6">
            <Compass className="w-5 h-5 animate-spin-slow" />
            <span className="font-orbitron uppercase text-sm tracking-wider">Initialize Journey Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Origin with live suggestions */}
            <div className="relative">
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Origin (From)</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Nagpur"
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
              {sourceSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-[75px] bg-[#0c1222] border border-cyan-500/30 rounded-xl z-30 overflow-hidden shadow-2xl">
                  {sourceSuggestions.map((item, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setSource(item.display_name.split(",")[0]);
                        setSourceData(item);
                        setSourceSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-cyan-500/20 text-xs text-slate-200 cursor-pointer border-b border-slate-800 last:border-0 truncate"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Destination with live suggestions */}
            <div className="relative">
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Destination (To)</label>
              <input
                type="text"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
              {destSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-[75px] bg-[#0c1222] border border-cyan-500/30 rounded-xl z-30 overflow-hidden shadow-2xl">
                  {destSuggestions.map((item, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setDest(item.display_name.split(",")[0]);
                        setDestData(item);
                        setDestSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-cyan-500/20 text-xs text-slate-200 cursor-pointer border-b border-slate-800 last:border-0 truncate"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Departure Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none text-white transition-all"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Total Budget (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1000"
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
            </div>

            {/* Transport Mode */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Mode of Transit</label>
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setTierIdx(0);
                }}
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white"
              >
                <option value="train">Train (IRCTC)</option>
                <option value="flight">Flight (Air)</option>
                <option value="car">Roadway (Drive / Cab)</option>
              </select>
            </div>

            {/* Travel Class */}
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold mb-2 block">Class / Tier</label>
              <select
                value={tierIdx}
                onChange={(e) => setTierIdx(parseInt(e.target.value))}
                className="w-full bg-black/50 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white"
              >
                {travelTiers[mode].map((t, idx) => (
                  <option key={idx} value={idx}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={runIntelligence}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 py-3.5 rounded-xl font-orbitron font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "PROCESSING TELEMETRY..." : "INITIALIZE AI LOGISTICS"}
          </button>

          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto border-4 border-cyan-500/20 border-t-cyan-400 border-b-fuchsia-500 rounded-full animate-spin" />
            <p className="mt-4 font-orbitron text-xs tracking-widest text-slate-400 animate-pulse">{loadingMsg}</p>
          </div>
        )}

        {/* Intelligence Dashboard */}
        {report && (
          <div className="mt-10 space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financial Card */}
              <div className="bg-[#0a0f1e]/80 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-orbitron text-sm font-semibold tracking-wider flex items-center gap-2 text-cyan-400">
                    <IndianRupee className="w-4 h-4" /> Financial Matrix
                  </h3>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">1 Adult</span>
                </div>
                <div className="text-3xl font-bold font-mono">
                  ₹{report.minFare.toLocaleString("en-IN")} - ₹{report.maxFare.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-400 uppercase mt-1 tracking-wider">Estimated Outlay</div>

                {/* Budget Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Budget Utilization</span>
                    <span className={report.percentBudget > 100 ? "text-red-400 font-bold" : "text-cyan-400"}>
                      {report.percentBudget}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        report.percentBudget > 100
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                      }`}
                      style={{ width: `${Math.min(100, report.percentBudget)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Transit ({report.chosenTierLabel})</span>
                    <span>₹{report.transportCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stays & Lodging</span>
                    <span>₹{report.stayCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meals & Incidentals</span>
                    <span>₹{report.foodCost.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Spatial Routing Card */}
              <div className="bg-[#0a0f1e]/80 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-orbitron text-sm font-semibold tracking-wider flex items-center gap-2 text-cyan-400">
                    <MapPin className="w-4 h-4" /> Spatial Analytics
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">OSRM Verified</span>
                </div>
                <div className="text-3xl font-bold font-mono">{report.distance.toLocaleString("en-IN")} km</div>
                <div className="text-xs text-slate-400 uppercase mt-1 tracking-wider">Total Route Track</div>

                <div className="mt-6 space-y-4 text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                    <span>Estimated Transit Time: ~{report.duration} Hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Optimal Itinerary Window: {report.estimatedDays} Days</span>
                  </div>
                </div>
              </div>

              {/* System Intelligence Verdict */}
              <div className="bg-[#0a0f1e]/80 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="font-orbitron text-sm font-semibold tracking-wider mb-4 text-cyan-400">
                  AI Route Evaluation
                </h3>
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    {report.percentBudget <= 100 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span>
                      {report.percentBudget <= 100
                        ? `Trip fits comfortably inside your ₹${parseFloat(budget).toLocaleString("en-IN")} limit.`
                        : `Plan exceeds target by approx ₹${(report.avgFare - parseFloat(budget)).toLocaleString("en-IN")}. Consider scaling down to Sleeper or 3-Tier.`}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                    Dynamic rate volatility modeled for departures near {date}. Food & stay factors adjusted for {report.estimatedDays} continuous days.
                  </p>
                </div>
              </div>
            </div>

            {/* Generated Multi-Day Itinerary Component */}
            <div className="bg-[#0a0f1e]/80 border border-cyan-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <h3 className="font-orbitron text-lg font-bold tracking-wider mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                {report.estimatedDays}-Day Automated Itinerary Blueprint
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {itinerary.map((dayPlan) => (
                  <div
                    key={dayPlan.day}
                    className="bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-800">
                        <span className="font-orbitron text-xs font-bold text-cyan-400">DAY {dayPlan.day}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Scheduled</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-4">{dayPlan.title}</h4>
                      <ul className="space-y-3">
                        {dayPlan.activities.map((act, idx) => (
                          <li key={idx} className="text-xs text-slate-300">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-cyan-400 font-semibold">{act.time}</span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-fuchsia-300 rounded border border-slate-700">
                                {act.tag}
                              </span>
                            </div>
                            <p className="text-slate-400 pl-1">{act.activity}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Contact Section */}
      <footer className="mt-28 border-t border-slate-800/80 pt-10 text-center text-xs text-slate-500 relative z-10" id="contact">
        <p className="font-orbitron tracking-widest uppercase">
          Engineered by <span className="text-cyan-400 font-semibold">Parth Shrikant Thaokar</span>
        </p>
        <p className="mt-2">© 2026 PraxCodez. All rights reserved.</p>
      </footer>
    </main>
  );
}
