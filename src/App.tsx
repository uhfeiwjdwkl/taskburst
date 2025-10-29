import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import History from "./pages/History";
import RecentlyDeletedUnified from "./pages/RecentlyDeletedUnified";
import Timetable from "./pages/Timetable";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center border-b bg-background px-4">
                <SidebarTrigger />
                <h1 className="ml-4 text-lg font-semibold">TaskBurst</h1>
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/recently-deleted" element={<RecentlyDeletedUnified />} />
                  <Route path="/timetable" element={<Timetable />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
