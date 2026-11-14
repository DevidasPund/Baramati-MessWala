import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Baramati Messwala</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Serving the authentic taste of home in Baramati. Fresh, wholesome Maharashtrian meals with unmatched hygiene and nutrition for students and working professionals.
            </p>
            <div className="pt-2 text-xs text-emerald-400 font-semibold tracking-wide">
              Tagline: Manage Your Mess, The Smart Way!
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Our Mess</Link></li>
              <li><Link to="/menu" className="hover:text-emerald-400 transition-colors">Today's & Weekly Menu</Link></li>
              <li><Link to="/plans" className="hover:text-emerald-400 transition-colors">Subscription Plans</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact & Directions</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Customer & Staff Login</Link></li>
            </ul>
          </div>

          {/* Meal Timings */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Service Timings</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Breakfast</div>
                  <div className="text-xs text-slate-400">07:30 AM – 10:00 AM</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Lunch</div>
                  <div className="text-xs text-slate-400">12:00 PM – 03:00 PM</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Dinner</div>
                  <div className="text-xs text-slate-400">07:30 PM – 10:30 PM</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Visit Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  Shriram Chowk, Pipeline Road, Ahilyanagar, Maharashtra, India
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+919209184035" className="text-xs text-slate-300 hover:text-emerald-400">
                  +91 92091 84035
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:contact@baramatimesswala.com" className="text-xs text-slate-300 hover:text-emerald-400">
                  contact@baramatimesswala.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Baramati Messwala. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>MessMate Platform Architected & Developed with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span className="font-semibold text-emerald-400">by Devidas Pund</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
