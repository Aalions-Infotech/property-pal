import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PropertyListPage from "./pages/PropertyListPage";
import PropertyDetail from "./pages/PropertyDetail";
import NewProjects from "./pages/NewProjects";
import PriceTrends from "./pages/PriceTrends";
import HomeLoans from "./pages/HomeLoans";
import News from "./pages/News";
import ArticleDetail from "./pages/ArticleDetail";
import Agents from "./pages/Agents";
import PostProperty from "./pages/PostProperty";
import Login from "./pages/Login";
import AuthPage from "./pages/AuthPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import BecomeAgent from "./pages/BecomeAgent";
import AgentProfile from "./pages/AgentProfile";
import SupportChat from "./components/SupportChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/buy" element={<PropertyListPage type="buy" title="Properties for Sale in India" subtitle="Explore apartments, villas, plots and more across top cities" />} />
              <Route path="/rent" element={<PropertyListPage type="rent" title="Properties for Rent in India" subtitle="Find verified rental homes from owners and agents" />} />
              <Route path="/commercial" element={<PropertyListPage type="commercial" title="Commercial Properties" subtitle="Office spaces, shops, warehouses and more" />} />
              <Route path="/pg" element={<PropertyListPage type="pg" title="PG & Co-Living Spaces" subtitle="Affordable PG accommodations across major cities" />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/new-projects" element={<NewProjects />} />
              <Route path="/price-trends" element={<PriceTrends />} />
              <Route path="/home-loans" element={<HomeLoans />} />
              <Route path="/news" element={<News />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/post-property" element={<PostProperty />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
              <Route path="/become-agent" element={<BecomeAgent />} />
              <Route path="/agent/:id" element={<AgentProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SupportChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
