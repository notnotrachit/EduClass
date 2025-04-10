import { DashboardRouter } from './components/DashboardRouter'
import { WalletProvider } from './context/WalletContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThirdwebProvider } from "@thirdweb-dev/react";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="min-h-screen bg-background">
      <ThirdwebProvider
        clientId="65b5851081b21119251060ea906129f0"
        activeChain="sepolia"
      >
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <DashboardRouter />
            </TooltipProvider>
          </WalletProvider>
        </QueryClientProvider>
      </ThirdwebProvider>
    </div>
  );
}

export default App
