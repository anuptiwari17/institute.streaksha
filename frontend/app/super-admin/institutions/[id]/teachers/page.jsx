'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Search, Loader } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

function TeacherRow({ teacher, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr',
      padding: '16px', borderBottom: '1px solid #E5E5E3',
      cursor: 'pointer', transition: 'all 0.2s',
      background: 'white'
    }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{teacher.name}</div>
        <div style={{ fontSize: 12, color: '#7A7167', marginTop: 4 }}>{teacher.email}</div>
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        {teacher.subjects?.length > 0 ? (
          <div>
            <div style={{ fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>Subjects: {teacher.subjects.length}</div>
            {teacher.subjects.slice(0, 2).map(s => (
              <div key={s.id} style={{ fontSize: 11 }}>{s.name}</div>
            ))}
            {teacher.subjects.length > 2 && (
              <div style={{ fontSize: 11, color: '#FF4D00', fontWeight: 600 }}>+{teacher.subjects.length - 2} more</div>
            )}
          </div>
        ) : (
          <div style={{ color: '#B91C1C' }}>No subjects assigned</div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: '#7A7167' }}>
        <div style={{ fontWeight: 600, color: '#0A0A0A' }}>Assignments</div>
        <div>{teacher.assignments?.length || 0}</div>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/users`, {
      params: { tenantId, role: 'teacher', page, limit, search }
    })
      .then(res => {
        if (res.data?.data?.users) {
          setTeachers(res.data.data.users);
          setTotal(res.data.data.total);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load teachers');
      })
      .finally(() => setLoading(false));
  }, [tenantId, page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            background: 'white', border: '1px solid #E5E5E3', borderRadius: 8, padding: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>Teachers</h1>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#7A7167' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            style={{
              width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
              borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 14,
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Teachers List */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <Skeleton h={60} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#B91C1C' }}>
              <p>{error}</p>
            </div>
          ) : teachers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <p style={{ margin: 0 }}>No teachers found</p>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr',
                padding: '12px 16px', background: '#F5F3FF', borderBottom: '1px solid #E5E5E3',
                fontWeight: 600, fontSize: 12, color: '#7A7167', textTransform: 'uppercase'
              }}>
                <div>Name</div>
                <div>Email</div>
                <div style={{ textAlign: 'right' }}>Assignments</div>
              </div>
              {/* Data Rows */}
              {teachers.map(teacher => (
                <TeacherRow
                  key={teacher.id}
                  teacher={teacher}
                  onClick={() => router.push(`/super-admin/institutions/${tenantId}/teachers/${teacher.id}`)}
                />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                background: page === 1 ? '#F5F3FF' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 500, fontSize: 13
              }}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (Math.abs(p - page) > 2 && i !== 0 && i !== totalPages - 1) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 6, border: page === p ? '1px solid #FF4D00' : '1px solid #E5E5E3',
                    background: page === p ? '#FF4D00' : 'white', color: page === p ? 'white' : '#0A0A0A',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                background: page === totalPages ? '#F5F3FF' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 500, fontSize: 13
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Page Info */}
        {!loading && teachers.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#7A7167' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} teachers
          </div>
        )}
      </div>
    </div>
  );
}
