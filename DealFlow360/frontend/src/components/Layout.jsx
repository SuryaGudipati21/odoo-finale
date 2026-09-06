// src/components/Layout.jsx — Owner: Shared — page shell (nav + content) matching mockup's blue-header style
import Navigation from "./Navigation";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100 text-gray-900 antialiased selection:bg-blue-500 selection:text-white">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">{children}</main>
    </div>
  );
}

export default Layout;