'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Copy, Edit2, Trash2, Globe, FileText } from 'lucide-react';
import { Form } from '@/lib/types';
import { deleteForm, duplicateForm } from '@/lib/api';
import toast from 'react-hot-toast';

interface FormCardProps {
  form: Form;
  onUpdate: () => void;
}

export function FormCard({ form, onUpdate }: FormCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      await duplicateForm(form.id);
      toast.success('Form duplicated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to duplicate form');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      await deleteForm(form.id);
      toast.success('Form deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete form');
    }
  };

  return (
    <div 
      onClick={() => router.push(`/forms/${form.id}`)}
      className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative group flex flex-col h-48"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-bold text-[#191919] truncate">{form.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              form.status === 'published' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {form.status === 'published' ? <Globe className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {form.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        
        <div className="absolute right-4 top-4" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-[#E5E5E5] rounded-md shadow-lg z-10 py-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/forms/${form.id}`);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={handleDuplicate}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button 
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto flex justify-between items-center text-sm text-[#717171]">
        <span>{form.response_count} responses</span>
        <span>{new Date(form.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
