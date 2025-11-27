import { useState } from "react";
import { deckService } from "../services/DeckService";

interface ShareDeckProps {
  deckId: number;
  onClose: () => void;
}

export const ShareDeck = ({ deckId, onClose }: ShareDeckProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      await deckService.shareDeck(deckId, email, role);
      alert("Deck shared successfully!");
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to share deck.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Share This Deck</h2>

        <label className="text-sm font-medium">Friend's Email</label>
        <input
          type="email"
          className="w-full border p-2 rounded mt-1 mb-4"
          placeholder="example@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm font-medium">Role</label>
        <select
          className="w-full border p-2 rounded mt-1 mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>

        <button
          onClick={handleShare}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Sharing..." : "Share Deck"}
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full bg-gray-200 p-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShareDeck;