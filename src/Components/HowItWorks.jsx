// ─── How It Works ────
export default function HowItWorks({ dark }) {
  const steps = [
    { img: "https://cdn-icons-png.flaticon.com/512/1828/1828919.png", label: "Post your task" },
    { img: "https://cdn-icons-png.flaticon.com/512/942/942748.png",   label: "Get responses" },
    { img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",   label: "Get it done" },
  ];

  return (
    <div className={`py-16 px-5 text-center border-t-2 ${dark ? "bg-black border-white" : "bg-white border-[#f0f0f0]"}`}>
      <h2 className={`text-2xl font-bold mb-10 ${dark ? "text-white" : "text-[#111]"}`}>How Padosi works</h2>
      <div className="flex justify-center gap-10 flex-wrap">
        {steps.map(({ img, label }) => (
          <div key={label} className="max-w-[200px] flex flex-col items-center gap-4">
            {dark ? (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-3.5 box-border">
                <img src={img} className="w-full h-full object-contain" alt={label} />
              </div>
            ) : (
              <img src={img} className="w-20" alt={label} />
            )}
            <h3 className={`font-bold ${dark ? "text-white" : "text-[#111]"}`}>{label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
