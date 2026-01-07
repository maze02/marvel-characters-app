import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { routes } from "./routes";
import { Layout } from "../components/Layout/Layout";

/**
 * Lazy-loaded Page Components
 *
 */
const ListPage = lazy(() =>
  import("../pages/ListPage/ListPage").then((m) => ({ default: m.ListPage })),
);
const FavoritesPage = lazy(() =>
  import("../pages/FavoritesPage/FavoritesPage").then((m) => ({
    default: m.FavoritesPage,
  })),
);
const DetailPage = lazy(() =>
  import("../pages/DetailPage/DetailPage").then((m) => ({
    default: m.DetailPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);

/**
 * Navigation Tracker
 *
 * Functional Component monitors route changes and scrolls to top on navigation, and not to where they scrolled on prev navigation.
 *
 * Note: Loading state is managed by individual pages, not here.
 * This ensures proper coordination between navigation and data loading.
 */
const NavigationTracker: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location.pathname);

  useEffect(() => {
    // If location changes, scroll to top
    if (location.pathname !== prevLocation) {
      window.scrollTo(0, 0); // Scrolls to top of the page
      setPrevLocation(location.pathname);
    }
  }, [location, prevLocation]);

  return null;
};

/**
 * Router Content
 *
 * Contains routes and navigation tracking.
 * Suspense wrapper handles lazy loading - loading feedback shown via LoadingBar in Layout.
 *
 * EXPORTED for testing purposes - tests can wrap this in MemoryRouter
 */
export const RouterContent: React.FC = () => {
  return (
    <>
      <NavigationTracker />
      {/* 
        Layout loads immediately (Navbar and LoadingBar appear instantly)
        Only page content is lazy-loaded inside Suspense
        LoadingBar in Layout handles all loading feedback
      */}
      <Layout>
        <Suspense fallback={null}>
          <Routes>
            <Route path={routes.home} element={<ListPage />} />
            <Route path={routes.favorites} element={<FavoritesPage />} />
            <Route
              path={routes.characterDetailPattern}
              element={<DetailPage />}
            />
            {/* Catch-all for unmatched routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
};

/**
 * Application Router
 *
 * Defines all application routes and page components.
 * Opts into React Router v7 (released Nov 2024) future flags for forward compatibility.
 * Currently using React Router v6 Stable Version.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <RouterContent />
    </BrowserRouter>
  );
};
