import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import History from "./pages/History";
import RecentlyDeleted from "./pages/RecentlyDeleted";
import Timetable from "./pages/Timetable";
import TimetableRecentlyDeleted from "./pages/TimetableRecentlyDeleted";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/history" element={<History />} />
          <Route path="/recently-deleted" element={<RecentlyDeleted />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/timetable/recently-deleted" element={<TimetableRecentlyDeleted />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
