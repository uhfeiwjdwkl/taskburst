import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Lists from "./pages/Lists";
import Projects from "./pages/Projects";
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
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/history" element={<History />} />
          <Route path="/recently-deleted" element={<RecentlyDeletedUnified />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
