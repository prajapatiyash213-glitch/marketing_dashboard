import React, { useState } from 'react';

export const SOURCES_OPTIONS = [
  "Inbound - Referral",
  "Inbound - Forms",
  "Inbound - Visitors",
  "Outbound - Cold",
  "Inbound - Drop-Offs",
  "Events - Imagine",
  "Events - CFO",
  "Outbound"
];

export const STATUSES_OPTIONS = [
  "New",
  "Attempted to Contact",
  "Contacted",
  "Demo Scheduled",
  "Prospect (Meeting/Demo done)",
  "Junk Lead",
  "Postponed",
  "Nurture",
  "Opportunity"
];

export const STAGES_OPTIONS = [
  "Discovery",
  "Qualified",
  "Opportunity",
  "Pilot/POC",
  "Proposal",
  "Value Negotiation",
  "Closed Lost",
  "Closed Won",
  "Client"
];

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
      {/* Top Notice Header */}
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
          Open Central CRM ↗
        </a>
      </div>

      <div className="space-y-6">
        {/* 4 Summary KPI Header Cards */}
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
            <div className="mt-1 text-xs font-medium opacity-95">₹0.00 Win Ratio</div>
          </div>

          {/* Card 4: Follow-ups Overdue */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-90">
              <span>Follow-ups Overdue</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Action Needed</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold">0</div>
            <div className="mt-1 text-xs font-medium opacity-95">0 Pending Action Items</div>
          </div>
        </div>

        {/* Whole Team Pipeline Header + Stage Breakdown Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Whole team pipeline <span className="text-slate-400 font-normal">({leads.length})</span>
            </h3>
          </div>

          {/* Multi-segment Stage Progress Bar */}
          <div className="h-9 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
            {stages.map((st, i) => (
              <div
                key={i}
                className={`${st.color} flex items-center justify-center text-white font-bold text-xs transition-all hover:opacity-90 cursor-pointer`}
                style={{ flex: st.count > 0 ? st.count : 0.8 }}
                title={`${st.label}: ${st.count}`}
              >
                {st.count > 0 ? `${st.count} ${st.label}` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search email, company or comments"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="all">All members</option>
              <option value="Pinali Timba">Pinali Timba</option>
              <option value="Shivam Prajapati">Shivam Prajapati</option>
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="all">All brands</option>
              <option value="Tecnoprism">Tecnoprism</option>
              <option value="AutomationCOE">AutomationCOE</option>
            </select>

            {/* Source Filter (Exact match with Image 1) */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="all">All sources</option>
              {SOURCES_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Status Filter (Exact match with Image 2) */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="all">All statuses</option>
              {STATUSES_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
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
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              + Add lead
            </button>
          </div>
        </div>

        {/* Lead Table (Exact 12-column match from screenshots) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">COMPANY</th>
                  <th className="py-3 px-4">BRAND</th>
                  <th className="py-3 px-4">OWNERSHIP</th>
                  <th className="py-3 px-4">LEAD DATE</th>
                  <th className="py-3 px-4">LEAD SOURCE</th>
                  <th className="py-3 px-4">LEAD STAGE</th>
                  <th className="py-3 px-4">DATE OF CONNECT</th>
                  <th className="py-3 px-4">COMMENTS</th>
                  <th className="py-3 px-4">FOLLOW-UP 2 DATE</th>
                  <th className="py-3 px-4">COMMENTS</th>
                  <th className="py-3 px-4">LEAD STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLeads.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* EMAIL */}
                    <td className="py-3.5 px-4 text-slate-600 font-normal">
                      {l.email}
                    </td>

                    {/* COMPANY */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {l.company}
                    </td>

                    {/* BRAND */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {l.brand}
                    </td>

                    {/* OWNERSHIP (Interactive pill dropdown like image) */}
                    <td className="py-3.5 px-4">
                      <select
                        value={l.owner}
                        onChange={(e) => {
                          const updatedOwner = e.target.value;
                          setLeads(leads.map(item => item.id === l.id ? { ...item, owner: updatedOwner } : item));
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="Yash Prajapati">Yash Prajapati</option>
                        <option value="Pinali Timba">Pinali Timba</option>
                        <option value="Shivam Prajapati">Shivam Prajapati</option>
                      </select>
                    </td>

                    {/* LEAD DATE */}
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-tight">
                      <div>30</div>
                      <div>Sep</div>
                      <div>2026</div>
                    </td>

                    {/* LEAD SOURCE */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {l.leadSource}
                    </td>

                    {/* LEAD STAGE */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          l.leadStage === 'Qualified' ? 'bg-sky-500' :
                          l.leadStage === 'Discovery' ? 'bg-slate-500' :
                          l.leadStage === 'Closed Won' ? 'bg-emerald-500' : 'bg-blue-600'
                        }`} />
                        {l.leadStage}
                      </span>
                    </td>

                    {/* DATE OF CONNECT */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.dateOfConnect || '—'}
                    </td>

                    {/* COMMENTS (First Connect) */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-normal max-w-xs leading-snug">
                      {l.comments || '—'}
                    </td>

                    {/* FOLLOW-UP 2 DATE */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.followup2Date || '—'}
                    </td>

                    {/* COMMENTS (Follow-Up 2) */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-normal max-w-xs leading-snug">
                      {l.followup2Comments || '—'}
                    </td>

                    {/* LEAD STATUS */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        l.leadStatus === 'New' ? 'bg-sky-100 text-sky-700' :
                        l.leadStatus === 'Attempted to Contact' ? 'bg-amber-100 text-amber-800' :
                        l.leadStatus === 'Contacted' ? 'bg-indigo-100 text-indigo-700' :
                        l.leadStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-800'
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

      {/* Add Lead Right Slide-Over Drawer (Exact Image 4 Match) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Semi-transparent Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAddModal(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Add lead</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleCreateLead} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
                {/* Lead details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Lead details</h3>

                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Company Name</label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Brand</label>
                      <select
                        value={form.brand}
                        onChange={e => setForm({ ...form, brand: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                      >
                        <option value="Tecnoprism">Tecnoprism</option>
                        <option value="AutomationCOE">AutomationCOE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Ownership</label>
                      <select
                        value={form.owner}
                        onChange={e => setForm({ ...form, owner: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                      >
                        <option value="Pinali Timba">Pinali Timba</option>
                        <option value="Shivam Prajapati">Shivam Prajapati</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Lead Date</label>
                      <input
                        type="date"
                        value={form.leadDate}
                        onChange={e => setForm({ ...form, leadDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Lead Source</label>
                      <select
                        value={form.leadSource}
                        onChange={e => setForm({ ...form, leadSource: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                      >
                        {SOURCES_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1.5 text-slate-600">Lead Stage</label>
                      <select
                        value={form.leadStage}
                        onChange={e => setForm({ ...form, leadStage: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                      >
                        {STAGES_OPTIONS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* First connect */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">First connect</h3>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Date of Connect</label>
                    <input
                      type="date"
                      value={form.dateOfConnect}
                      onChange={e => setForm({ ...form, dateOfConnect: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Comments</label>
                    <textarea
                      rows={3}
                      value={form.comments}
                      onChange={e => setForm({ ...form, comments: e.target.value })}
                      placeholder="What was discussed on the first call or meeting"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Follow-up 2 */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Follow-up 2</h3>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Follow-up 2 Date</label>
                    <input
                      type="date"
                      value={form.followup2Date}
                      onChange={e => setForm({ ...form, followup2Date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Comments</label>
                    <textarea
                      rows={3}
                      value={form.followup2Comments}
                      onChange={e => setForm({ ...form, followup2Comments: e.target.value })}
                      placeholder="Notes from the second follow-up"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Outcome */}
                <div className="space-y-4 pt-2 border-t border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Outcome</h3>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-600">Lead Status</label>
                    <select
                      value={form.leadStatus}
                      onChange={e => setForm({ ...form, leadStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs"
                    >
                      {STATUSES_OPTIONS.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Drawer Sticky Action Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 pt-4 pb-2 flex items-center justify-end gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition-all text-xs cursor-pointer"
                  >
                    Add lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
