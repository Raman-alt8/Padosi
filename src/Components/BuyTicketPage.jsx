export default function BuyTicketPage({ showToast, dark = false, user = null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openTickets", handler);
    return () => window.removeEventListener("padosi:openTickets", handler);
  }, []);

  const handleOpenPost = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:postTicket"));
  };

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
        dark ? "bg-black" : "bg-[#f6f7fb]"
      } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark ? "bg-black border-white text-white hover:bg-white hover:text-black" : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Tickets</span>
        </p>
        <button
          onClick={handleOpenPost}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark ? "bg-white border-white text-black hover:bg-white/80" : "bg-[#ff2d55] border-[#ff2d55] text-white hover:bg-[#e0254c]"
          }`}
        >
          + Post
        </button>
      </div>

      <div className={`py-12 px-6 text-center ${dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"}`}>
        <h1 className="text-5xl font-black">🎟️</h1>
        <h2 className="text-3xl font-black mt-2">Tickets</h2>
        <p className={`mt-2 text-sm max-w-sm mx-auto ${dark ? "opacity-60" : "opacity-90"}`}>
          Buy tickets from neighbours or post your extras — no middlemen, no markup.
        </p>
      </div>

      <div className="flex justify-center px-4 pb-16">
        <div className="w-full max-w-3xl -mt-6">
          <div className={`rounded-2xl border p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
            <BuyPanel dark={dark} showToast={showToast} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}