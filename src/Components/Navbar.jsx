bash

cat > /mnt/user-data/outputs/Navbar.jsx << 'ENDOFFILE'
import { useState, useEffect, useRef } from "react";

export default function Navbar({ currentUser, onLogin, onSignup, onSignout, onManageAccount, onMyTasks, onActivity, showToast, darkMode, onToggleDark }) {
  const [dropOpen, setDropOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name = (currentUser?.full_name || "User").trim();
  const first = name.split(" ")[0];
  const initial = name.charAt(0).toUpperCase();

  const dm = (darkCls, lightCls) => darkMode ? darkCls : lightCls;

  return (
    <nav className={`h-[70px] flex justify-center sticky top-0 z-[1000] border-b ${dm("bg-black border-white/10", "bg-white border-gray-100")}`}>
      <div className="w-full max-w-[1300px] px-5 flex justify-between items-center relative">

        {/* Logo */}
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-black tracking-tight bg-transparent border-none cursor-pointer flex items-center gap-2 ${dm("text-white", "text-gray-900")}`}
        >
          {/* Simple P icon */}
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${dm("bg-white text-black", "bg-gray-900 text-white")}`}>p</span>
          padosi
        </button>

        {/* Nav links */}
        <div className="flex gap-5 text-sm items-center">
          <button onClick={() => {}} className={`bg-transparent border-none cursor-pointer transition-colors ${dm("text-white/70 hover:text-white", "text-gray-800 hover:text-red-500")}`}>About</button>
          <button onClick={() => {}} className={`bg-transparent border-none cursor-pointer transition-colors ${dm("text-white/70 hover:text-white", "text-gray-800 hover:text-red-500")}`}>Help</button>

          {!currentUser && (
            <>
              <button onClick={onLogin} className={`bg-transparent border-none cursor-pointer transition-colors ${dm("text-white/70 hover:text-white", "text-gray-800 hover:text-red-500")}`}>Log in</button>
              <button onClick={onSignup} className={`px-4 py-2 rounded-full text-sm font-semibold hover:-translate-y-0.5 transition-transform border-none cursor-pointer ${dm("bg-white text-black hover:bg-white/90", "bg-gray-900 text-white")}`}>
                Sign up
              </button>
            </>
          )}

          {currentUser && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => { setDropOpen(o => !o); setThemeOpen(false); }}
                className={`inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-2 text-sm font-semibold transition-colors border border-transparent cursor-pointer ${
                  dm(
                    dropOpen ? "bg-white text-black border-white" : "bg-white/10 text-white hover:bg-white/20",
                    "bg-gray-900 text-white hover:bg-gray-700"
                  )
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  {initial}
                </span>
                {first}
                <span className={`text-[11px] transition-transform ${dropOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {dropOpen && (
                <div className={`absolute top-14 right-0 rounded-2xl shadow-2xl w-80 p-6 z-[1500] border ${
                  dm("bg-black border-white/15 text-white", "bg-white border-gray-100 text-gray-900")
                }`}>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className={`text-lg font-bold ${dm("text-white", "text-gray-900")}`}>{name}</h3>
                    <span className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold text-white">
                      {initial}
                    </span>
                  </div>

                  {/* Quick grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { icon: "❓", label: "Help" },
                      { icon: "💳", label: "Wallet", action: () => { setDropOpen(false); showToast("💳 Wallet — coming soon!"); } },
                      { icon: "✅", label: "Activity", action: () => { setDropOpen(false); onActivity(); } },
                    ].map(({ icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className={`rounded-xl p-3.5 flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer border transition-colors ${
                          dm(
                            "bg-white/10 border-white/10 text-white hover:bg-white/20 hover:border-white/20",
                            "bg-gray-50 border-transparent text-gray-700 hover:bg-red-50 hover:text-red-500"
                          )
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  <hr className={`my-3.5 ${dm("border-white/10", "border-gray-100")}`} />

                  {[
                    { icon: "⚙️", label: "Manage account", action: () => { setDropOpen(false); onManageAccount(); } },
                    { icon: "📋", label: "My tasks", action: () => { setDropOpen(false); onMyTasks(); } },
                  ].map(({ icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium rounded-xl transition-colors cursor-pointer bg-transparent border-none text-left ${
                        dm("text-white/80 hover:bg-white/10", "text-gray-800 hover:bg-gray-50")
                      }`}
                    >
                      <span className={`w-5 text-center ${dm("text-white/40", "text-gray-500")}`}>{icon}</span>
                      {label}
                    </button>
                  ))}

                  {/* Theme toggle */}
                  <button
                    onClick={() => setThemeOpen(o => !o)}
                    className={`w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium rounded-xl transition-colors cursor-pointer bg-transparent border-none text-left ${
                      dm("text-white/80 hover:bg-white/10", "text-gray-800 hover:bg-gray-50")
                    }`}
                  >
                    <span className={`w-5 text-center ${dm("text-white/40", "text-gray-500")}`}>🎨</span>
                    Theme
                    <span className={`ml-auto text-xs ${dm("text-white/40", "text-gray-400")}`}>{darkMode ? "Dark" : "Default"}</span>
                    <span className={`text-[11px] transition-transform ${themeOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {themeOpen && (
                    <div className="flex flex-col gap-1 pl-2">
                      {["Default", "Dark"].map(t => (
                        <button
                          key={t}
                          onClick={() => { onToggleDark(t === "Dark"); setThemeOpen(false); showToast(`🎨 Theme set to ${t}`); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                            (t === "Dark") === darkMode
                              ? dm("border border-white bg-white/10 text-white", "border border-red-500 bg-red-50 text-red-500")
                              : dm("border border-transparent text-white/60 hover:bg-white/10", "border border-transparent text-gray-700 hover:bg-gray-50")
                          }`}
                        >
                          {t === "Dark" ? "🌙" : "☀️"} {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setDropOpen(false); showToast("💸 Earn with Padosi — coming soon!"); }}
                    className={`w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium rounded-xl transition-colors cursor-pointer bg-transparent border-none text-left ${
                      dm("text-white/80 hover:bg-white/10", "text-gray-800 hover:bg-gray-50")
                    }`}
                  >
                    <span className={`w-5 text-center ${dm("text-white/40", "text-gray-500")}`}>💰</span>
                    Earn with Padosi
                  </button>

                  <hr className={`my-3.5 ${dm("border-white/10", "border-gray-100")}`} />
                  <button
                    onClick={() => { setDropOpen(false); onSignout(); }}
                    className={`w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-semibold rounded-xl transition-colors cursor-pointer bg-transparent border-none text-left ${
                      dm("text-red-400 hover:bg-white/10", "text-red-500 hover:bg-gray-50")
                    }`}
                  >
                    <span className="w-5 text-center">🚪</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
