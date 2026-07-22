'use client';


import { DashboardShell } from '@/components/home/dashboard-shell';
import {
  careTips,
  categoryItems,
  maintenanceItems,
} from '@/components/home/data';
import { MainContent } from '@/components/home/main-content';
import { RightPanel } from '@/components/home/right-panel';
import { TopNavbar } from '@/components/home/top-navbar';
import { PageLoader } from '@/components/common/page-loader';

const heroBannerImages = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=600&q=80',
];

const modalCategoryImages = [
  '/assets/loans.png',
  '/assets/Used_cars.png',
  '/assets/Electrical.png',
  '/assets/new_ac.png',
  '/assets/isurance.svg',
  '/assets/Documentation.png',
  '/assets/ev.png',
  '/assets/subscription.png',
];

// garages, seasonalDeals, promoItems images are no longer preloaded here
// as they are fetched dynamically from the API at runtime
const dashboardImageSources = Array.from(
  new Set(
    [
      ...heroBannerImages,
      ...categoryItems.map((item) => item.image).filter(Boolean),
      ...maintenanceItems.map((item) => item.image).filter(Boolean),
      ...careTips.map((item) => item.image).filter(Boolean),
      ...modalCategoryImages,
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    ].filter((src): src is string => Boolean(src))
  )
);

export function HomePage() {
  return (
    <>
      <DashboardShell header={<TopNavbar />} aside={<RightPanel />}>
        <MainContent />
      </DashboardShell>
      <PageLoader imageSources={dashboardImageSources} />
    </>
  );
}

export default HomePage;
