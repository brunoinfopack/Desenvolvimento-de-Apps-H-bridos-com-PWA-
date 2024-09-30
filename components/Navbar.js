'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { logout } from '../public/utils/firebase'; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOutUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo ou Nome do App */}
        <div className="text-3xl font-extrabold">
          <Link href="/home">
            <span className="hover:text-blue-200 transition duration-300">Tarefas Diarias</span>
          </Link>
        </div>
  
        {/* Menu Normal */}
        <div className="hidden md:flex space-x-8 items-center">
          {user && (
            <>
              <Link href="/home">
                <span className="hover:text-blue-200 transition duration-300">Tarefas</span>
              </Link>
              <Link href="/profile">
                <span className="hover:text-blue-200 transition duration-300">Perfil</span>
              </Link>
            </>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition duration-300"
            >
              Logout
            </button>
          ) : (
            <Link href="/">
              <span className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition duration-300">
                Login
              </span>
            </Link>
          )}
        </div>
  
        {/* Menu Hambúrguer (Mobile) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>
  
      {/* Dropdown Menu para Mobile */}
      {isOpen && (
        <div className="md:hidden bg-blue-600 p-4 space-y-2 transition-all duration-300 rounded-b-lg shadow-lg">
          {user && (
            <>
              <Link href="/home">
                <span onClick={closeMenu} className="block py-2 hover:text-blue-200 transition duration-300">Home</span>
              </Link>
              <Link href="/profile">
                <span onClick={closeMenu} className="block py-2 hover:text-blue-200 transition duration-300">Profile</span>
              </Link>
            </>
          )}
          {user ? (
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="block w-full text-left py-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 rounded-lg transition duration-300"
            >
              Logout
            </button>
          ) : (
            <Link href="/">
              <span onClick={closeMenu} className="block py-2 bg-blue-700 hover:bg-blue-500 text-white font-semibold px-4 rounded-lg transition duration-300">
                Login
              </span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
