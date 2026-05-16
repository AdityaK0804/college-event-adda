
export interface PastEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  college: string;
  category: string;
  joinedParticipants: number;
  totalParticipants: number;
  image: string;
  organizerId: string;
  organizerName: string;
  feedbackHighlight: string;
  rating: number;
  benefits: string[];
  testimonials: {
    name: string;
    comment: string;
    rating: number;
  }[];
  hasGallery: boolean;
}

export const pastEvents: PastEvent[] = [
  {
    id: "past-event-1",
    title: "Edge ML in Resource-Constrained Field Robots Workshop",
    description: "Learn about deploying machine learning models on resource-constrained field robots. This workshop provides hands-on experience with optimizing ML models for edge devices.",
    date: "2025-05-10",
    time: "10:00 AM - 1:00 PM",
    location: "Tech Hub",
    college: "IIT Madras",
    category: "Technical",
    joinedParticipants: 20,
    totalParticipants: 25,
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000",
    organizerId: "org-makers",
    organizerName: "Makers Tribe",
    feedbackHighlight: "Great insights on ML deployment in real-world robots with limited resources.",
    rating: 4.7,
    benefits: [
      "10% discount on regular registration fee",
      "Certification of participation",
      "3 attendees got internship offers post workshop"
    ],
    testimonials: [
      {
        name: "Rohit K.",
        comment: "The hands-on session was incredibly valuable. I learned practical techniques I can apply immediately.",
        rating: 5
      },
      {
        name: "Priya M.",
        comment: "The speaker was knowledgeable and addressed all our questions about edge computing limitations.",
        rating: 4.5
      }
    ],
    hasGallery: true
  },
  {
    id: "past-event-2",
    title: "The Ultimate Investment-Ready Workshop",
    description: "A comprehensive workshop designed to help startups prepare for investor meetings. Learn how to create compelling pitches and navigate investment conversations.",
    date: "2025-05-03",
    time: "10:00 AM - 5:00 PM",
    location: "Park Elanza",
    college: "Chennai Business School",
    category: "Business",
    joinedParticipants: 20,
    totalParticipants: 30,
    image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=1000",
    organizerId: "org-business",
    organizerName: "Chennai Freelancers Club",
    feedbackHighlight: "Helped participants polish pitches and connect with real investors.",
    rating: 4.8,
    benefits: [
      "10% off for early online registrants",
      "Networking with real investors",
      "2 startups secured initial funding after the event"
    ],
    testimonials: [
      {
        name: "Vijay S.",
        comment: "This workshop completely transformed how I approach investor meetings. Worth every penny!",
        rating: 5
      },
      {
        name: "Meera L.",
        comment: "The feedback on our pitch deck from actual investors was invaluable.",
        rating: 4.8
      }
    ],
    hasGallery: true
  }
];
