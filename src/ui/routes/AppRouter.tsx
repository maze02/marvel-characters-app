import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { routes } from './routes';
import { ListPage } from '../pages/ListPage/ListPage';
import { FavoritesPage } from '../pages/FavoritesPage/FavoritesPage';
import { DetailPage } from '../pages/DetailPage/DetailPage';
import { LoadingBar } from '../designSystem/atoms/LoadingBar/LoadingBar';
import { LoadingProvider, useLoading } from '../state/LoadingContext';

/**
 * Navigation Tracker
 * 
 * Monitors route changes, controls the loading bar, and scrolls to top on navigation.
 */
const NavigationTracker: React.FC = () => {
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [prevLocation, setPrevLocation] = useState(location.pathname);

  useEffect(() => {
    // If location changes, show loading bar briefly and scroll to top
    if (location.pathname !== prevLocation) {
      // Scroll to top of the page
      window.scrollTo(0, 0);
      
      startLoading();
      
      // Stop loading after a short delay to ensure smooth animation
      const timer = setTimeout(() => {
        stopLoading();
      }, 500);

      setPrevLocation(location.pathname);

      return () => {
        clearTimeout(timer);
      };
    }
    
    // Return undefined for the else case (when location hasn't changed)
    return undefined;
  }, [location, prevLocation, startLoading, stopLoading]);

  return null;
};

/**
 * Router Content
 * 
 * Contains routes and navigation tracking.
 */
const RouterContent: React.FC = () => {
  const { isLoading } = useLoading();

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <NavigationTracker />
      <Routes>
        <Route path={routes.home} element={<ListPage />} />
        <Route path={routes.favorites} element={<FavoritesPage />} />
        <Route path={routes.characterDetailPattern} element={<DetailPage />} />
      </Routes>
    </>
  );
};

/**
 * Application Router
 * 
 * Defines all application routes and page components with loading state management.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <RouterContent />
      </LoadingProvider>
    </BrowserRouter>
  );
};
