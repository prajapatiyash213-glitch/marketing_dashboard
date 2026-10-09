import React, { useState } from 'react';

// Sample default leads for native inline rendering
const INITIAL_LEADS = [
  {
    id: '1',
    company: 'Vertex',
    email: 'support@vertex.com',
    brand: 'Tecnoprism',
    owner: 'Pinali Timba',
    leadDate: '2026-09-30',
    leadSource: 'Outbound',
    leadStage: 'Discovery',
    dateOfConnect: '',
    comments: 'Closed annual subscription contract.',
    followup2Date: '',
    followup2Comments: '',
    leadStatus: 'New'
  },
  {
    id: '2',
    company: 'Globex',
    email: 'sales@globex.com',
    brand: 'AutomationCOE',
    owner: 'Shivam Prajapati',
    leadDate: '2026-09-30',
    leadSource: 'Inbound - Drop-Offs',
    leadStage: 'Qualified',
    dateOfConnect: '',
    comments: 'Inbound lead from LinkedIn campaign.',
    followup2Date: '',
    followup2Comments: '',
    leadStatus: 'New'
  },
  {
    id: '3',
    company: 'Cyberdyne',
    email: 'info@cyberdyne.org',
    brand: 'Tecnoprism',
    owner: 'Shivam Prajapati',
    leadDate: '2026-09-30',
    leadSource: 'Events - CFO',
    leadStage: 'Discovery',
    dateOfConnect: '',
    comments: 'Discussing tier 2 discount.',
    followup2Date: '',
    followup2Comments: '',
    leadStatus: 'Attempted to Contact'
  }
];

