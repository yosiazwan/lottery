'use client';

import { useState, useEffect } from 'react';

export interface Prize {
  name: string;
}

export default function HadiahPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPrizes = localStorage.getItem('doorprize.prizes');
      setPrizes(savedPrizes ? JSON.parse(savedPrizes) : []);
    }
  }, []);
  const [name, setName] = useState('');

  useEffect(() => {
    localStorage.setItem('doorprize.prizes', JSON.stringify(prizes));
  }, [prizes]);

  const handleAddPrize = () => {
    setPrizes([...prizes, { name }]);
    setName('');
  };

  const handleDeletePrize = (index: number) => {
    const newPrizes = prizes.filter((_, i) => i !== index);
    setPrizes(newPrizes);
  };

  return (
    <div className="p-4 w-1/2 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Input Hadiah</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddPrize();
        }}
        className="mb-4"
      >
        <div className="mb-2">
          <label className="block mb-1">
            Nama Hadiah:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border rounded w-full py-2 px-3"
            />
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
          Tambah Hadiah
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Daftar Hadiah</h2>
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr className="bg-gray-900">
            <th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">No.</th>
            <th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Nama Hadiah</th>
            <th scope="col" className="px-2 py-2 text-left text-md font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-gray-700 divide-y divide-gray-700">
          {prizes.map((prize, index) => (
            <tr key={index}>
              <td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{index + 1}</td>
              <td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">{prize.name}</td>
              <td className="px-2 py-2 whitespace-nowrap text-md text-gray-100">
                <button
                  onClick={() => handleDeletePrize(index)}
                  className="bg-red-500 text-white py-1 px-2 rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
