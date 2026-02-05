"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  HeartPulse,
  Activity,
  Microscope,
  Award,
  Brain,
  Baby,
  Ambulance,
  Syringe,
  Bone,
  Smile,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function Services() {
  const services = [
    {
      title: "General Consultation",
      desc: "Our experienced physicians provide accurate diagnosis and personalized treatment plans.",
      icon: <Stethoscope className="w-10 h-10 text-cyan-600" />,
    },
    {
      title: "Cardiology",
      desc: "Complete heart checkups, ECG, ECHO, blood pressure management & expert cardiac care.",
      icon: <HeartPulse className="w-10 h-10 text-red-500" />,
    },
    {
      title: "Neurology",
      desc: "Specialized care for brain, spine, nerves & neurological disorders.",
      icon: <Brain className="w-10 h-10 text-purple-600" />,
    },
    {
      title: "Pediatrics",
      desc: "Quality care for infants, children & adolescents by trusted pediatricians.",
      icon: <Baby className="w-10 h-10 text-pink-500" />,
    },
    {
      title: "Orthopedics",
      desc: "Bone, joint & muscle treatments including fractures, arthritis & surgeries.",
      icon: <Bone className="w-10 h-10 text-orange-600" />,
    },
    {
      title: "Dermatology",
      desc: "Skin, hair & nail treatments including acne, rashes, pigmentation & more.",
      icon: <Activity className="w-10 h-10 text-emerald-600" />,
    },
    {
      title: "Dental Care",
      desc: "Complete dental care including cleaning, fillings, braces & tooth extractions.",
      icon: <Smile className="w-10 h-10 text-yellow-500" />,
    },
    {
      title: "Laboratory Services",
      desc: "Fast and accurate lab tests including blood tests, urine tests & pathology.",
      icon: <Microscope className="w-10 h-10 text-purple-600" />,
    },
    {
      title: "Vaccination",
      desc: "Immunization for kids & adults including routine vaccines & boosters.",
      icon: <Syringe className="w-10 h-10 text-blue-600" />,
    },
    {
      title: "Emergency Services",
      desc: "24/7 emergency care with quick response & life-saving medical support.",
      icon: <Ambulance className="w-10 h-10 text-red-600" />,
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-white -mt-20 pt-36 md:pt-40 pb-20">
        {/* HERO SECTION */}
        <section className="text-center px-4 sm:px-6 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cyan-700">
            Our Medical Services
          </h1>
          <p className="text-gray-600 mt-4 text-sm md:text-base px-2">
            Explore our wide range of healthcare services designed to keep you and
            your family healthy.
          </p>
        </section>

        {/* SERVICES GRID */}
        <section className="mt-12 sm:mt-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl border border-gray-100 transition group hover:-translate-y-1"
              >
                <div className="mb-4">{service.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>

                <button className="mt-4 text-cyan-600 font-semibold flex items-center gap-2 text-sm group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="mt-16 sm:mt-20 px-4 sm:px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-700 mb-4">
              Why Choose RMDocto?
            </h2>
            <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
              We provide world-class healthcare with a focus on patient
              satisfaction and expert medical guidance.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">
                  Experienced and certified doctors
                </p>
              </li>

              <li className="flex items-start gap-3">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">
                  Advanced medical equipment
                </p>
              </li>

              <li className="flex items-start gap-3">
                <Ambulance className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">
                  24/7 emergency care and support
                </p>
              </li>

              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">
                  Trusted by thousands of patients
                </p>
              </li>
            </ul>
          </div>

          {/* IMAGE */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl order-1 md:order-2">
            <Image
              src="/d.jpg"
              alt="Doctors"
              width={600}
              height={500}
              className="w-full h-64 sm:h-80 md:h-auto object-cover"
            />
          </div>
        </section>

        {/* CTA SECTION */}
        {/* <section className="mt-16 sm:mt-20 text-center px-4 sm:px-6">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Ready to Consult with Our Experts?
          </h3>
          <p className="text-gray-600 mt-2 mb-6 text-sm sm:text-base px-2">
            Book an appointment today and get the best treatment for your
            health.
          </p>
          <Link
            href="/book-appointment"
            className="inline-flex items-center gap-2 bg-cyan-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-cyan-700 transition shadow-lg text-sm sm:text-base"
          >
            Book Appointment
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </section> */}
      </div>
      <Footer />
    </>
  );
}
