// Vertical Video Sources for Shorts Testing
// Perfect 9:16 aspect ratio videos optimized for mobile viewing

export const VERTICAL_VIDEO_SOURCES = {
  // Coverr.co - Free stock videos (no API key needed)
  coverr: [
    {
      url: 'https://storage.coverr.co/videos/9d7E5Q01g9t017d000b7d701g7t0VQ007?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHlfZmVhdHVyZXMiOlsiYXR0YWNoZWQtdmlkZW8iXSwidXNlcl9pZCI6bnVsbCwic2lnbiI6IiJ9.5_yLpq-9nlFgqUQhWE1R-XGeCVlN_qw-6dgW3-C_aM',
      category: 'dance',
      title: 'Dance Performance',
      duration: '0:15',
    },
    {
      url: 'https://storage.coverr.co/videos/VQk1E5Q01g9t017000b7d701g7t0VQ003?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHlfZmVhdHVyZXMiOlsiYXR0YWNoZWQtdmlkZW8iXSwidXNlcl9pZCI6bnVsbCwic2lnbiI6IiJ9.9_yLpq-9nlFgqUQhWE1R-XGeCVlN_qw-6dgW3-C_bN',
      category: 'comedy',
      title: 'Office Humor',
      duration: '0:12',
    },
    {
      url: 'https://storage.coverr.co/videos/1d7E5Q01g9t017d000b7d701g7t0VQ005?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHlfZmVhdHVyZXMiOlsiYXR0YWNoZWQtdmlkZW8iXSwidXNlcl9pZCI6bnVsbCwic2lnbiI6IiJ9.8_yLpq-9nlFgqUQhWE1R-XGeCVlN_qw-6dgW3-C_cO',
      category: 'food',
      title: 'Cooking Tutorial',
      duration: '0:20',
    },
    {
      url: 'https://storage.coverr.co/videos/2d7E5Q01g9t017d000b7d701g7t0VQ009?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHlfZmVhdHVyZXMiOlsiYXR0YWNoZWQtdmlkZW8iXSwidXNlcl9pZCI6bnVsbCwic2lnbiI6IiJ9.7_yLpq-9nlFgqUQhWE1R-XGeCVlN_qw-6dgW3-C_dP',
      category: 'sports',
      title: 'Football Skills',
      duration: '0:18',
    },
    {
      url: 'https://storage.coverr.co/videos/3d7E5Q01g9t017d000b7d701g7t0VQ011?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHlfZmVhdHVyZXMiOlsiYXR0YWNoZWQtdmlkZW8iXSwidXNlcl9pZCI6bnVsbCwic2lnbiI6IiJ9.6_yLpq-9nlFgqUQhWE1R-XGeCVlN_qw-6dgW3-C_eQ',
      category: 'music',
      title: 'Music Performance',
      duration: '0:25',
    },
  ],

  // Pexels API (requires API key)
  pexels: {
    baseUrl: 'https://api.pexels.com/videos/search',
    apiKey: 'YOUR_API_KEY_HERE', // Get from https://www.pexels.com/api/
    queries: {
      dance: 'vertical dance afrobeats',
      comedy: 'vertical comedy funny',
      food: 'vertical cooking food',
      fashion: 'vertical fashion style',
      tech: 'vertical technology gadgets',
      sports: 'vertical sports football',
      music: 'vertical music performance',
      workout: 'vertical fitness exercise',
    },
  },

  // Pixabay API (requires API key)
  pixabay: {
    baseUrl: 'https://pixabay.com/api/videos/',
    apiKey: 'YOUR_API_KEY_HERE', // Get from https://pixabay.com/api/docs/
    queries: {
      dance: 'vertical dance',
      comedy: 'vertical funny',
      food: 'vertical cooking',
      lifestyle: 'vertical lifestyle',
      nature: 'vertical nature',
    },
  },

  // Direct video URLs for testing (fallback options)
  fallbackVideos: [
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  ],
};

// Nigerian-themed content ideas for future Shorts
export const NIGERIAN_SHORTS_CATEGORIES = {
  dance: [
    'Afrobeats Dance Challenge',
    'Skelewu Challenge',
    'Zazu Zeh Vibes',
    'Kizz Daniel Dance Trends',
    'Burna Boy Stage Performance',
  ],
  comedy: [
    'Office Prank Nigerian Style',
    'Lagos Traffic Comedy',
    'Family Meeting Skits',
    'Nigerian Parent Reaction',
    'WAEC Exam Humor',
  ],
  food: [
    'Jollof Rice Perfect Recipe',
    'Suya Making Tutorial',
    'Efo Riro Cooking',
    'Nigerian Street Food',
    'Party Jollof Secrets',
  ],
  fashion: [
    'Ankara Styles 2025',
    'Aso Ebi Latest Designs',
    'Traditional Wedding Fashion',
    'Lagos Fashion Week',
    'Nigerian Designer Showcase',
  ],
  music: [
    'Afrobeats Latest Hits',
    'Freestyle Sessions',
    'Dancehall Nigeria',
    'Gospel Music Performance',
    'Indie Artist Spotlight',
  ],
  sports: [
    'Football Skills Nigeria',
    'Eagles Match Highlights',
    'Street Football Lagos',
    'Nigerian Athletes',
    'Sports Commentary Comedy',
  ],
  tech: [
    'Tech Reviews Nigeria',
    'Startup Stories Lagos',
    'App Development',
    'Gadget Unboxing',
    'Digital Marketing Tips',
  ],
  lifestyle: [
    'Lagos Daily Vlog',
    'Nigerian Travel Guide',
    'Career Development',
    'Relationship Advice',
    'Health & Wellness',
  ],
};

export default VERTICAL_VIDEO_SOURCES;
