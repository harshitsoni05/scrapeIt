import React from 'react';
import { useRouter } from 'next/router'; // Hook to access the current route

const Layout = ({ children }) => {
  const router = useRouter();
  const { pathname } = router; // Get the current page path

  const handleLogout = () => {
    // Remove the token and redirect to the login page
    localStorage.removeItem('token');
    router.push('/'); // Redirect to the login page
  };

  const handleBackToDocuments = () => {
    router.push('/documents'); // Redirect to documents page
  };

  const handleCreateNewScrapeDoc = () => {
    router.push('/scrape'); // Redirect to create a new document page
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        {/* Show "Back to documents" button on /scrape and documents/<uuid> */}
        {(pathname === '/scrape' || pathname.startsWith('/documents/')) && (
          <button className="header-button left" onClick={handleBackToDocuments}>Back to documents</button>
        )}

        {/* Show "Create a new scrape doc" button on /documents */}
        {pathname === '/documents' && (
          <button className="header-button left" onClick={handleCreateNewScrapeDoc}>Create a new scrape doc</button>
        )}

        {/* Centered Website Title */}
        <h1 className="website-title" onClick={() => router.push('/')}>ScrapeIt</h1>

        {/* Show logout button on all pages except index (login) and signup */}
        {pathname !== '/' && pathname !== '/signup' && (
          <button className="header-button right" onClick={handleLogout}>Logout</button>
        )}
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
