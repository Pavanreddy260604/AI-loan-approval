import React, { useState } from "react";
import { FrictionModal } from "./feedback";

interface FrictionGateProps {
  children: React.ReactNode;
  confidence: number;
  onConfirm: () => void;
  threshold?: number;
  title?: string;
  description?: string;
}

/**
 * FrictionGate: A 10/10 AI-Safety Wrapper.
 * Intercepts actions for low-confidence AI signals and requires manual human confirmation.
 */
export function FrictionGate({ 
  children, 
  confidence, 
  onConfirm, 
  threshold = 70,
  title = "Low Confidence Signal",
  description = "The AI model has flagged this application with high uncertainty. Manual verification is strongly recommended before proceeding with this decision."
}: FrictionGateProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (confidence < threshold) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    } else {
      onConfirm();
    }
  };

  return (
    <>
      <div onClickCapture={handleClick} className="contents">
        {children}
      </div>
      
      <FrictionModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={() => {
          setShowModal(false);
          onConfirm();
        }}
        title={title}
        description={description}
      />
    </>
  );
}
