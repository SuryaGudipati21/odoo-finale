// src/components/Layout.jsx — Owner: Shared — page shell (nav + content) matching mockup's blue-header style
import Navigation from "./Navigation";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">{children}</main>
    </div>
  );
}

export default Layout;