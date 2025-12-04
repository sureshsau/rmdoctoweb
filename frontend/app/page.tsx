'use client';

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FullPageSkeleton } from '@/components/SkeletonLoader';
import {
  Phone, ArrowRight, Users, Award, UserCheck, TrendingUp, CheckCircle2,
  Linkedin, Instagram, Twitter, Facebook, Mail, Search
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const carouselRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Simulate initial load or data fetch
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    // Remove skeleton from DOM after fade animation completes
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2500); // 1800 + 700ms for fade

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(skeletonTimer);
    };
  }, []);

  return (
    <>
      {/* Skeleton Overlay - fades out smoothly */}
      {showSkeleton && (
        <div 
          className={`fixed inset-0 z-40 bg-linear-to-br from-purple-50 via-blue-50 to-white transition-opacity duration-700 ease-out ${
            isLoading ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <FullPageSkeleton />
        </div>
      )}

      {/* Main Content - always rendered underneath */}
      <div className="flex flex-col min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-white text-gray-900">

      {/* HERO */}
      <header className="pt-16 pb-10 md:pt-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* left */}
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                Your wellness,<br />our top priority.
              </h1>
              <p className="text-gray-600 max-w-xl">
                We are committed to providing you with the best medical healthcare. Book an appointment online with top specialists effortlessly.
              </p>

              {/* search */}
              <div className="max-w-xl">
                <div className="bg-white shadow-lg rounded-full px-4 py-3 flex items-center gap-3 border border-gray-100">
                  <Search className="w-5 h-5 text-gray-500" />
                  <input
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                    placeholder="Search doctor, specialty or symptom..."
                    type="text"
                    aria-label="Search doctors"
                  />
                  <button className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-full hover:bg-cyan-700 hover:scale-105 transition">
                    Search
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
                <Link href="/book-appointment" className="px-8 py-3 text-center rounded-full font-semibold text-white bg-cyan-600 shadow-md hover:bg-cyan-700 hover:scale-105 transition">
                  Book Appointment
                </Link>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Support Line (8 AM – 6 PM)</div>
                    <div className="text-base font-bold">(+91) 9876543210</div>
                  </div>
                </div>
              </div>

              {/* thumbnails */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-md">
                      <Image src="/d.jpg" alt={`Doc ${i}`} width={48} height={48} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-700">45+ Specialists</div>
              </div>
            </div>

            {/* right */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-50 to-blue-50 p-2">
                <Image src="/d.jpg" alt="Professional Doctor" width={700} height={700} className="w-full h-auto object-cover rounded-xl" />

                {/* Recent Visit */}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg max-w-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">Recent Visit</div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex -space-x-2 mt-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white"><Image src="/d.jpg" width={32} height={32} alt="p" className="object-cover" /></div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white"><Image src="/d.jpg" width={32} height={32} alt="p" className="object-cover" /></div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white"><Image src="/d.jpg" width={32} height={32} alt="p" className="object-cover" /></div>
                  </div>
                </div>

                {/* Trusted card */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">125k+</div>
                    <div className="text-xs text-gray-600">Trusted Patients</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* STATISTICS */}
      <section className="py-10 bg-gradient-to-b from-gray-50 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-xs text-gray-600">Our Doctors Certified</div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">25M+</div>
                  <div className="text-xs text-gray-600">Happy global users</div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">99%</div>
                  <div className="text-xs text-gray-600">Satisfying treatment</div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GOAL */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Let's know about our main goal</h2>
              <p className="text-gray-600 max-w-xl">
                We aim to offer clear and comprehensive information about our services, conditions treated, and treatment options. This ensures that patients can make informed decisions about their healthcare.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {["Accessible Information","Building Trust","Patient Engagement","Community Involvement","Health Education","Security and Privacy"].map((g, i) => (
                  <div key={g} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-1 shrink-0" />
                    <div className="text-sm font-medium text-gray-800">{g}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-50 to-blue-100 p-4">
                <Image src="/d.jpg" alt="Doctor" width={700} height={700} className="w-full h-auto object-cover rounded-xl" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Top-Rated</div>
                    <div className="text-xs text-gray-600">Verified Specialists</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONSULT TOP DOCTORS (SPECIALTIES) */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Consult top doctors online for any health concern</h3>
              <p className="text-gray-600">Private online consultations with verified doctors in all specialists</p>
            </div>
            <button className="hidden lg:block border-2 border-cyan-600 text-cyan-600 px-6 py-2.5 text-sm rounded-full hover:bg-cyan-600 hover:text-white transition font-semibold">
              View All Specialties
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              {title:"Period doubts or\nPregnancy"},
              {title:"Acne, pimple or\nskin issues"},
              {title:"Performance\nissues in bed"},
              {title:"Cold, cough or\nfever"},
              {title:"Child not\nfeeling well"},
              {title:"Depression or\nanxiety"}
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition group text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-100">
                  <Image src="/d.jpg" alt={s.title} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-sm md:text-xs font-semibold mb-3 whitespace-pre-line text-gray-900">{s.title}</h4>
                <button className="w-full text-cyan-600 font-bold text-xs hover:text-cyan-700 transition">CONSULT NOW</button>
              </div>
            ))}
          </div>

          {/* mobile view all */}
          <div className="lg:hidden mt-6 text-center">
            <button className="border-2 border-cyan-600 text-cyan-600 px-8 py-3 rounded-full hover:bg-cyan-600 hover:text-white transition font-semibold">
              View All Specialties
            </button>
          </div>
        </div>
      </section>

      {/* MEET OUR EXPERTS - HORIZONTAL SCROLL CAROUSEL */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-cyan-600">Meet our expert doctors</h3>
            <p className="text-gray-600 text-sm">We aim to share information about our team</p>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto no-scrollbar py-3 px-2"
              aria-label="Doctors carousel"
            >
              {[
                {name:"Martin", role:"Strategic & finance"},
                {name:"Kullok Dash", role:"Neurologist"},
                {name:"Shelly", role:"Cardiologist"},
                {name:"Andrew", role:"Surgeon"},
                {name:"Nina", role:"Pediatrician"},
                {name:"Ravi", role:"Orthopedic"}
              ].map((d, i) => (
                <div key={i} className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] relative rounded-2xl overflow-hidden group shadow-2xl cursor-pointer">
                  <Image src="/d.jpg" alt={d.name} width={400} height={400} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-lg font-bold">{d.name}</h4>
                    <p className="text-sm text-purple-200">{d.role}</p>
                    <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-full hover:bg-white hover:text-purple-600 transition"><Linkedin className="w-4 h-4"/></button>
                      <button className="bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-full hover:bg-white hover:text-purple-600 transition"><Instagram className="w-4 h-4"/></button>
                      <button className="bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-full hover:bg-white hover:text-purple-600 transition"><Twitter className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* optional nav for wide screens */}
            {/* <div className="hidden md:flex gap-3 justify-end mt-4">
              <button onClick={() => carouselRef.current && (carouselRef.current.scrollLeft -= 260)} className="px-3 py-2 bg-white rounded-full shadow">Prev</button>
              <button onClick={() => carouselRef.current && (carouselRef.current.scrollLeft += 260)} className="px-3 py-2 bg-cyan-600 text-white rounded-full shadow">Next</button>
            </div> */}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
            <div className="absolute inset-0">
              <Image src="/testimonial.jpg" alt="bg" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/55"></div>
            </div>

            <div className="relative z-10 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Bring your customer services the next level of excellence.</h3>
              <Link href="/book-appointment" className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-full font-semibold shadow hover:scale-105 transition-all duration-300">
                Make a schedule
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
      </div>
    </>
  );
}