export function SalesTeamView() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // New Lead Form State
  const [form, setForm] = useState({
    email: '',
    company: '',
    brand: 'Tecnoprism',
    owner: 'Pinali Timba',
    leadDate: new Date().toISOString().split('T')[0],
    leadSource: 'Inbound - Referral',
    leadStage: 'Discovery',
    dateOfConnect: '',
    comments: '',
    followup2Date: '',
    followup2Comments: '',
    leadStatus: 'New'
  });

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!form.email) return;
    const newLead = {
      id: String(Date.now()),
      ...form,
      company: form.company.trim() || form.email.split('@')[0]
    };
    setLeads([newLead, ...leads]);
    setShowAddModal(false);
    setForm({
      email: '',
      company: '',
      brand: 'Tecnoprism',
      owner: 'Pinali Timba',
      leadDate: new Date().toISOString().split('T')[0],
      leadSource: 'Inbound - Referral',
      leadStage: 'Discovery',
      dateOfConnect: '',
      comments: '',
      followup2Date: '',
      followup2Comments: '',
      leadStatus: 'New'
    });
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.email.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.comments.toLowerCase().includes(q);
    const matchOwner = ownerFilter === 'all' || l.owner === ownerFilter;
    const matchBrand = brandFilter === 'all' || l.brand === brandFilter;
    const matchSource = sourceFilter === 'all' || l.leadSource === sourceFilter;
    const matchStatus = statusFilter === 'all' || l.leadStatus === statusFilter;
    return matchSearch && matchOwner && matchBrand && matchSource && matchStatus;
  });

  // Stage Distribution Counts
  const stages = [
    { label: 'Discovery', count: leads.filter(l => l.leadStage === 'Discovery').length, color: 'bg-slate-600' },
    { label: 'Qualified', count: leads.filter(l => l.leadStage === 'Qualified').length, color: 'bg-sky-500' },
    { label: 'Opportunity', count: leads.filter(l => l.leadStage === 'Opportunity').length, color: 'bg-blue-600' },
    { label: 'Pilot/POC', count: leads.filter(l => l.leadStage === 'Pilot/POC').length, color: 'bg-indigo-600' },
    { label: 'Proposal', count: leads.filter(l => l.leadStage === 'Proposal').length, color: 'bg-amber-500' },
    { label: 'Value Negotiation', count: leads.filter(l => l.leadStage === 'Value Negotiation').length, color: 'bg-pink-600' },
    { label: 'Closed Lost', count: leads.filter(l => l.leadStage === 'Closed Lost').length, color: 'bg-slate-400' },
    { label: 'Closed Won', count: leads.filter(l => l.leadStage === 'Closed Won').length, color: 'bg-emerald-500' },
    { label: 'Client', count: leads.filter(l => l.leadStage === 'Client').length, color: 'bg-emerald-700' }
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Embedded Header notice + Live iFrame fallback option */}
      <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🎯
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Sales Pipeline & Team Management</h3>
            <p className="text-xs text-slate-500">Live synchronization with central Sales CRM app</p>
          </div>
        </div>
        <a
          href="https://sales-hazel-ten.vercel.app/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-all"
        >
          Open Live Vercel App ↗
        </a>
      </div>

      <div className="space-y-6">
          {/* 4 Summary KPI Header Cards (Exact Image 2 Match) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Pipeline Status */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-90">
                <span>Pipeline Status</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Total Pipeline</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold">{leads.length}</div>
              <div className="mt-1 text-xs font-medium opacity-95">{leads.length} Active Leads</div>
            </div>

            {/* Card 2: In Progress */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-90">
                <span>In Progress</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Active Stages</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold">1</div>
              <div className="mt-1 text-xs font-medium opacity-95">Meeting & Proposals</div>
            </div>

            {/* Card 3: Closed Won */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-90">
                <span>Closed Won</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Conversion</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold">0</div>
              <div className="mt-1 text-xs font-medium opacity-95">0% Win Rate</div>
            </div>

            {/* Card 4: Follow-ups Overdue */}
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-90">
                <span>Follow-ups Overdue</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Alerts</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold">0</div>
              <div className="mt-1 text-xs font-medium opacity-95">Action Required</div>
            </div>
          </div>

          {/* Section Header & Stage Breakdown Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Whole team pipeline <span className="text-slate-500 font-normal">({leads.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Tap a stage to filter the list</span>
            </div>

            {/* Stage Colored Bar */}
            <div className="grid grid-cols-9 rounded-xl overflow-hidden text-white text-[11px] font-bold shadow-xs">
              {stages.map(s => (
                <div key={s.label} className={`${s.color} p-2.5 flex flex-col justify-between border-r border-white/20 last:border-0`}>
                  <div className="text-base font-extrabold">{s.count}</div>
                  <div className="text-[10px] font-medium truncate">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {/* List / Grid Toggle */}
              <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    viewMode === 'list' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Grid
                </button>
              </div>

              {/* Search Box */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search email, company or comments"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />

              {/* Dropdowns */}
              <select
                value={ownerFilter}
                onChange={e => setOwnerFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="all">All members</option>
                <option value="Pinali Timba">Pinali Timba</option>
                <option value="Shivam Prajapati">Shivam Prajapati</option>
              </select>

              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="all">All brands</option>
                <option value="Tecnoprism">Tecnoprism</option>
                <option value="AutomationCOE">AutomationCOE</option>
              </select>

              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="all">All sources</option>
                <option value="Outbound">Outbound</option>
                <option value="Inbound - Referral">Inbound - Referral</option>
                <option value="Inbound - Drop-Offs">Inbound - Drop-Offs</option>
                <option value="Events - CFO">Events - CFO</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="New">New</option>
                <option value="Attempted to Contact">Attempted to Contact</option>
                <option value="In Progress">In Progress</option>
                <option value="Postponed">Postponed</option>
              </select>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50">
                Overdue follow-ups (0)
              </button>
              <button className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50">
                Export CSV
              </button>
              <button className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50">
                📥 Import Excel / CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                + Add lead
              </button>
            </div>
          </div>

          {/* Lead Table (Exact Image 2 Match) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Ownership</th>
                    <th className="py-3 px-4">Lead Date</th>
                    <th className="py-3 px-4">Lead Source</th>
                    <th className="py-3 px-4">Lead Stage</th>
                    <th className="py-3 px-4">Date of Connect</th>
                    <th className="py-3 px-4">Comments</th>
                    <th className="py-3 px-4">Follow-up 2 Date</th>
                    <th className="py-3 px-4">Comments</th>
                    <th className="py-3 px-4">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3 px-4 font-bold text-slate-800">{l.company}</td>
                      <td className="py-3 px-4 text-slate-600">{l.brand}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{l.owner}</td>
                      <td className="py-3 px-4 text-slate-500">{l.leadDate}</td>
                      <td className="py-3 px-4 text-slate-600">{l.leadSource}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                          {l.leadStage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{l.dateOfConnect || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.comments || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{l.followup2Date || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.followup2Comments || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          l.leadStatus === 'New' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {l.leadStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Add Lead Modal (Exact Image 3 Match) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">Add lead</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateLead} className="space-y-4 text-xs text-slate-700">
              {/* Section 1: Lead Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-xs">Lead details</h3>

                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Brand</label>
                    <select
                      value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                    >
                      <option value="Tecnoprism">Tecnoprism</option>
                      <option value="AutomationCOE">AutomationCOE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Ownership</label>
                    <select
                      value={form.owner}
                      onChange={e => setForm({ ...form, owner: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                    >
                      <option value="Pinali Timba">Pinali Timba</option>
                      <option value="Shivam Prajapati">Shivam Prajapati</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Lead Date</label>
                    <input
                      type="date"
                      value={form.leadDate}
                      onChange={e => setForm({ ...form, leadDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Lead Source</label>
                    <select
                      value={form.leadSource}
                      onChange={e => setForm({ ...form, leadSource: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                    >
                      <option value="Inbound - Referral">Inbound - Referral</option>
                      <option value="Inbound - Drop-Offs">Inbound - Drop-Offs</option>
                      <option value="Outbound">Outbound</option>
                      <option value="Events - CFO">Events - CFO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Lead Stage</label>
                    <select
                      value={form.leadStage}
                      onChange={e => setForm({ ...form, leadStage: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Opportunity">Opportunity</option>
                      <option value="Pilot/POC">Pilot/POC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: First Connect */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 text-xs">First connect</h3>
                <div>
                  <label className="block font-medium mb-1">Date of Connect</label>
                  <input
                    type="date"
                    value={form.dateOfConnect}
                    onChange={e => setForm({ ...form, dateOfConnect: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Comments</label>
                  <textarea
                    rows={2}
                    value={form.comments}
                    onChange={e => setForm({ ...form, comments: e.target.value })}
                    placeholder="What was discussed on the first call or meeting"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Section 3: Follow-up 2 */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 text-xs">Follow-up 2</h3>
                <div>
                  <label className="block font-medium mb-1">Follow-up 2 Date</label>
                  <input
                    type="date"
                    value={form.followup2Date}
                    onChange={e => setForm({ ...form, followup2Date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Comments</label>
                  <textarea
                    rows={2}
                    value={form.followup2Comments}
                    onChange={e => setForm({ ...form, followup2Comments: e.target.value })}
                    placeholder="Notes from the second follow-up"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Section 4: Outcome */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 text-xs">Outcome</h3>
                <div>
                  <label className="block font-medium mb-1">Lead Status</label>
                  <select
                    value={form.leadStatus}
                    onChange={e => setForm({ ...form, leadStatus: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                  >
                    <option value="New">New</option>
                    <option value="Attempted to Contact">Attempted to Contact</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition-all text-xs"
                >
                  Add lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
