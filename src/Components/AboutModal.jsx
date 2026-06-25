import { Modal, ModalTag } from "./Modal";

const features = [
  { icon: "🏘️", title: "Hyperlocal help",    desc: "Post tasks and connect with neighbours in your colony or building." },
  { icon: "✅", title: "Verified members",    desc: "Helpers who've added a phone number you can actually call." },
  { icon: "💰", title: "You set the price",  desc: "Name your budget — no commission or hidden platform fees." },
  { icon: "⚡", title: "Now or later",        desc: "Need something done immediately or schedule it ahead of time." },
];

export function AboutModal({ open, onClose, dark }) {
  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>About Padosi</ModalTag>

      <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>
        Your neighbourhood, connected.
      </h2>
      <p className={`text-sm leading-relaxed mb-5 ${dark ? "text-[#aaa]" : "text-[#555]"}`}>
        <strong>Padosi</strong> (पड़ोसी) means <em>neighbour</em> in Hindi. We're a community marketplace
        where you can post everyday tasks — groceries, repairs, errands — and get help from
        trusted people close by.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {features.map(({ icon, title, desc }) => (
          <div
            key={title}
            className={`rounded-xl p-3.5 border ${
              dark ? "bg-black border-white" : "bg-[#f6f7fb] border-transparent"
            }`}
          >
            <span className="text-xl block mb-1.5">{icon}</span>
            <p className={`text-xs font-bold mb-0.5 ${dark ? "text-white" : "text-[#111]"}`}>{title}</p>
            <p className={`text-xs leading-snug ${dark ? "text-[#888]" : "text-[#777]"}`}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Mission callout */}
      <div
        className={`rounded-xl p-4 border mb-4 ${
          dark ? "bg-black border-white" : "bg-[#fff0f3] border-transparent"
        }`}
      >
        <p className={`text-xs font-bold mb-1 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Our mission</p>
        <p className={`text-xs leading-relaxed ${dark ? "text-[#aaa]" : "text-[#555]"}`}>
          To rebuild the spirit of community in Indian neighbourhoods — where asking a neighbour
          for help is completely normal, and helping back feels genuinely rewarding.
        </p>
      </div>

      <p className={`text-xs text-center ${dark ? "text-[#555]" : "text-[#bbb]"}`}>
        Made with ❤️ in India · v1.0
      </p>
    </Modal>
  );
}
