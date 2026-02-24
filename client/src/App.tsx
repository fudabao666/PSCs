import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewsPage from "./pages/NewsPage";
import NewsDetail from "./pages/NewsDetail";
import TendersPage from "./pages/TendersPage";
import TenderDetail from "./pages/TenderDetail";
import ManufacturersPage from "./pages/ManufacturersPage";
import ManufacturerDetail from "./pages/ManufacturerDetail";
import EfficiencyPage from "./pages/EfficiencyPage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import TechPage from "./pages/TechPage";
import TechPaperDetail from "./pages/TechPaperDetail";
import TechPatentDetail from "./pages/TechPatentDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/tenders" component={TendersPage} />
      <Route path="/tenders/:id" component={TenderDetail} />
      <Route path="/manufacturers" component={ManufacturersPage} />
      <Route path="/manufacturers/:id" component={ManufacturerDetail} />
      <Route path="/efficiency" component={EfficiencyPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/tech" component={TechPage} />
      <Route path="/tech/paper/:id" component={TechPaperDetail} />
      <Route path="/tech/patent/:id" component={TechPatentDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
