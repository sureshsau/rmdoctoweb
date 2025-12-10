'use client';
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import Footer from "@/components/layout/Footer";
import { 
  Heart, 
  Shield, 
  Award, 
  Users, 
  Clock, 
  CheckCircle2,
  Star,
  ArrowRight,
  Building,
  Stethoscope,
  Activity,
  Target
} from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      
      {/* Hero Section */}
      <section className="pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              About <span className="bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">RMDocto</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your trusted healthcare partner providing exceptional medical care with compassion and innovation.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left Content */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Leading Healthcare Excellence Since 2010
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  At RMDocto, we believe that quality healthcare should be accessible to everyone. 
                  Our state-of-the-art facilities and experienced medical professionals ensure 
                  you receive the best possible care.
                </p>
              </div>

              {/* Key Features */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Compassionate Care</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Patient-centered approach with empathy</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Technology</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Cutting-edge medical equipment</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Specialists</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Board-certified doctors</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Availability</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Round-the-clock emergency care</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="relative lg:col-span-2">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-2xl overflow-hidden shadow-lg sticky top-8">
                <Image
                  src="/d.jpg"
                  alt="Medical Professional"
                  width={400}
                  height={500}
                  className="w-full h-96 object-cover"
                />
                
                {/* Compact Statistics */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">150+</div>
                      <div className="text-xs text-gray-600">Doctors</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">4.9★</div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Mission & Vision
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Driven by our commitment to excellence and innovation in healthcare
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="relative p-8 lg:p-12 bg-gradient-to-br from-cyan-50 to-blue-100 rounded-3xl overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  To provide comprehensive, compassionate, and accessible healthcare services that improve 
                  the health and wellbeing of our community through excellence in medical care, education, 
                  and innovation.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />
                    <span className="text-gray-700">Patient-centered care approach</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />
                    <span className="text-gray-700">Continuous medical excellence</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />
                    <span className="text-gray-700">Community health improvement</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cyan-200/30 rounded-full"></div>
            </div>

            {/* Vision */}
            <div className="relative p-8 lg:p-12 bg-gradient-to-br from-purple-50 to-pink-100 rounded-3xl overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h3>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  To be the leading healthcare provider recognized for exceptional patient outcomes, 
                  innovative treatments, and setting the standard for quality medical care in our region 
                  and beyond.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-gray-700">Healthcare innovation leadership</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-gray-700">Regional healthcare excellence</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-gray-700">Advanced medical research</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-200/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Our Impact in Numbers
            </h2>
            <p className="text-gray-600">
              Trusted by thousands of patients across the region
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">250K+</div>
              <div className="text-gray-600 text-sm">Patients Served</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">150+</div>
              <div className="text-gray-600 text-sm">Medical Experts</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">25+</div>
              <div className="text-gray-600 text-sm">Departments</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">15+</div>
              <div className="text-gray-600 text-sm">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Our Core Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at RMDocto
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Value 1 */}
            <div className="group p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Compassion</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We treat every patient with empathy, kindness, and respect throughout their healthcare journey.
              </p>
            </div>

            {/* Value 2 */}
            <div className="group p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We strive for the highest standards in medical care and staying at the forefront of healthcare innovation.
              </p>
            </div>

            {/* Value 3 */}
            <div className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We maintain the highest ethical standards, being honest and transparent in all our interactions.
              </p>
            </div>

            {/* Value 4 */}
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Collaboration</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We work together as a unified team, fostering partnerships with patients and families.
              </p>
            </div>

            {/* Value 5 */}
            <div className="group p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We embrace new technologies and treatment methods to provide cutting-edge medical care.
              </p>
            </div>

            {/* Value 6 */}
            <div className="group p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Commitment</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We are dedicated to our patients' wellbeing and providing accessible, high-quality healthcare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 bg-gradient-to-r from-cyan-600 to-blue-700">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Experience Excellence in Healthcare?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied patients who trust RMDocto for their healthcare needs.
              Schedule your appointment today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book-appointment">
                <Button icon={ArrowRight} variant="primary" className="border-2 border-white text-white hover:bg-white hover:text-cyan-600">
                  Book Appointment
                </Button>
              </Link>
              <Button variant="primary" className="border-2 border-white text-white hover:bg-white hover:text-cyan-600">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}