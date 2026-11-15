import { Volume2, VolumeX } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function SoundToggle() {
  const { sound, toggleSound } = useToast();
  return (
    <button
      onClick={toggleSound}
      aria-label={sound ? "Mute alert sound" : "Enable alert sound"}
      title={sound ? "Alert sound on" : "Alert sound off"}
      className="nav-btn flex h-9 w-9 items-center justify-center rounded-lg transition"
    >
      {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}