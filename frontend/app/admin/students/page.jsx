'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import {
  Search, Plus, Upload, MoreHorizontal, ChevronLeft,
  ChevronRight, X, CheckCircle, AlertTriangle, Download,
  Filter, Users, UserX
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 120, 160, 90, 90, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ height: 14, width: w, borderRadius: 6,
                         background: 'linear-gradient(90deg,#F0F0EE 25%,#E8E8E6 50%,#F0F0EE 75%)',
                         backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
        </td>
      ))}
    </tr>
  );
}

// ── Add student modal ─────────────────────────────────────────────────────────
function AddStudentModal({ open, onClose, batches, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', roll_no: '', batchName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/users/students', form);
      toast({ message: `Student ${form.name} added. Login credentials sent to their email.`, type: 'success' });
      onSuccess();
      onClose();
      setForm({ name: '', email: '', roll_no: '', batchName: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Student">
      {error && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 10,
                       padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={14} color="#E53E3E"/>
          <span style={{ fontSize: 13, color: '#C53030' }}>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name" placeholder="Priya Sharma" value={form.name} onChange={set('name')} required/>
        <Input label="Email" type="email" placeholder="priya@school.com" value={form.email} onChange={set('email')} required/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Roll No (optional)" placeholder="101" value={form.roll_no} onChange={set('roll_no')}/>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B',
                             textTransform: 'uppercase', letterSpacing: '0.06em',
                             display: 'block', marginBottom: 6 }}>
              Batch (optional)
            </label>
            <select value={form.batchName} onChange={set('batchName')} style={{
              width: '100%', background: 'white', border: '1.5px solid #E5E5E3',
              borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#0A0A0A',
              outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <option value="">No batch</option>
              {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#A3A3A0', lineHeight: 1.5 }}>
          A random password will be generated and sent to the student&#39s email automatically.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Student</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Bulk import modal ─────────────────────────────────────────────────────────
function BulkImportModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/users/bulk-import?role=student', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      if (res.data.data.success > 0) {
        toast({ message: `${res.data.data.success} students imported successfully!`, type: 'success' });
        onSuccess();
      }
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Import failed', type: 'error' });
    } finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Bulk Import Students" size="md">
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* CSV format hint */}
          <div style={{ background: '#F5F5F3', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>
              CSV format required:
            </p>
            <code style={{ fontSize: 12, color: '#6B6B6B', fontFamily: 'monospace', lineHeight: 1.8 }}>
              name, email, batch_name, roll_no<br/>
              Priya Sharma, priya@school.com, Class 11-A, 101<br/>
              Arjun Singh, arjun@school.com, Class 11-B, 102
            </code>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#FF4D00' : file ? '#16A34A' : '#E5E5E3'}`,
              borderRadius: 16, padding: '32px 24px', textAlign: 'center',
              background: dragging ? '#FFF0EB' : file ? '#F0FDF4' : '#FAFAF8',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}/>
            {file ? (
              <div>
                <CheckCircle size={28} color="#16A34A" style={{ margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>{file.name}</p>
                <p style={{ fontSize: 12, color: '#A3A3A0', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <Upload size={28} color="#A3A3A0" style={{ margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>
                  Drop your CSV here
                </p>
                <p style={{ fontSize: 13, color: '#A3A3A0' }}>or click to browse</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => { onClose(); reset(); }}>Cancel</Button>
            <Button onClick={handleImport} loading={loading} disabled={!file} icon={<Upload size={15}/>}>
              Import Students
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '20px',
                           textAlign: 'center', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#16A34A',
                             letterSpacing: '-0.04em' }}>{result.success}</div>
              <div style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>Imported</div>
            </div>
            <div style={{ background: result.failed.length ? '#FFF5F5' : '#F5F5F3',
                           borderRadius: 14, padding: '20px', textAlign: 'center',
                           border: `1px solid ${result.failed.length ? '#FED7D7' : '#E5E5E3'}` }}>
              <div style={{ fontSize: 36, fontWeight: 900,
                             color: result.failed.length ? '#EF4444' : '#A3A3A0',
                             letterSpacing: '-0.04em' }}>{result.failed.length}</div>
              <div style={{ fontSize: 13, fontWeight: 600,
                             color: result.failed.length ? '#C53030' : '#A3A3A0' }}>Failed</div>
            </div>
          </div>
          {result.failed.length > 0 && (
            <div style={{ background: '#FFF5F5', borderRadius: 12, padding: '14px',
                           maxHeight: 160, overflowY: 'auto', marginBottom: 16 }}>
              {result.failed.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: '#C53030', padding: '4px 0',
                                       borderBottom: i < result.failed.length - 1 ? '1px solid #FED7D7' : 'none' }}>
                  <strong>{f.email}</strong> — {f.reason}
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => { onClose(); reset(); }} style={{ width: '100%' }}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminStudents() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const LIMIT = 15;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role: 'student', page, limit: LIMIT,
        ...(search && { search }),
        ...(batchFilter && { batch_id: batchFilter }),
      });
      const res = await api.get(`/users?${params}`);
      setStudents(res.data.data.users);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page, search, batchFilter]);

  useEffect(() => {
    setMounted(true);
    api.get('/batches').then(r => setBatches(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchStudents, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleDeactivate = async (id, name) => {
    try {
      await api.delete(`/users/${id}`);
      toast({ message: `${name} deactivated`, type: 'success' });
      fetchStudents();
    } catch {
      toast({ message: 'Failed to deactivate', type: 'error' });
    }
    setOpenMenu(null);
  };

  return (
    <div style={{
      opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                     flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900,
                        letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: 6 }}>
            Students
          </h1>
          <p style={{ fontSize: 14, color: '#6B6B6B' }}>
            {loading ? '...' : `${total} students enrolled`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<Upload size={15}/>} onClick={() => setImportOpen(true)}>
            Bulk Import
          </Button>
          <Button icon={<Plus size={15}/>} onClick={() => setAddOpen(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color="#A3A3A0" style={{ position: 'absolute', left: 13,
                                                      top: '50%', transform: 'translateY(-50%)',
                                                      pointerEvents: 'none' }}/>
          <input placeholder="Search by name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%', background: 'white', border: '1.5px solid #E5E5E3',
              borderRadius: 12, padding: '11px 14px 11px 38px', fontSize: 14,
              outline: 'none', fontFamily: 'inherit', color: '#0A0A0A', transition: 'all 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = '#0A0A0A'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E5E3'; }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A0',
              display: 'flex', padding: 2,
            }}>
              <X size={14}/>
            </button>
          )}
        </div>

        {/* Batch filter */}
        <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
          style={{
            background: 'white', border: '1.5px solid #E5E5E3', borderRadius: 12,
            padding: '11px 14px', fontSize: 14, color: batchFilter ? '#0A0A0A' : '#A3A3A0',
            outline: 'none', fontFamily: 'inherit', cursor: 'pointer', minWidth: 140,
          }}>
          <option value="">All batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E5E3',
                     overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F0F0EE' }}>
              {['Student', 'Roll No', 'Email', 'Batch', 'Status', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: '#A3A3A0', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: '#FAFAF8',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i}/>)
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center', color: '#A3A3A0' }}>
                  <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }}/>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 }}>
                    No students found
                  </p>
                  <p style={{ fontSize: 13 }}>
                    {search ? 'Try a different search term' : 'Add your first student to get started'}
                  </p>
                </td>
              </tr>
            ) : students.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < students.length - 1 ? '1px solid #F5F5F3' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.name} size="sm"/>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#6B6B6B', fontFamily: 'monospace' }}>
                  {s.roll_no || '—'}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#6B6B6B' }}>
                  {s.email}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {s.batches?.[0] ? (
                    <Badge variant="blue">{s.batches[0].name}</Badge>
                  ) : (
                    <span style={{ fontSize: 12, color: '#C0C0BC' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <Badge variant={s.is_active ? 'green' : 'red'}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td style={{ padding: '13px 16px', position: 'relative' }}>
                  <button onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A0',
                    padding: '6px', borderRadius: 8, display: 'flex',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F3'; e.currentTarget.style.color = '#0A0A0A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A3A3A0'; }}>
                    <MoreHorizontal size={16}/>
                  </button>
                  {openMenu === s.id && (
                    <div style={{
                      position: 'absolute', right: 12, top: '100%', zIndex: 50,
                      background: 'white', border: '1px solid #E5E5E3', borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)', minWidth: 160, overflow: 'hidden',
                    }}>
                      {s.is_active && (
                        <button onClick={() => handleDeactivate(s.id, s.name)} style={{
                          width: '100%', padding: '11px 16px', textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 13, color: '#EF4444', fontWeight: 500, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 8,
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                          <UserX size={14}/> Deactivate
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                         padding: '14px 20px', borderTop: '1px solid #F5F5F3',
                         background: '#FAFAF8' }}>
            <span style={{ fontSize: 13, color: '#A3A3A0' }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E5E3',
                  background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === 1 ? 0.4 : 1, transition: 'all 0.15s',
                }}>
                <ChevronLeft size={14} color="#6B6B6B"/>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 8, border: '1px solid',
                    borderColor: page === p ? '#0A0A0A' : '#E5E5E3',
                    background: page === p ? '#0A0A0A' : 'white',
                    color: page === p ? 'white' : '#6B6B6B',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E5E3',
                  background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === totalPages ? 0.4 : 1, transition: 'all 0.15s',
                }}>
                <ChevronRight size={14} color="#6B6B6B"/>
              </button>
            </div>
          </div>
        )}
      </div>

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)}
        batches={batches} onSuccess={fetchStudents}/>
      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)}
        onSuccess={fetchStudents}/>

      {/* Close menu on outside click */}
      {openMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setOpenMenu(null)}/>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}