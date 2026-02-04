'use client';
import Image from "next/image";
import Button from "@/components/Button";
import Footer from "@/components/layout/Footer";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Calendar,
  Shield,
  Users,
  Award,
  ArrowRight,
  Building,
  Stethoscope,
  HeartHandshake,
  Navigation
} from 'lucide-react';
import { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    appointmentType: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You can add your form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      appointmentType: ''
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      
      {/* Hero Section */}
      <section className="pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Contact <span className="bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">RMDocto</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;re here to help you with all your healthcare needs. Get in touch with our friendly team 
              for appointments, inquiries, or emergency assistance.
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-red-800">Emergency Line</h3>
                  <p className="text-red-600 text-xs">24/7 Available</p>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-800 mb-1">108 / 102</p>
              <p className="text-red-600 text-xs">For immediate medical emergencies</p>
            </div>

            {/* General Contact */}
            <div className="bg-cyan-50 border border-cyan-200 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-cyan-800">General Inquiry</h3>
                  <p className="text-cyan-600 text-xs">8 AM - 6 PM</p>
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-cyan-800 mb-1">(+91) 9876543210</p>
              <p className="text-cyan-600 text-xs">For appointments & general questions</p>
            </div>

            {/* Email Contact */}
            <div className="bg-purple-50 border border-purple-200 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-purple-800">Email Support</h3>
                  <p className="text-purple-600 text-xs">24-48 hours response</p>
                </div>
              </div>
              <p className="text-sm sm:text-base font-bold text-purple-800 mb-1">info@rmdocto.in</p>
              <p className="text-purple-600 text-xs">For detailed inquiries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Send Us a Message
                </h2>
                <p className="text-gray-600">
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="appointmentType" className="block text-sm font-semibold text-gray-700 mb-1">
                      Appointment Type
                    </label>
                    <select
                      id="appointmentType"
                      name="appointmentType"
                      value={formData.appointmentType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition bg-white text-sm"
                    >
                      <option value="">Select appointment type</option>
                      <option value="general">General Consultation</option>
                      <option value="emergency">Emergency</option>
                      <option value="specialist">Specialist Consultation</option>
                      <option value="followup">Follow-up</option>
                      <option value="checkup">Health Checkup</option>
                      <option value="vaccination">Vaccination</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition text-sm"
                    placeholder="Brief subject of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition resize-none text-sm"
                    placeholder="Please describe your inquiry or message in detail..."
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  iconPosition="left"
                  className="w-full rounded-lg py-3"
                >
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Get in Touch
                </h2>
                <p className="text-gray-600">
                  Visit us, call us, or connect with us online. We&apos;re always here to help.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Our Location</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      123 Medical Center Drive,<br />
                      Health District, Mumbai - 400001<br />
                      Maharashtra, India
                    </p>
                    <button className="text-blue-600 font-semibold mt-2 flex items-center gap-1 hover:text-blue-700 transition text-sm">
                      <Navigation className="w-3 h-3" />
                      Get Directions
                    </button>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Operating Hours</h3>
                    <div className="space-y-1 text-gray-600 text-sm">
                      <p><span className="font-semibold">Monday - Friday:</span> 8:00 AM - 6:00 PM</p>
                      <p><span className="font-semibold">Saturday:</span> 9:00 AM - 4:00 PM</p>
                      <p><span className="font-semibold">Sunday:</span> 10:00 AM - 2:00 PM</p>
                      <p className="text-red-600 font-semibold">Emergency: 24/7</p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Available Services</h3>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>General Medicine</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>Cardiology</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>Orthopedics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>Pediatrics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>Emergency Care</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        <span>Lab Services</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button icon={Calendar} iconPosition="left" size="sm" variant="primary" className="rounded-lg">
                    Book Appointment
                  </Button>
                  <Button icon={MessageCircle} iconPosition="left" size="sm" variant="outline" className="rounded-lg">
                    Live Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              Find Us on Map
            </h2>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Located in the heart of the medical district for easy access
            </p>
          </div>

          {/* Responsive Google Maps Container */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl">
            <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">Interactive Map</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">Google Maps integration would go here</p>
                <button className="bg-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full hover:bg-cyan-700 transition font-semibold text-sm sm:text-base hover:scale-105 transform active:scale-95">
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    <span>View in Google Maps</span>
                  </span>
                </button>
              </div>
            </div>
            
            {/* Mobile-friendly overlay with contact info */}
            <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-lg">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-2">RMDocto Medical Center</h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">123 Medical Center Drive, Health District</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="flex items-center justify-center gap-1 bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-cyan-700 transition">
                  <Phone className="w-3 h-3" />
                  Call Now
                </button>
                <button className="flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                  <Navigation className="w-3 h-3" />
                  Directions
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Location Details */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-cyan-600" />
                <h4 className="font-semibold text-gray-900 text-sm">Address</h4>
              </div>
              <p className="text-xs text-gray-600">123 Medical Center Drive, Health District, Mumbai - 400001</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900 text-sm">Contact</h4>
              </div>
              <p className="text-xs text-gray-600">(+91) 9876543210</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900 text-sm">Hours</h4>
              </div>
              <p className="text-xs text-gray-600">Mon-Fri: 8AM-6PM | Emergency: 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Why Choose RMDocto?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the difference that quality care and commitment make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-gray-600 text-xs">150+ certified medical professionals with years of experience</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Care</h3>
              <p className="text-gray-600 text-xs">Award-winning healthcare services with 99% patient satisfaction</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Advanced Technology</h3>
              <p className="text-gray-600 text-xs">State-of-the-art medical equipment and digital health solutions</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Compassionate Care</h3>
              <p className="text-gray-600 text-xs">Patient-centered approach with empathy and understanding</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 bg-gradient-to-r from-cyan-600 to-blue-700">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Don&apos;t wait when it comes to your health. Contact us today and let our expert medical team 
              take care of you and your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button icon={Calendar} iconPosition="left" size="md" variant="primary" className="border-2 border-white text-white hover:bg-white hover:text-cyan-600">
                Book Appointment Now
              </Button>
              <Button icon={Phone} iconPosition="left" size="md" variant="primary" className="border-2 border-white text-white hover:bg-white hover:text-cyan-600">
                Call (+91) 9876543210
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