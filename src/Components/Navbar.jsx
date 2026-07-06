import { useState, useEffect, useRef } from "react";

// ─── Navbar ──────────────────
export default function Navbar({ currentUser, onLogin, onSignup, onSignout, onManageAccount, onMyTasks, onActivity, showToast, darkMode, onToggleDark, onAbout, onHelp }) {
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
  const avatarUrl = currentUser?.avatar_url;

  return (
    <nav className="h-[70px] flex justify-center sticky top-0 z-[1000] bg-white border-b border-gray-100">
      <div className="w-full max-w-[1300px] px-5 flex justify-between items-center relative">
        {/* Logo */}
        <button
          onClick={() => window.location.reload()}
          className="text-2xl font-black tracking-tight text-gray-900 bg-transparent border-none cursor-pointer"
        >
          Padosi
        </button>

        {/* Nav links */}
        <div className="flex gap-2 text-sm items-center">
          <button
            onClick={() => showToast("💬 Chat — coming soon!")}
            aria-label="Chat"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors border-none cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>

          <button
            onClick={() => showToast("🔔 Notifications — coming soon!")}
            aria-label="Notifications"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors border-none cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          {!currentUser && (
            <>
              <button onClick={onLogin} className="ml-2 text-gray-800 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">Log in</button>
              <button onClick={onSignup} className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform border-none cursor-pointer">
                Sign up
              </button>
            </>
          )}

          {currentUser && (
            <div className="relative ml-2" ref={dropRef}>
              <button
                onClick={() => { setDropOpen(o => !o); setThemeOpen(false); }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-full pl-2 pr-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors border-none cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                {first}
                <span className={`text-[11px] transition-transform ${dropOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {dropOpen && (
                <div className="absolute top-14 right-0 bg-white rounded-2xl shadow-2xl w-80 p-6 z-[1500] border border-gray-100">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                    <span className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl text-gray-400 font-bold overflow-hidden flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </span>
                  </div>

                  {/* Quick grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { icon: "❓", label: "Help", action: () => { setDropOpen(false); onHelp?.(); } },
                      { icon: "💳", label: "Wallet", action: () => { setDropOpen(false); showToast("💳 Wallet — coming soon!"); } },
                      { icon: "✅", label: "Activity", action: () => { setDropOpen(false); onActivity(); } },
                    ].map(({ icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl p-3.5 flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer border-none transition-colors"
                      >
                        <span className="text-lg">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  <hr className="border-gray-100 my-3.5" />

                  {[
                    { icon: "⚙️", label: "Manage account", action: () => { setDropOpen(false); onManageAccount(); } },
                    { icon: "📋", label: "My tasks", action: () => { setDropOpen(false); onMyTasks(); } },
                    { icon: "ℹ️", label: "About", action: () => { setDropOpen(false); onAbout?.(); } },
                  ].map(({ icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                    >
                      <span className="w-5 text-center text-gray-500">{icon}</span>
                      {label}
                    </button>
                  ))}

                  {/* Theme toggle */}
                  <button
                    onClick={() => setThemeOpen(o => !o)}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="w-5 text-center text-gray-500">🎨</span>
                    Theme
                    <span className="ml-auto text-xs text-gray-400">{darkMode ? "Dark" : "Default"}</span>
                    <span className={`text-[11px] transition-transform ${themeOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {themeOpen && (
                    <div className="flex flex-col gap-1 pl-2">
                      {["Default", "Dark"].map(t => (
                        <button
                          key={t}
                          onClick={() => { onToggleDark(t === "Dark"); setThemeOpen(false); showToast(`🎨 Theme set to ${t}`); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer border transition-colors ${
                            (t === "Dark") === darkMode
                              ? "border-red-500 bg-red-50 text-red-500"
                              : "border-transparent hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {t === "Dark" ? "🌙" : "☀️"} {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setDropOpen(false); showToast("💸 Earn with Padosi — coming soon!"); }}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="w-5 text-center text-gray-500">💰</span>
                    Earn with Padosi
                  </button>

                  <hr className="border-gray-100 my-3.5" />
                  <button
                    onClick={() => { setDropOpen(false); onSignout(); }}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-semibold text-red-500 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
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