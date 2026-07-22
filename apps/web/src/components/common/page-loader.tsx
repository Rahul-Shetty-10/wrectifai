'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface PageLoaderProps {
  imageSources?: string[];
}

export function PageLoader({ imageSources = [] }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFadeOut, setIsFadeOut] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const isLoadingNeeded = imageSources.length > 0;

  useEffect(() => {
    if (imageSources.length === 0) {
      return;
    }

    // Smart cache detection: check if images are already cached by the browser
    let allCached = true;
    for (const src of imageSources) {
      const img = new window.Image();
      img.src = src;
      if (!img.complete) {
        allCached = false;
        break;
      }
    }

    if (allCached) {
      const frame = requestAnimationFrame(() => {
        setIsFadeOut(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    let isMounted = true;
    let loadedCount = 0;
    const totalImages = imageSources.length;

    const interval = setInterval(() => {
      if (!isMounted) return;

      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        const target =
          totalImages > 0 ? Math.round((loadedCount / totalImages) * 100) : 100;

        if (prev < target) {
          return prev + Math.min(4, target - prev);
        }

        return prev;
      });
    }, 25);

    const preloadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const image = new window.Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = src;

        if (image.complete) {
          resolve();
        }
      });

    const preloadPromises = imageSources.map((src) =>
      preloadImage(src).then(() => {
        if (isMounted) {
          loadedCount++;
        }
      })
    );

    Promise.all(preloadPromises).finally(() => {
      loadedCount = totalImages;
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [imageSources]);

  useEffect(() => {
    if (!isLoadingNeeded) return;

    if (progress === 100) {
      const delayFade = setTimeout(() => {
        setIsFadeOut(true);
        const destroyTimer = setTimeout(() => {
          setIsDestroyed(true);
        }, 500);
        return () => clearTimeout(destroyTimer);
      }, 400);
      return () => clearTimeout(delayFade);
    }
  }, [progress, isLoadingNeeded]);

  // If no loading is needed (assets already cached) or loader has finished, render nothing
  if (!isLoadingNeeded || isDestroyed) {
    return null;
  }

  return (
    <main
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ebf2fd] transition-opacity duration-500 ease-in-out ${
        isFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-3 w-[240px] sm:w-[280px] md:w-[320px]">
          <Image
            src="/Logo_noBg.png"
            alt="WrectifAI Logo"
            width={320}
            height={160}
            priority
            style={{ width: '100%', height: 'auto' }}
            className="object-contain"
          />
        </div>

        <div className="w-[180px] sm:w-[210px] md:w-[240px] h-[5px] rounded-full bg-[#d2e2fc] overflow-hidden relative">
          <div
            className="h-full rounded-full bg-[#4d82f3] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </main>
  );
}
