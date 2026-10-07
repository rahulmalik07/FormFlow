'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { Form } from '@/lib/types';
import { getForms, createForm } from '@/lib/api';
import { FormCard } from '@/components/dashboard/FormCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const data = await getForms();
      setForms(data);
    } catch (error) {
      toast.error('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    try {
      setIsCreating(true);
      const newForm = await createForm({ title: 'New Form' });
      router.push(`/forms/${newForm.id}`);
    } catch (error) {
      toast.error('Failed to create form');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-[#191919]">FormFlow</h1>
        <Button onClick={handleCreateForm} isLoading={isCreating}>
          <Plus className="w-5 h-5 mr-2" /> Create Form
        </Button>
      </header>

      {isLoading ? (
        <LoadingSpinner />
      ) : forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms yet"
          description="Create your first form to start collecting responses."
          actionLabel="Create Form"
          onAction={handleCreateForm}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <FormCard key={form.id} form={form} onUpdate={fetchForms} />
          ))}
        </div>
      )}
    </div>
  );
}
