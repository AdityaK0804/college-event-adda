import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import { getEvents, getCategories } from "@/services/events.service";

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [priceRange, setPriceRange] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input — no API call on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters = {
    category: selectedCategory || undefined,
    search: debouncedSearch || undefined,
    priceRange: (priceRange as any) || undefined,
  };

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["events", filters],
    queryFn: () => getEvents(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

  const handleCategoryChange = (value: string) => {
    const cat = value === "all" ? "" : value;
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams);
    cat ? params.set("category", cat) : params.delete("category");
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange("");
    setSearchParams({});
  };

  const hasFilters = !!(selectedCategory || priceRange || debouncedSearch);

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Explore Events</h1>
          <p className="text-muted-foreground mt-1">Discover events happening at Crescent and beyond</p>
        </header>

        <div className="bg-card rounded-xl border border-border/50 p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text" placeholder="Search events…"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Category</label>
              <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Price Range</label>
              <Select value={priceRange || "all"} onValueChange={(v) => setPriceRange(v === "all" ? "" : v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="All Prices" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="under500">Under ₹500</SelectItem>
                  <SelectItem value="500to1000">₹500 – ₹1000</SelectItem>
                  <SelectItem value="above1000">Above ₹1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full" disabled={!hasFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory && (
              <Badge className="bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => handleCategoryChange("all")}>
                {selectedCategory} ×
              </Badge>
            )}
            {priceRange && (
              <Badge className="bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setPriceRange("")}>
                {priceRange === "free" ? "Free" : priceRange === "under500" ? "Under ₹500" : priceRange === "500to1000" ? "₹500–₹1000" : "Above ₹1000"} ×
              </Badge>
            )}
            {debouncedSearch && (
              <Badge className="bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setSearchTerm("")}>
                "{debouncedSearch}" ×
              </Badge>
            )}
          </div>
        )}

        {isError ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h3>
            <p className="text-muted-foreground mb-6">Could not load events. Please try again.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => <EventCard key={event.id} event={event as any} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No events found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Events;
