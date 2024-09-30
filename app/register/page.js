'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '../../public/utils/firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true); 
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const user = await signUp(email, password, name);
      console.log('Usuário registrado com sucesso:', user);
      router.push('/home');
    } catch (error) {
      setError('Erro ao registrar o usuário: ' + error.message);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordMatch(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordMatch(value === password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">Registrar</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <input
            type="text"
            placeholder="Nome"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className={`w-full border p-3 rounded-lg focus:outline-none ${passwordMatch ? 'border-gray-300' : 'border-red-500'} focus:ring-2 focus:ring-blue-500`}
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <input
            type="password"
            placeholder="Confirme a Senha"
            className={`w-full border p-3 rounded-lg focus:outline-none ${passwordMatch ? 'border-gray-300' : 'border-red-500'} focus:ring-2 focus:ring-blue-500`}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
          <button
            type="submit"
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors duration-300 ${passwordMatch ? '' : 'opacity-50 cursor-not-allowed'}`}
            disabled={!passwordMatch}
          >
            Registrar
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Register;
