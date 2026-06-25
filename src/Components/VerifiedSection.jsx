// ─── Verified Member CTA Section ─
export default function VerifiedSection({ currentUser, showToast, onRequireLogin, onOpenManage, dark }) {
  if (currentUser?.phone) return null;
  return (
    <div className={`mx-auto max-w-[1200px] my-16 rounded-2xl p-10 ${
      dark
        ? "bg-black border border-white text-white"
        : "bg-gradient-to-br from-[#ff2d55] to-[#ff6b81] text-white"
    }`}>
      <div className="flex items-center justify-between gap-10 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold mb-2">Become a Verified Member</h2>
          <p className="mb-5 opacity-90">Earn money by helping people nearby.</p>
          <button
            onClick={() => {
              if (!currentUser) { showToast("👋 Please log in first"); onRequireLogin(); return; }
              onOpenManage();
            }}
            className={`px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity ${
              dark ? "bg-white text-black" : "bg-white text-[#ff2d55]"
            }`}
          >
            Get Verified
          </button>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          className={`w-48 opacity-90 ${dark ? "invert" : ""}`}
          alt="Verified"
        />
      </div>
    </div>
  );
}
