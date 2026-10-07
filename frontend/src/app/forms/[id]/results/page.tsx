'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, List, FileText, Download } from 'lucide-react';
import { Form, FormResponse, FormStats } from '@/lib/types';
import { getForm, getResponses, getFormStats } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsView } from '@/components/dashboard/StatsView';
import toast from 'react-hot-toast';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'responses' | 'statistics'>('responses');
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const formId = Number(params.id);
      
      const [formData, responsesData, statsData] = await Promise.all([
        getForm(formId),
        getResponses(formId),
        getFormStats(formId).catch(() => null)
      ]);
      
      setForm(formData);
      setResponses(responsesData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!form || responses.length === 0) {
      toast.error('No responses to export');
      return;
    }

    const headers = ['Response ID', 'Submitted At', ...form.questions.map(q => `"${q.title.replace(/"/g, '""')}"`)];
    const rows = responses.map(r => {
      const answersMap = new Map(r.answers.map(a => [a.question_id, a.value || '']));
      const rowAnswers = form.questions.map(q => {
        const val = answersMap.get(q.id) || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [r.id, `"${new Date(r.submitted_at).toISOString()}"`, ...rowAnswers].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F7F7F7]"><LoadingSpinner /></div>;
  if (!form) return <div className="p-8 text-center text-gray-500">Form not found</div>;

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <header className="h-16 border-b border-[#E5E5E5] flex items-center justify-between px-6 bg-white shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/forms/${form.id}`)} 
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#191919]">{form.title}</h1>
            <p className="text-xs text-[#717171]">{responses.length} {responses.length === 1 ? 'response' : 'responses'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {responses.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
          )}

          <div className="flex bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-4 py-1.5 text-sm font-medium rounded-sm flex items-center gap-2 transition-colors ${
                activeTab === 'responses' ? 'bg-white shadow-sm text-[#191919]' : 'text-[#717171] hover:text-[#191919]'
              }`}
            >
              <List className="w-4 h-4" /> Responses
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-4 py-1.5 text-sm font-medium rounded-sm flex items-center gap-2 transition-colors ${
                activeTab === 'statistics' ? 'bg-white shadow-sm text-[#191919]' : 'text-[#717171] hover:text-[#191919]'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Statistics
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={FileText}
              title="No responses yet"
              description="Share your form with respondents to start collecting answers."
              actionLabel="Go to Form Builder"
              onAction={() => router.push(`/forms/${form.id}`)}
            />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {activeTab === 'responses' ? (
              <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E5E5E5]">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#717171] w-1/4">Response ID</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#717171]">Submitted At</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#717171] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <React.Fragment key={response.id}>
                        <tr 
                          className="border-b border-[#E5E5E5] hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setExpandedResponse(expandedResponse === response.id ? null : response.id)}
                        >
                          <td className="px-6 py-4 font-bold text-sm text-[#191919]">#{response.id}</td>
                          <td className="px-6 py-4 text-sm text-[#717171]">
                            {new Date(response.submitted_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs text-[#4F46E5] font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
                              {expandedResponse === response.id ? 'Hide answers ▲' : 'View answers ▼'}
                            </span>
                          </td>
                        </tr>
                        {expandedResponse === response.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-8 py-6 border-b border-[#E5E5E5]">
                              <div className="space-y-4 max-w-3xl">
                                {form.questions.map((q, index) => {
                                  const answer = response.answers.find(a => a.question_id === q.id);
                                  return (
                                    <div key={q.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Question {index + 1}: {q.title}
                                      </p>
                                      <p className="text-base font-medium text-[#191919]">
                                        {answer?.value ? (
                                          answer.value
                                        ) : (
                                          <span className="text-gray-400 italic font-normal">No answer provided</span>
                                        )}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              stats ? <StatsView stats={stats} /> : <div className="text-center py-12 text-gray-400">Stats unavailable</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
