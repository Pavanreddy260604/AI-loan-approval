"use client";

import { Landmark, BrainCircuit, Zap, ShieldCheck, Scale, BarChart3 } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { GradientDots } from "@/components/ui/gradient-dots";

const timelineData = [
  {
    id: 1,
    title: "Origination Data Ingestion",
    date: "Phase 1",
    content: "Upload and map multi-tenant loan portfolios with automated schema inference and variable drift detection.",
    category: "Data",
    icon: Landmark,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Scorecard Calibration",
    date: "Phase 2",
    content: "Calibrate ensemble scorecards with automatic SMOTE balancing and elite hyperparameter tuning across multiple algorithms.",
    category: "Modeling",
    icon: BrainCircuit,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Real-time Decisioning",
    date: "Phase 3",
    content: "Zero-latency credit decisioning endpoints with built-in SHAP explanations and configurable risk bands.",
    category: "Inference",
    icon: Zap,
    relatedIds: [2, 4, 5],
    status: "in-progress" as const,
    energy: 70,
  },
  {
    id: 4,
    title: "SAR & Fraud Isolation",
    date: "Auxiliary",
    content: "Detect anomalies and loan-stacking via dedicated unsupervised isolation forest models for suspicious activity reporting.",
    category: "Security",
    icon: ShieldCheck,
    relatedIds: [3],
    status: "pending" as const,
    energy: 50,
  },
  {
    id: 5,
    title: "Regulatory Compliance",
    date: "Phase 4",
    content: "Full audit trails for every credit decision. Explainability built-in for Fair Lending and adverse action notices.",
    category: "Compliance",
    icon: Scale,
    relatedIds: [3, 6],
    status: "pending" as const,
    energy: 30,
  },
  {
    id: 6,
    title: "Portfolio Monitoring",
    date: "Phase 5",
    content: "Real-time KPI streams pushing credit risk telemetry, model drift alerts, and performance metrics to your workstation.",
    category: "Analytics",
    icon: BarChart3,
    relatedIds: [5],
    status: "pending" as const,
    energy: 10,
  },
];

export function RadialOrbitalTimelineDemo() {
  return (
    <>
      <RadialOrbitalTimeline timelineData={timelineData} />
    </>
  );
}

export function GradientDotsDemo() {
	return (
		<main className="relative flex size-full min-h-screen w-full items-center justify-center">
			<GradientDots backgroundColor="#000212" />
			<h1 className="text-6xl text-center font-extrabold z-10 text-white">Gradient Dots</h1>
		</main>
	);
}

export default {
  RadialOrbitalTimelineDemo,
  GradientDotsDemo,
};
