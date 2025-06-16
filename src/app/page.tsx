import { ForexDashboard } from "@/components/forex/forex-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <ForexDashboard />
    </main>
  );
}
/**
 * Home page component for the forex application.
 * Renders the main page layout with a ForexDashboard component.
 * 
 * @returns {JSX.Element} The main page of the application with a full-height background
 */