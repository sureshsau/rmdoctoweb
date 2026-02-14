'use client';

import { useState, useEffect } from "react";
import { Icon } from '@iconify/react';
import Link from "next/link";
import Image from "next/image";
import { FullPageSkeleton } from '@/components/common/SkeletonLoader';
import { FeatureGrid, type Feature } from "@/components/landing/FeatureGrid";
import AcneIcon from '../icons/Acne.png';
import ColdIcon from '../icons/Cold.png';
import DepIcon from '../icons/Dep.png';
import PeriodIcon from '../icons/Period.png';
import {
  Phone, ArrowRight, Users, Award, UserCheck, TrendingUp, CheckCircle2,
  Linkedin, Instagram, Twitter, Facebook, Mail, Search, Pill, Heart,
  Baby, Activity, Leaf, Stethoscope, Droplets, BarChart3, TestTube,
  Zap, Sun, Shield, Brain, Radio, Eye, MonitorSpeaker, Bone, 
  FlaskConical, Calendar, FileText, PhoneCall, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { StatCard } from "@/components/landing/StatCard";
import LandingStatistics from '@/components/landing/LandingStatistics';
import Footer from '@/components/layout/Footer';
import BookAppointmentButton from '@/components/landing/BookAppointmentButton';
import { Testimonials } from '@/components/landing';
import PayrollImg from '../Images/PayRoll.jpeg';
import EmployeeImg from '../Images/EmployeeManagement.jpeg';
import LabTestImg from '../Images/LabTest.jpeg';
import MedicineImg from '../Images/MedicineStore.jpeg';

// Data for the healthcare feature grid
const platformFeatures: Feature[] = [
  {
    imageSrc: PayrollImg.src,
    imageAlt: "Payroll management icon",
    title: "Payroll",
    description: "Streamline salary processing, taxes and payslips with our secure payroll tools built for healthcare teams.",
    href: "/payroll",
  },
  {
    imageSrc: EmployeeImg.src,
    imageAlt: "Employee management icon",
    title: "Employee Management",
    description: "Centralize staff records, shifts, attendance and performance to simplify HR workflows for clinics and hospitals.",
    href: "/employees",
  },
  {
    imageSrc: LabTestImg.src,
    imageAlt: "Laboratory services icon",
    title: "Lab Test",
    description: "Book and manage lab tests with home collection and fast digital reports for accurate diagnostics.",
    href: "/lab-test",
  },
  {
    imageSrc: MedicineImg.src,
    imageAlt: "Medicine store icon",
    title: "Medicine Store",
    description: "Order verified medicines and healthcare products with doorstep delivery and prescription verification.",
    href: "/medicine-store",
  },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showAllCards, setShowAllCards] = useState(false);
  const [showAllLabTests, setShowAllLabTests] = useState(false);
  const [showAllScans, setShowAllScans] = useState(false);

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
      <header className="pt-16 pb-10 md:pt-20 md:pb-16 bg-linear-to-br from-purple-50 via-blue-50 to-white -mt-20 pt-36 md:pt-40">
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
                <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
                    placeholder="Search doctor, specialty or symptom..."
                    type="text"
                    aria-label="Search doctors"
                  />
                  <button className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all">
                    Search
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
                <BookAppointmentButton variant="landing" />

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Support Line (8 AM – 6 PM)</div>
                    <div className="text-base font-bold">(+91) 9144919150</div>
                  </div>
                </div>
              </div>

              {/* thumbnails */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-3">
                  {[
                    PeriodIcon,
                    AcneIcon,
                    ColdIcon,
                    DepIcon
                  ].map((icon, i) => (
                    <div key={i} className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-md">
                      <Image src={icon} alt={`Specialist ${i + 1}`} width={48} height={48} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-700">45+ Specialists</div>
              </div>
            </div>

            {/* right */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-linear-to-br from-teal-50 to-blue-50 ">
                <Image src="/landing11.png" alt="Professional Doctor" width={900} height={700} className="w-full h-auto object-cover rounded-xl" />

                {/* Recent Visit */}
                {/* <div className="absolute top-3 left-3 md:top-6 md:left-6 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg max-w-[120px] md:max-w-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs md:text-sm font-semibold text-gray-700">Recent Visit</div>
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex -space-x-1 md:-space-x-2 mt-2 md:mt-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white"><Image src={PeriodIcon} width={32} height={32} alt="specialist" className="object-cover" /></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white"><Image src={AcneIcon} width={32} height={32} alt="specialist" className="object-cover" /></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white"><Image src={ColdIcon} width={32} height={32} alt="specialist" className="object-cover" /></div>
                  </div>
                </div> */}

                {/* Trusted card */}
                {/* <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm md:text-lg font-bold">125k+</div>
                    <div className="text-xs text-gray-600">Trusted Patients</div>
                  </div>
                </div> */}

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* STATISTICS */}
      <LandingStatistics />

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
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-linear-to-br from-teal-50 to-blue-100">
                <Image src="/landing.jpeg" alt="Doctor" width={700} height={700} className="w-full h-auto object-cover rounded-xl" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    {/* <div className="text-sm font-bold text-gray-900">Top-Rated</div> */}
                    {/* <div className="text-xs text-gray-600">Verified Specialists</div> */}
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
            <button className="hidden lg:block border-2 border-teal-600 text-teal-700 px-6 py-2.5 text-sm rounded-xl hover:bg-teal-600 hover:text-white transition font-semibold">
              View All Specialties
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              {title:"Period doubts or\nPregnancy", icon:PeriodIcon},
              {title:"Acne, pimple or\nskin issues", icon:AcneIcon},
              {title:"Performance\nissues in bed", icon:PeriodIcon},
              {title:"Cold, cough or\nfever", icon:ColdIcon},
              {title:"Child not\nfeeling well", icon:ColdIcon},
              {title:"Depression or\nanxiety", icon:DepIcon}
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition group text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-100">
                  <Image src={s.icon} alt={s.title} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-sm md:text-xs font-semibold mb-3 whitespace-pre-line text-gray-900">{s.title}</h4>
                <button className="w-full text-teal-600 font-bold text-xs hover:text-teal-700 transition">CONSULT NOW</button>
              </div>
            ))}
          </div>

          {/* mobile view all */}
          <div className="lg:hidden mt-6 text-center">
            <button className="border-2 border-teal-600 text-teal-700 px-8 py-3 rounded-xl hover:bg-teal-600 hover:text-white transition font-semibold">
              View All Specialties
            </button>
          </div>
        </div>
      </section>

      {/* MEDICAL SERVICES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Comprehensive Medical Services</h3>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">Access a wide range of medical services from the comfort of your home with our professional healthcare solutions</p>
          </div>

          {/* Medicine Section */}
          <div className="mb-16">
            {/* Header with See more button aligned */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3 sm:gap-4">
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600 mb-1 sm:mb-2 leading-tight">Online Medicine Store</h4>
                <p className="text-gray-600 hidden sm:block">Get genuine medicines delivered to your doorstep with prescription verification</p>
              </div>
              <div className="text-right shrink-0">
                <button 
                  onClick={() => setShowAllCards(!showAllCards)}
                  className="text-teal-600 font-semibold text-xs sm:text-sm hover:text-teal-700 transition whitespace-nowrap px-2 py-1 sm:px-0 sm:py-0"
                >
                  {showAllCards ? "See less" : "See more"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                {name:"Prescription Medicines", desc:"Verified prescriptions", icon:"mdi:pill"},
                {name:"OTC Medicines", desc:"Over-the-counter drugs", icon:"mdi:medical-bag"},
                {name:"Health Supplements", desc:"Vitamins & nutrients", icon:"mdi:leaf"},
                {name:"Medical Devices", desc:"Healthcare equipment", icon:"mdi:stethoscope"},
                {name:"Baby & Mother Care", desc:"Maternal health products", icon:"mdi:baby-bottle"},
                {name:"Diabetic Care", desc:"Blood sugar management", icon:"mdi:needle"},
                {name:"Heart Care", desc:"Cardiovascular health", icon:"mdi:heart-pulse"},
                {name:"Skin Care", desc:"Dermatological solutions", icon:"mdi:face-woman"}
              ]
              .filter((item, i) => {
                // Show first 4 cards unless showAllCards is true (works for both mobile and desktop)
                return showAllCards || i < 4;
              })
              .map((item, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden min-h-[140px] sm:min-h-[160px]"
                >
                  {/* right-side circular icon - responsive sizing */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-lg">
                    <Icon icon={item.icon} className="text-white" width={16} height={16} />
                  </div>

                  <div className="pr-6 sm:pr-8 flex flex-col h-full justify-between">
                    <div>
                      <h5 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 leading-relaxed">{item.name}</h5>
                      <p className="text-xs text-gray-500 mb-3 sm:mb-4">{item.desc}</p>
                    </div>
                    <button className="text-xs font-bold text-teal-600 px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-teal-200 hover:bg-teal-600 hover:text-white transition w-full sm:w-auto min-h-[36px] flex items-center justify-center">
                      ORDER NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Test Section */}
          <div className="mb-16">
            {/* Header with See more button aligned */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3 sm:gap-4">
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600 mb-1 sm:mb-2 leading-tight">Laboratory Tests</h4>
                <p className="text-gray-600 hidden sm:block">Book lab tests and get accurate reports with home collection facility</p>
              </div>
              <div className="text-right shrink-0">
                <button 
                  onClick={() => setShowAllLabTests(!showAllLabTests)}
                  className="text-teal-600 font-semibold text-xs sm:text-sm hover:text-teal-700 transition whitespace-nowrap px-2 py-1 sm:px-0 sm:py-0"
                >
                  {showAllLabTests ? 'See less' : 'See more'}
                </button>
              </div>
            </div>

            {/* PNG-style cards with right-side icons using Iconify */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                {name:"Complete Blood Count (CBC)", desc:"Blood analysis", icon:"mdi:blood-bag"},
                {name:"Lipid Profile", desc:"Cholesterol levels", icon:"mdi:chart-line"},
                {name:"Thyroid Function", desc:"Hormone levels", icon:"mdi:thyroid"},
                {name:"Diabetes Panel", desc:"Blood sugar tests", icon:"mdi:diabetes"},
                {name:"Liver Function", desc:"Hepatic markers", icon:"mdi:human-handsup"},
                {name:"Kidney Function", desc:"Renal markers", icon:"mdi:kidney"},
                {name:"Vitamin Deficiency", desc:"Nutritional status", icon:"mdi:pill"},
                {name:"Cancer Screening", desc:"Early detection", icon:"mdi:shield-check"}
              ]
              .filter((item, i) => {
                // Show first 4 cards unless showAllLabTests is true
                return showAllLabTests || i < 4;
              })
              .map((item, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden min-h-[140px] sm:min-h-[160px]"
                >
                  {/* right-side circular icon - responsive sizing */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-lg">
                    <Icon icon={item.icon} className="text-white" width={16} height={16} />
                  </div>

                  <div className="pr-6 sm:pr-8 flex flex-col h-full justify-between">
                    <div>
                      <h5 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 leading-relaxed">{item.name}</h5>
                      <p className="text-xs text-gray-500 mb-3 sm:mb-4">{item.desc}</p>
                    </div>
                    <button className="text-xs font-bold text-teal-600 px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-teal-200 hover:bg-teal-600 hover:text-white transition w-full sm:w-auto min-h-[36px] flex items-center justify-center">
                      BOOK TEST
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {false && (
            <>
              {/* Diagnostic Scans Section (disabled) */}
              <div className="mb-16">
                {/* Header with See more button aligned */}
                <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3 sm:gap-4">
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600 mb-1 sm:mb-2 leading-tight">Diagnostic Scans & Imaging</h4>
                    <p className="text-gray-600 hidden sm:block">Advanced imaging services with state-of-the-art technology and expert radiologists</p>
                  </div>
                  <div className="text-right shrink-0">
                    <button 
                      onClick={() => setShowAllScans(!showAllScans)}
                      className="text-teal-600 font-semibold text-xs sm:text-sm hover:text-teal-700 transition whitespace-nowrap px-2 py-1 sm:px-0 sm:py-0"
                    >
                      {showAllScans ? 'See less' : 'See more'}
                    </button>
                  </div>
                </div>

                {/* PNG-style cards with right-side icons using Iconify */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {[
                    {name:"MRI Scan", desc:"Detailed soft tissue imaging", icon:"mdi:brain"},
                    {name:"CT Scan", desc:"Cross-sectional imaging", icon:"mdi:radiology-box"},
                    {name:"Ultrasound", desc:"Real-time imaging", icon:"mdi:ultrasound"},
                    {name:"ECG Scan", desc:"Heart rhythm analysis", icon:"mdi:heart-pulse"},
                    {name:"PET Scan", desc:"Metabolic activity", icon:"mdi:radioactive"},
                    {name:"X-Ray", desc:"Bone & organ imaging", icon:"mdi:skeleton"},
                    {name:"TMT Scan", desc:"Cardiac stress test", icon:"mdi:chart-timeline"},
                    {name:"ECHO Scan", desc:"Heart function assessment", icon:"mdi:monitor-heart"}
                  ]
                  .filter((item, i) => {
                    // Show first 4 cards unless showAllScans is true
                    return showAllScans || i < 4;
                  })
                  .map((item, i) => (
                    <div
                      key={i}
                      className="relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden min-h-[140px] sm:min-h-[160px]"
                    >
                      {/* right-side circular icon - responsive sizing */}
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-lg">
                        <Icon icon={item.icon} className="text-white" width={16} height={16} />
                      </div>

                      <div className="pr-6 sm:pr-8 flex flex-col h-full justify-between">
                        <div>
                          <h5 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-900 leading-relaxed">{item.name}</h5>
                          <p className="text-xs text-gray-500 mb-3 sm:mb-4">{item.desc}</p>
                        </div>
                        <button className="text-xs font-bold text-teal-600 px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-teal-200 hover:bg-teal-600 hover:text-white transition w-full sm:w-auto min-h-[36px] flex items-center justify-center">
                          BOOK SCAN
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Quick Actions
          <div className="bg-linear-to-r from-teal-600 to-cyan-600 rounded-3xl p-8 text-center">
            <h4 className="text-2xl font-bold text-white mb-4">Need Immediate Medical Assistance?</h4>
            <p className="text-blue-100 mb-6">Get instant access to our medical services with just a few clicks</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book-appointment" className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105">
                <Calendar className="w-4 h-4" />
                Book Appointment
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-teal-600 transition-all duration-300">
                <FileText className="w-4 h-4" />
                View All Services
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-all duration-300 hover:scale-105">
                <PhoneCall className="w-4 h-4" />
                Emergency Contact
              </Link>
            </div>
          </div> */}
        </div>
      </section>

      {/* Healthcare Platform Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              One platform for all your healthcare needs
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
              Whether you need a routine check-up or specialized treatment, our comprehensive healthcare platform provides convenient access to quality medical services.
            </p>
          </div>
          
          <FeatureGrid features={platformFeatures} />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <Testimonials />
        </div>
      </section>

      {/* CTA */}
      
      

      {/* FOOTER */}
      <Footer />
      </div>
    </>
  );
}
