'use client';

import { crossTabBus } from '@/libs/crossTabEvent';
import { useState, useEffect, useRef } from 'react';

export interface Prize {
  name: string;
  maxWinners: number;
}

export default function HadiahPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [name, setName] = useState('');
  const [maxWinners, setMaxWinners] = useState<number>(1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingMax, setEditingMax] = useState<number>(1);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPrizes = localStorage.getItem('doorprize.prizes');
      setPrizes(savedPrizes ? JSON.parse(savedPrizes) : []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('doorprize.prizes', JSON.stringify(prizes));
    crossTabBus.emit('prize:updated', prizes);
  }, [prizes]);

  useEffect(() => {
    if (editingIndex !== null) editInputRef.current?.focus();
  }, [editingIndex]);

  const handleAddPrize = () => {
    if (!name.trim()) return;
    setPrizes([...prizes, { name: name.trim(), maxWinners: Math.max(1, maxWinners) }]);
    setName('');
    setMaxWinners(1);
  };

  const handleDeletePrize = (index: number) => {
    if (!confirm(`Hapus hadiah "${prizes[index].name}"?`)) return;
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingName(prizes[index].name);
    setEditingMax(prizes[index].maxWinners ?? 1);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!editingName.trim()) return;
    const updated = [...prizes];
    updated[editingIndex] = { name: editingName.trim(), maxWinners: Math.max(1, editingMax) };
    setPrizes(updated);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName('');
    setEditingMax(1);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return; }
    const updated = [...prizes];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setPrizes(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  return (
    <div className="p-4 w-3/4 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Input Hadiah</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); handleAddPrize(); }}
        className="mb-4 flex gap-2 items-end"
      >
        <div className="flex flex-col flex-1">
          <label className="text-gray-400 text-xs mb-1">Nama Hadiah</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama hadiah..."
            required
            className="border rounded py-2 px-3"
          />
        </div>
        <div className="flex flex-col w-32">
          <label className="text-gray-400 text-xs mb-1">Maks. Pemenang</label>
          <input
            type="number"
            min={1}
            value={maxWinners}
            onChange={(e) => setMaxWinners(Math.max(1, parseInt(e.target.value) || 1))}
            className="border rounded py-2 px-3 text-center"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 h-fit">
          Tambah
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Daftar Hadiah</h2>
      <p className="text-gray-400 text-sm mb-2">☰ Drag baris untuk mengubah urutan</p>
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr className="bg-gray-900">
            <th className="px-2 py-2 w-8"></th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">No.</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Nama Hadiah</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Maks. Pemenang</th>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-gray-700 divide-y divide-gray-700">
          {prizes.map((prize, index) => (
            <tr
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${dragIndex === index ? 'opacity-40' : 'opacity-100'} ${
                dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-yellow-400' : ''
              }`}
            >
              <td className="px-2 py-2 text-gray-400 cursor-grab active:cursor-grabbing select-none text-lg">☰</td>
              <td className="px-2 py-2 text-sm text-gray-100">{index + 1}</td>

              {/* Nama */}
              <td className="px-2 py-2 text-sm text-gray-100">
                {editingIndex === index ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                    className="border rounded py-1 px-2 bg-gray-800 text-white w-full"
                  />
                ) : (
                  <span>{prize.name}</span>
                )}
              </td>

              {/* Maks. Pemenang */}
              <td className="px-2 py-2 text-sm text-gray-100 text-center">
                {editingIndex === index ? (
                  <input
                    type="number"
                    min={1}
                    value={editingMax}
                    onChange={(e) => setEditingMax(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border rounded py-1 px-2 bg-gray-800 text-white w-20 text-center"
                  />
                ) : (
                  <span>{prize.maxWinners ?? 1}</span>
                )}
              </td>

              {/* Aksi */}
              <td className="px-2 py-2 text-sm text-gray-100">
                {editingIndex === index ? (
                  <div className="flex gap-1">
                    <button onClick={handleSaveEdit} className="bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-500">✓ Simpan</button>
                    <button onClick={handleCancelEdit} className="bg-gray-500 text-white py-1 px-2 rounded text-xs hover:bg-gray-400">✕ Batal</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleStartEdit(index)} className="bg-yellow-500 text-black py-1 px-2 rounded text-xs hover:bg-yellow-400">✏️ Edit</button>
                    <button onClick={() => handleDeletePrize(index)} className="bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-400">🗑️ Hapus</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {prizes.length === 0 && (
            <tr><td colSpan={5} className="px-2 py-4 text-center text-gray-400">Belum ada hadiah</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}