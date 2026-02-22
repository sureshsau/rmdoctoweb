'use client';

import React from 'react';
import { cn } from '@/lib/utils';


type Item = {
  question: string;
  answer: string;
};

const Testimonials: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const items: Item[] = [
    {
      question: 'Exceptional care and attention',
      answer:
        'The doctors were incredibly patient and thorough. I felt listened to and cared for at every step of my treatment.',
    },
    {
      question: 'Smooth online booking experience',
      answer:
        'Booking an appointment was quick and easy. The reminders helped me stay on schedule, and the consultation was top-notch.',
    },
    {
      question: 'Home lab services are a game changer',
      answer:
        'Sample collection at home saved me time. Reports were delivered promptly and explained clearly by the physician.',
    },
    {
      question: 'Professional and trustworthy team',
      answer:
        'From reception to specialists, everyone was professional. I highly recommend their platform for reliable healthcare.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-8 px-4 md:px-0">
      <img
        className="max-w-sm w-full rounded-xl h-64 md:h-[405px] object-cover"
        src="/testimonial.jpeg"
        alt="Happy patient"
      />
      <div>
        <p className="text-cyan-600 text-sm font-medium">Testimonials</p>
        <h2 className="text-3xl font-semibold">What our patients say</h2>
        <p className="text-sm text-gray-600 mt-2 pb-4">
          Real experiences from patients who trust our care and services.
        </p>
        {items.map((item, index) => (
          <div
            className="border-b border-slate-200 py-4 cursor-pointer"
            key={index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">{item.question}</h3>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(
                  'transition-all duration-500 ease-in-out',
                  openIndex === index && 'rotate-180'
                )}
              >
                <path
                  d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2"
                  stroke="#1D293D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p
              className={cn(
                'text-sm text-slate-500 transition-all duration-500 ease-in-out max-w-md',
                openIndex === index
                  ? 'opacity-100 max-h-[300px] translate-y-0 pt-4'
                  : 'opacity-0 max-h-0 -translate-y-2'
              )}
            >
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
