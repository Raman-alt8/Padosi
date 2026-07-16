import React from "react";

function pillCls({ active, dark }) {
  return `px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
    active
      ? dark ? "bg-white border-white text-black" : "bg-[#ff2d55] border-[#ff2d55] text-white"
      : dark
        ? "border-white/30 bg-black text-white/60 hover:border-white hover:text-white"
        : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
  }`;
}

export default function RideShareToolbar({
  dark,
  search,
  setSearch,
  filterMode,
  setFilterMode,
  activeMenu,
  setActiveMenu,
  sortBy,
  setSortBy,
  filterVehicle,
  setFilterVehicle,
  filterFreq,
  setFilterFreq,
  filterGender,
  setFilterGender,
  activeFilterCount,
  clearFilters,
  filteredCount,
  sortOptions,
  browseModes,
  pillClassName,
}) {
  return (
    <div className={`sticky top-0 z-20 transition-all duration-300 ease-in-out transform ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${
      pillClassName || ""
    }`}>
      <div className="px-6 pt-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-black border-white text-white placeholder-white/40 focus:ring-1 focus:ring-white"
                : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55] shadow-sm"
            }`}
          />
        </div>
      </div>

      <div className="px-6 pt-3 max-w-[600px] mx-auto w-full">
        <div className={`flex gap-2 p-1 rounded-2xl border ${dark ? "border-white bg-black" : "border-[#eee] bg-white"}`}>
          {browseModes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterMode(key)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                filterMode === key
                  ? dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
                  : dark ? "text-white/60 hover:text-white" : "text-[#777] hover:text-[#ff2d55]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-3 pt-3 max-w-[1200px] mx-auto w-full relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`text-xs font-semibold ${dark ? "text-white/40" : "text-[#aaa]"}`}>
            {filteredCount} route{filteredCount !== 1 ? "s" : ""} found
          </span>

          <div className="flex gap-2 relative">
            <button
              onClick={() => setActiveMenu((m) => (m === "filter" ? null : "filter"))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                activeMenu === "filter"
                  ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark
                    ? "border-white text-white bg-black hover:bg-white/10"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              ▤ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <button
              onClick={() => setActiveMenu((m) => (m === "sort" ? null : "sort"))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                activeMenu === "sort"
                  ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark
                    ? "border-white text-white bg-black hover:bg-white/10"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              ⇅ Sort
            </button>

            {activeMenu && (
              <button
                aria-label="Close menu"
                onClick={() => setActiveMenu(null)}
                className="fixed inset-0 z-[15] cursor-default"
              />
            )}

            {activeMenu === "filter" && (
              <div className={`absolute right-0 top-full mt-2 w-[280px] z-20 rounded-2xl border p-4 ${
                dark ? "bg-black border-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]" : "bg-white border-[#eee] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className={`text-xs font-bold cursor-pointer ${dark ? "text-white/60 hover:text-white" : "text-[#ff2d55] hover:text-[#e0002b]"}`}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {filterMode === "partner" && (
                  <>
                    <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Vehicle</p>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {[
                        { key: "all", label: "All" },
                        { key: "car", label: "🚗 Car" },
                        { key: "bike", label: "🏍️ Bike" },
                      ].map(({ key, label }) => (
                        <button key={key} onClick={() => setFilterVehicle(key)} className={pillCls({ active: filterVehicle === key, dark })}>{label}</button>
                      ))}
                    </div>
                  </>
                )}

                <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Frequency</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {[
                    { key: "all", label: "All" },
                    { key: "weekday", label: "Weekday" },
                    { key: "weekend", label: "Weekend" },
                    { key: "full_week", label: "Full Week" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterFreq(key)} className={pillCls({ active: filterFreq === key, dark })}>{label}</button>
                  ))}
                </div>

                <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Gender preference</p>
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {[
                    { key: "all", label: "All" },
                    { key: "male", label: "Male" },
                    { key: "female", label: "Female" },
                    { key: "no_preference", label: "Any" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterGender(key)} className={pillCls({ active: filterGender === key, dark })}>{label}</button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveMenu(null)}
                  className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                    dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  }`}
                >
                  Done
                </button>
              </div>
            )}

            {activeMenu === "sort" && (
              <div className={`absolute right-0 top-full mt-2 w-[220px] z-20 rounded-2xl border p-2 ${
                dark ? "bg-black border-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]" : "bg-white border-[#eee] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
              }`}>
                {sortOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setActiveMenu(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      sortBy === key
                        ? dark ? "bg-white text-black" : "bg-[#fff0f3] text-[#ff2d55]"
                        : dark ? "text-white/70 hover:bg-white/10" : "text-[#555] hover:bg-[#f6f7fb]"
                    }`}
                  >
                    {sortBy === key ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
