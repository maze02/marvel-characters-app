import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { routes } from "./routes";
import { LoadingBar } from "../designSystem/atoms/LoadingBar/LoadingBar";
import { LoadingProvider, useLoading } from "../state/LoadingContext";
import { Layout } from "../components/Layout/Layout";

/**
 * Lazy-loaded Page Components
 *
 * What this does for users:
 * - Faster initial page load - only downloads the home page code at first
 * - When you click to other pages, they download on-demand
 * - Better performance, especially on slower connections
 * - Smaller initial download = faster time to interactive
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

/**
 * Navigation Tracker
 *
 * Monitors route changes and scrolls to top on navigation.
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
      // Scroll to top of the page
      window.scrollTo(0, 0);
      setPrevLocation(location.pathname);
    }
  }, [location, prevLocation]);

  return null;
};

/**
 * Router Content
 *
 * Contains routes and navigation tracking.
 * Suspense wrapper shows a loading indicator while page code is downloading.
 *
 * EXPORTED for testing purposes - tests can wrap this in MemoryRouter
 */
export const RouterContent: React.FC = () => {
  const { isLoading } = useLoading();

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <NavigationTracker />
      {/* 
        Layout loads immediately (Navbar appears instantly)
        Only page content is lazy-loaded inside Suspense
        User benefit: Navbar shows right away, page content loads on-demand
      */}
      <Layout>
        <Suspense fallback={<LoadingBar isLoading={true} />}>
          <Routes>
            <Route path={routes.home} element={<ListPage />} />
            <Route path={routes.favorites} element={<FavoritesPage />} />
            <Route
              path={routes.characterDetailPattern}
              element={<DetailPage />}
            />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
};

/**
 * Application Router
 *
 * Defines all application routes and page components with loading state management.
 * Opts into React Router v7 future flags for forward compatibility.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LoadingProvider>
        <RouterContent />
      </LoadingProvider>
    </BrowserRouter>
  );
};
