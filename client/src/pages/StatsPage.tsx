// client/src/pages/StatsPage.tsx
import React from "react";
import ProgressTracker from "../components/ProgressTracker";

const StatsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Your Study Progress
      </h1>
      <ProgressTracker />
    </div>
  );
};

export default StatsPage;