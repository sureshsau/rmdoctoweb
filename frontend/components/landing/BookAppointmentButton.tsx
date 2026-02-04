'use client';
import Link from 'next/link';

interface BookAppointmentButtonProps {
  variant?: 'landing' | 'navbar' | 'mobile';
  className?: string;
}

const BookAppointmentButton = ({ 
  variant = 'landing', 
  className = '' 
}: BookAppointmentButtonProps) => {
  const baseStyles = "text-center rounded-full font-semibold text-white transition";
  
  const variants = {
    landing: "px-8 py-3 bg-cyan-600 shadow-md hover:bg-cyan-700 hover:scale-105",
    navbar: "text-sm px-5 py-2.5 bg-cyan-600 shadow-md hover:bg-cyan-700 hover:scale-105",
    mobile: "block w-full px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg hover:scale-105 active:scale-95 transform hover:-translate-y-1 transition-all duration-300"
  };

  const buttonClasses = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <Link
      href="/medicine-store"
      className={buttonClasses}
    >
      Buy Medicine
    </Link>
  );
};

export default BookAppointmentButton;