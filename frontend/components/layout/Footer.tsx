import { Phone, Mail, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="grid lg:grid-cols-5 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold">RMDocto</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Your trusted healthcare partner providing quality medical services and compassionate care for you and your family.
            </p>

            <div className="mb-4">
              <h4 className="text-base font-semibold mb-3">Subscribe to our newsletter</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-700"
                />
                <button className="bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-cyan-700 transition font-semibold">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold mb-5">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="" className="hover:text-white transition">Home</a></li>
              <li><a href="/about" className="hover:text-white transition">About Us</a></li>
              <li><a href="/services" className="hover:text-white transition">Our Services</a></li>
              {/* <li><a href="#" className="hover:text-white transition">Find a Doctor</a></li> */}
              <li><a href="/book-appointment" className="hover:text-white transition">Appointments</a></li>
              <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-bold mb-5">Services</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition">Primary Care</a></li>
              <li><a href="#" className="hover:text-white transition">Telehealth</a></li>
              <li><a href="#" className="hover:text-white transition">Cardiology</a></li>
              <li><a href="#" className="hover:text-white transition">Mental Health</a></li>
              <li><a href="#" className="hover:text-white transition">Emergency Care</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-bold mb-5">Contact</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Support Line (8 AM – 6 PM)</div>
                  <div>(+91) 9876543210</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Email</div>
                  <div>info@rmdocto.in</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm text-center md:text-left">
            <p>© {new Date().getFullYear()} RMDocto. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <span className="text-gray-700">•</span>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <span className="text-gray-700">•</span>
              <a href="#" className="hover:text-white">Cookie Policy</a>
            </div>
          </div>

          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all"><Linkedin className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;