
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  college: string;
  category: string;
  price: number;
  image: string;
  organizerId: string;
  organizerName: string;
  seats: {
    total: number;
    available: number;
  };
  featured: boolean;
}

export const events: Event[] = [
  {
    id: "event-1",
    title: "TechFest 2025",
    description: "The biggest technical festival of the year. Join us for exciting competitions, workshops, and guest lectures from industry experts.",
    date: "2025-06-15",
    time: "09:00 AM",
    location: "Main Auditorium",
    college: "IIT Delhi",
    category: "Technical",
    price: 499,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000",
    organizerId: "org-1",
    organizerName: "Tech Club",
    seats: {
      total: 1000,
      available: 650,
    },
    featured: true
  },
  {
    id: "event-2",
    title: "Cultural Night",
    description: "An evening of music, dance, and drama performances by talented students across colleges.",
    date: "2025-05-20",
    time: "06:00 PM",
    location: "Open Air Theatre",
    college: "Delhi University",
    category: "Cultural",
    price: 299,
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000",
    organizerId: "org-2",
    organizerName: "Cultural Committee",
    seats: {
      total: 500,
      available: 120,
    },
    featured: true
  },
  {
    id: "event-3",
    title: "Startup Summit",
    description: "Connect with successful entrepreneurs, pitch your ideas, and learn about the startup ecosystem.",
    date: "2025-06-05",
    time: "10:00 AM",
    location: "Conference Center",
    college: "IIM Bangalore",
    category: "Business",
    price: 999,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1000",
    organizerId: "org-3",
    organizerName: "E-Cell",
    seats: {
      total: 300,
      available: 85,
    },
    featured: true
  },
  {
    id: "event-4",
    title: "Robotics Workshop",
    description: "Hands-on workshop on building and programming robots for beginners and intermediate level enthusiasts.",
    date: "2025-05-25",
    time: "11:00 AM",
    location: "Engineering Block",
    college: "VIT Vellore",
    category: "Technical",
    price: 799,
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1000",
    organizerId: "org-4",
    organizerName: "Robotics Club",
    seats: {
      total: 50,
      available: 15,
    },
    featured: false
  },
  {
    id: "event-5",
    title: "Literary Festival",
    description: "Book launches, author interactions, and literary competitions for all book lovers.",
    date: "2025-07-10",
    time: "10:00 AM",
    location: "Central Library",
    college: "St. Stephen's College",
    category: "Literary",
    price: 199,
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1000",
    organizerId: "org-5",
    organizerName: "Literary Society",
    seats: {
      total: 200,
      available: 75,
    },
    featured: false
  },
  {
    id: "event-6",
    title: "Annual Sports Meet",
    description: "Inter-college sports competitions featuring cricket, football, basketball, athletics, and more.",
    date: "2025-08-05",
    time: "08:00 AM",
    location: "Sports Complex",
    college: "Anna University",
    category: "Sports",
    price: 149,
    image: "https://images.unsplash.com/photo-1526676313553-383d979d4258?q=80&w=1000",
    organizerId: "org-6",
    organizerName: "Sports Council",
    seats: {
      total: 1500,
      available: 800,
    },
    featured: false
  }
];
