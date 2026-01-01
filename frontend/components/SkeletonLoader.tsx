'use client';

import { motion, Variants  } from 'framer-motion';

const shimmer:Variants = {
  hidden: { x: '-100%' },
  visible: { 
    x: '100%',
    transition: { 
      repeat: Infinity, 
      duration: 1.5,
      ease: [0, 0, 1, 1] 
    }
  }
};

export const SkeletonBox = ({ className = '', delay = 0 }: { className?: string; delay?: number }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}>
    <motion.div
      variants={shimmer}
      initial="hidden"
      animate="visible"
      className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent"
    />
  </div>
);

export const HeroSkeleton = () => (
  <div className="pt-28 pb-10 md:pt-36 md:pb-16">
    <div className="max-w-7xl mx-auto px-4 md:px-12">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Left side */}
        <div className="space-y-6">
          <SkeletonBox className="h-20 w-full" delay={0} />
          <SkeletonBox className="h-16 w-3/4" delay={0.1} />
          <SkeletonBox className="h-14 w-full max-w-xl rounded-full" delay={0.2} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
            <SkeletonBox className="h-12 w-48 rounded-full" delay={0.3} />
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-12 h-12 rounded-full" delay={0.4} />
              <div className="flex-1">
                <SkeletonBox className="h-3 w-32 mb-2" delay={0.5} />
                <SkeletonBox className="h-4 w-36" delay={0.6} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-3">
              {[1,2,3,4].map((i) => (
                <SkeletonBox key={i} className="w-12 h-12 rounded-full" delay={0.1 * i} />
              ))}
            </div>
            <SkeletonBox className="h-4 w-32" delay={0.7} />
          </div>
        </div>

        {/* Right side */}
        <div className="relative">
          <SkeletonBox className="aspect-square w-full rounded-2xl" delay={0.2} />
        </div>
      </div>
    </div>
  </div>
);

export const StatsSkeleton = () => (
  <section className="py-10 bg-gradient-to-b from-gray-50 to-purple-50/30">
    <div className="max-w-7xl mx-auto px-4 md:px-12">
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map((i) => (
          <SkeletonBox key={i} className="h-32 rounded-2xl" delay={0.1 * i} />
        ))}
      </div>
    </div>
  </section>
);

export const ContentSkeleton = () => (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 md:px-12">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <SkeletonBox className="h-12 w-3/4" delay={0} />
          <SkeletonBox className="h-20 w-full" delay={0.1} />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <SkeletonBox key={i} className="h-8 w-full" delay={0.05 * i} />
            ))}
          </div>
        </div>
        <SkeletonBox className="aspect-square w-full rounded-2xl" delay={0.2} />
      </div>
    </div>
  </section>
);

export const SpecialtiesSkeleton = () => (
  <section className="py-12 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 md:px-12">
      <div className="mb-8">
        <SkeletonBox className="h-10 w-2/3 mb-2" delay={0} />
        <SkeletonBox className="h-5 w-1/2" delay={0.1} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {[1,2,3,4,5,6].map((i) => (
          <SkeletonBox key={i} className="h-48 rounded-2xl" delay={0.05 * i} />
        ))}
      </div>
    </div>
  </section>
);

export const DoctorsSkeleton = () => (
  <section className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 md:px-12">
      <div className="text-center mb-8">
        <SkeletonBox className="h-10 w-64 mx-auto mb-2" delay={0} />
        <SkeletonBox className="h-5 w-48 mx-auto" delay={0.1} />
      </div>
      <div className="flex gap-6 overflow-hidden py-3 px-2">
        {[1,2,3,4,5,6].map((i) => (
          <SkeletonBox key={i} className="min-w-[240px] h-80 rounded-2xl" delay={0.08 * i} />
        ))}
      </div>
    </div>
  </section>
);

export const FullPageSkeleton = () => (
  <div className="flex flex-col min-h-screen">
    <HeroSkeleton />
    <StatsSkeleton />
    <ContentSkeleton />
    <SpecialtiesSkeleton />
    <DoctorsSkeleton />
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <SkeletonBox className="h-64 rounded-3xl" delay={0} />
      </div>
    </section>
  </div>
);