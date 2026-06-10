/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow pet photos served from Supabase Storage and seed placeholders
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placedog.net" },
      { protocol: "https", hostname: "placekitten.com" },
    ],
  },
};

export default nextConfig;
