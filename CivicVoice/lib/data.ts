export interface Post {
  id: number;
  author: string;
  date: string;
  status: "open" | "progress" | "resolved";
  priority: string;
  category: string;
  ward: number;
  location: string;
  title: string;
  body: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaCount?: number;
  likes: number;
  comments: number;
  shares: number;
  upvotes: number;
  liked: boolean;
  upvoted: boolean;
  lat: number | null;
  lng: number | null;
  dateResolved: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface EmergencyContact {
  name: string;
  number: string;
  icon: string;
  bg: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  xp: number;
  issues: number;
  badge: string | null;
  badgeColor?: string;
  bg: string;
  txt: string;
}

export const posts: Post[] = [
  { id: 1, author: 'Ramesh Thapa', date: '27 June 2026', status: 'open', priority: 'high', category: 'road', ward: 3, location: 'New Baneshwor Chowk, Kathmandu', title: 'Large pothole near New Baneshwor Chowk', body: 'A large pothole has formed right at the New Baneshwor Chowk intersection. Vehicles are swerving dangerously to avoid it. Needs urgent repair before someone gets hurt.', hasMedia: true, mediaType: 'image', mediaCount: 3, likes: 24, comments: 8, shares: 12, upvotes: 15, liked: false, upvoted: false, lat: 27.710, lng: 85.322, dateResolved: null },
  { id: 2, author: 'Anonymous', date: '27 June 2026', status: 'progress', priority: 'high', category: 'road', ward: 5, location: 'Jawalakhel, Lalitpur Metropolitan City', title: 'Broken drain cover near Shree Mangal School', body: 'The drain cover on the footpath outside Shree Mangal Higher Secondary School is broken. Kids step on it every day — someone is going to fall in. Reported to Lalitpur Metro twice already.', hasMedia: true, mediaType: 'image', mediaCount: 2, likes: 31, comments: 14, shares: 8, upvotes: 22, liked: false, upvoted: false, lat: 27.720, lng: 85.330, dateResolved: null },
  { id: 3, author: 'Sunita Rai', date: '24 June 2026', status: 'resolved', priority: 'low', category: 'waste', ward: 2, location: 'Ratna Park, Kathmandu', title: 'Overflowing trash bins at Ratna Park cleared', body: 'Public trash bins at Ratna Park were overflowing for three days straight. KMC finally cleared them yesterday and posted a new pickup schedule. Hopefully it stays this time.', hasMedia: false, likes: 18, comments: 5, shares: 3, upvotes: 11, liked: false, upvoted: false, lat: 27.715, lng: 85.318, dateResolved: '28 June 2026' },
  { id: 4, author: 'Bikash Gurung', date: '23 June 2026', status: 'open', priority: 'urgent', category: 'water', ward: 8, location: 'Koteshwor, Kathmandu', title: 'Water pipe burst — 200+ households dry for 6 days', body: 'Main water supply pipe burst near Koteshwor market on June 22. Over 200 households have had no running water since. Neighbours are carrying buckets from a tube well two blocks away.', hasMedia: true, mediaType: 'video', mediaCount: 1, likes: 42, comments: 17, shares: 28, upvotes: 34, liked: false, upvoted: false, lat: 27.725, lng: 85.340, dateResolved: null },
  { id: 5, author: 'Priya Sharma', date: '22 June 2026', status: 'progress', priority: 'medium', category: 'electricity', ward: 12, location: 'Baneshwor, Kathmandu', title: '12 street lights out on Baneshwor main road for a month', body: 'All 12 street lights along the Baneshwor main road (from the bridge to Gyaneswor) have been out for a month. Shop owners are running extension cords for light. Night-time pedestrians are at risk.', hasMedia: true, mediaType: 'image', mediaCount: 4, likes: 16, comments: 6, shares: 4, upvotes: 12, liked: false, upvoted: false, lat: 27.708, lng: 85.315, dateResolved: null },
  { id: 6, author: 'Anita Lama', date: '21 June 2026', status: 'resolved', priority: 'high', category: 'health', ward: 15, location: 'Patan Hospital, Lalitpur', title: 'Patan Hospital restocked with essential medicines', body: 'Patan Hospital was running critically low on insulin and blood pressure medication for chronic patients. After the community flagged it through CivicVoice, Lalitpur Metro restored the supply within 4 days.', hasMedia: true, mediaType: 'image', mediaCount: 2, likes: 53, comments: 11, shares: 19, upvotes: 41, liked: false, upvoted: false, lat: 27.703, lng: 85.308, dateResolved: '27 June 2026' },
];

export const categories: Category[] = [
  { id: 'all', name: 'All Issues', icon: 'fa-list', color: '#2563eb', count: 2847 },
  { id: 'road', name: 'Roads & Traffic', icon: 'fa-road', color: '#D97706', count: 643 },
  { id: 'water', name: 'Water & Drainage', icon: 'fa-droplet', color: '#2563EB', count: 521 },
  { id: 'waste', name: 'Garbage & Waste', icon: 'fa-recycle', color: '#16A34A', count: 487 },
  { id: 'electricity', name: 'Electricity', icon: 'fa-bolt', color: '#D97706', count: 312 },
  { id: 'health', name: 'Health & Safety', icon: 'fa-hospital', color: '#e3342f', count: 289 },
  { id: 'other', name: 'Others', icon: 'fa-clipboard', color: '#6b7280', count: 397 },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: 'Ramesh Thapa', initials: 'RT', xp: 4280, issues: 89, badge: 'Champion', badgeColor: '#F59E0B', bg: 'rgba(245,158,11,0.15)', txt: '#D97706' },
  { rank: 2, name: 'Sunita Rai', initials: 'SR', xp: 3740, issues: 76, badge: 'Hero', badgeColor: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', txt: '#6B7280' },
  { rank: 3, name: 'Bikash Gurung', initials: 'BG', xp: 3120, issues: 62, badge: 'Activist', badgeColor: '#FB923C', bg: 'rgba(234,88,12,0.15)', txt: '#EA580C' },
  { rank: 4, name: 'Purna Shrestha', initials: 'PS', xp: 2890, issues: 58, badge: null, bg: 'rgba(37,99,235,0.15)', txt: '#2563EB' },
  { rank: 5, name: 'Anita Lama', initials: 'AL', xp: 2450, issues: 49, badge: null, bg: 'rgba(22,163,74,0.15)', txt: '#16A34A' },
];

export const emergencyData: EmergencyContact[] = [
  { name: 'Police', number: '100', icon: 'fa-shield', bg: 'rgba(37,99,235,0.1)' },
  { name: 'Ambulance', number: '102', icon: 'fa-truck-medical', bg: 'rgba(239,68,68,0.1)' },
  { name: 'Fire Dept', number: '101', icon: 'fa-fire-extinguisher', bg: 'rgba(234,88,12,0.1)' },
  { name: 'Disaster Mgmt', number: '1155', icon: 'fa-circle-exclamation', bg: 'rgba(217,119,6,0.1)' },
  { name: 'City Hall', number: '555-0100', icon: 'fa-building', bg: 'rgba(22,163,74,0.1)' },
  { name: 'Water Supply', number: '555-0200', icon: 'fa-droplet', bg: 'rgba(37,99,235,0.1)' },
  { name: 'Power Co.', number: '1153', icon: 'fa-bolt', bg: 'rgba(251,191,36,0.1)' },
  { name: 'Women Helpline', number: '1145', icon: 'fa-person-dress', bg: 'rgba(139,92,246,0.1)' },
];
