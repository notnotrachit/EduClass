import { DashboardRouter } from './components/DashboardRouter'
import { WalletProvider } from './context/WalletContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DashboardRouter />
          </TooltipProvider>
        </WalletProvider>
      </QueryClientProvider>
    </div>
  )
}

export default App
