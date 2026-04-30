'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, MoreHorizontal, AlertTriangle, Layers, Users, Trash2, Pencil } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function SkeletonCard() {
  return (
    <div style={{background:'white',borderRadius:20,border:'1px solid #E5E5E3',padding:24}}>
      {[80,120,60].map((w,i)=>(
        <div key={i} style={{height:i===0?28:14,width:w,borderRadius:6,marginBottom:i<2?10:0,
          background:'linear-gradient(90deg,#F0F0EE 25%,#E8E8E6 50%,#F0F0EE 75%)',
          backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
      ))}
    </div>
  );
}

function BatchModal({ open, onClose, onSuccess, existing }) {
  const toast = useToast();
  const [form, setForm] = useState({ name:'', academic_year:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = f => e => setForm(p=>({...p,[f]:e.target.value}));

  useEffect(()=>{
    const timer = setTimeout(()=>{
      if(existing) setForm({name:existing.name,academic_year:existing.academic_year||''});
      else setForm({name:'',academic_year:''});
    },0);
    return () => clearTimeout(timer);
  },[existing]);

  const handleSubmit = async e => {
    e.preventDefault();
    if(!form.name){setError('Batch name required');return;}
    setLoading(true);setError('');
    try {
      if(existing) await api.put(`/batches/${existing.id}`,form);
      else await api.post('/batches',form);
      toast({message:existing?'Batch updated':'Batch created',type:'success'});
      onSuccess();onClose();
    } catch(err){setError(err.response?.data?.message||'Failed');}
    finally{setLoading(false);}
  };

  return (
    <Modal open={open} onClose={onClose} title={existing?'Edit Batch':'Create Batch'}>
      {error&&<div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center'}}>
        <AlertTriangle size={14} color="#E53E3E"/><span style={{fontSize:13,color:'#C53030'}}>{error}</span></div>}
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Batch Name" placeholder="Class 11-A or JEE Batch 2025" value={form.name} onChange={set('name')} required/>
        <Input label="Academic Year (optional)" placeholder="2024-25" value={form.academic_year} onChange={set('academic_year')}/>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{existing?'Update':'Create'} Batch</Button>
        </div>
      </form>
    </Modal>
  );
}

function BatchStudentsModal({ open, onClose, batch, students, allStudents, onSuccess }) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  const enrolled = new Set((batch?.students||[]).map(s=>s.id));
  const available = allStudents.filter(s=>!enrolled.has(s.id));

  const handleAdd = async () => {
    if(!selectedId) return;
    setLoading(true);
    try {
      await api.post(`/batches/${batch.id}/students`,{userId:selectedId});
      toast({message:'Student added to batch',type:'success'});
      onSuccess(); setSelectedId('');
    } catch(err){toast({message:err.response?.data?.message||'Failed',type:'error'});}
    finally{setLoading(false);}
  };

  const handleRemove = async id => {
    try {
      await api.delete(`/batches/${batch.id}/students/${id}`);
      toast({message:'Student removed',type:'success'});
      onSuccess();
    } catch{toast({message:'Failed',type:'error'});}
  };

  return (
    <Modal open={open} onClose={onClose} title={`Students — ${batch?.name||''}`} size="lg">
      <div style={{display:'flex',gap:10,marginBottom:20}}>
        <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
          style={{flex:1,background:'white',border:'1.5px solid #E5E5E3',borderRadius:12,padding:'11px 14px',fontSize:14,outline:'none',fontFamily:'inherit'}}>
          <option value="">Add a student...</option>
          {available.map(s=><option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
        </select>
        <Button onClick={handleAdd} loading={loading} disabled={!selectedId} icon={<Plus size={14}/>}>Add</Button>
      </div>
      <div style={{maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
        {(batch?.students||[]).length===0
          ?<p style={{textAlign:'center',color:'#A3A3A0',fontSize:14,padding:'24px 0'}}>No students in this batch yet</p>
          :(batch?.students||[]).map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'10px 14px',background:'#FAFAF8',borderRadius:12,border:'1px solid #F0F0EE'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'#0A0A0A'}}>{s.name}</div>
                <div style={{fontSize:12,color:'#A3A3A0'}}>{s.email}{s.roll_no?` · Roll ${s.roll_no}`:''}</div>
              </div>
              <button onClick={()=>handleRemove(s.id)} style={{background:'none',border:'none',cursor:'pointer',
                color:'#A3A3A0',padding:6,borderRadius:8,display:'flex',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#EF4444';e.currentTarget.style.background='#FFF5F5';}}
                onMouseLeave={e=>{e.currentTarget.style.color='#A3A3A0';e.currentTarget.style.background='none';}}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))
        }
      </div>
    </Modal>
  );
}

function BatchAssignmentsModal({ open, onClose, batch, assignments, subjects, teachers, onRefresh }) {
  const toast = useToast();
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setSubjectId('');
      setTeacherId('');
      setEditRow(null);
      setEditTeacherId('');
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  const sel = {
    width:'100%',background:'white',border:'1.5px solid #E5E5E3',borderRadius:12,
    padding:'11px 14px',fontSize:14,color:'#0A0A0A',outline:'none',fontFamily:'inherit',cursor:'pointer'
  };

  const handleAdd = async () => {
    if (!subjectId || !teacherId || !batch?.id) return;
    setSaving(true);
    try {
      await api.post(`/subjects/${subjectId}/assign`, { teacherId, batchId: batch.id });
      toast({ message: 'Assignment created', type: 'success' });
      setSubjectId('');
      setTeacherId('');
      onRefresh();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to create assignment', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await api.delete(`/subjects/${row.subject_id}/assignments/${row.id}`);
      toast({ message: 'Assignment removed', type: 'success' });
      onRefresh();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to remove assignment', type: 'error' });
    }
  };

  const startEdit = (row) => {
    setEditRow(row);
    setEditTeacherId(row.teacher_id || '');
  };

  const saveEdit = async () => {
    if (!editRow || !editTeacherId) return;
    setSaving(true);
    try {
      await api.patch(`/subjects/${editRow.subject_id}/assignments/${editRow.id}`, {
        teacherId: editTeacherId,
        batchId: batch.id,
      });
      toast({ message: 'Assignment updated', type: 'success' });
      setEditRow(null);
      setEditTeacherId('');
      onRefresh();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to update assignment', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assignments — ${batch?.name || ''}`} size="lg">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,marginBottom:14}}>
        <select value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} style={sel}>
          <option value="">Select subject...</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={teacherId} onChange={(e)=>setTeacherId(e.target.value)} style={sel}>
          <option value="">Select teacher...</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <Button onClick={handleAdd} loading={saving} disabled={!subjectId || !teacherId} icon={<Plus size={14}/>}>Add</Button>
      </div>

      {assignments.length === 0 ? (
        <div style={{textAlign:'center',padding:'24px 12px',border:'1px dashed #E5E5E3',borderRadius:14,color:'#A3A3A0',fontSize:14}}>
          No teacher-subject assignments for this batch.
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:340,overflowY:'auto'}}>
          {assignments.map((row) => (
            <div key={row.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,padding:'10px 12px',background:'#FAFAF8',border:'1px solid #F0F0EE',borderRadius:12}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                <Badge variant="default">{row.subject_name}</Badge>
                {editRow?.id === row.id ? (
                  <select value={editTeacherId} onChange={(e)=>setEditTeacherId(e.target.value)} style={{...sel,padding:'8px 10px',fontSize:12,minWidth:170}}>
                    <option value="">Select teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : (
                  <Badge variant="blue">{row.teacher_name}</Badge>
                )}
              </div>
              <div style={{display:'flex',gap:8}}>
                {editRow?.id === row.id ? (
                  <>
                    <button onClick={saveEdit} style={{background:'white',border:'1px solid #E5E5E3',borderRadius:9,padding:'6px 8px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#0A0A0A'}}>Save</button>
                    <button onClick={()=>{setEditRow(null);setEditTeacherId('');}} style={{background:'white',border:'1px solid #E5E5E3',borderRadius:9,padding:'6px 8px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#6B6B6B'}}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>startEdit(row)} style={{background:'white',border:'1px solid #E5E5E3',borderRadius:9,padding:'6px 8px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:'#0A0A0A'}}><Pencil size={12}/>Edit</button>
                    <button onClick={()=>handleDelete(row)} style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:9,padding:'6px 8px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:'#EF4444'}}><Trash2 size={12}/>Remove</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function AdminBatches() {
  const toast = useToast();
  const [batches,setBatches] = useState([]);
  const [allStudents,setAllStudents] = useState([]);
  const [teachers,setTeachers] = useState([]);
  const [subjects,setSubjects] = useState([]);
  const [loading,setLoading] = useState(true);
  const [modalOpen,setModalOpen] = useState(false);
  const [studentsOpen,setStudentsOpen] = useState(false);
  const [selected,setSelected] = useState(null);
  const [selectedBatch,setSelectedBatch] = useState(null);
  const [batchStudents,setBatchStudents] = useState([]);
  const [batchAssignments,setBatchAssignments] = useState([]);
  const [assignmentsOpen,setAssignmentsOpen] = useState(false);
  const [openMenu,setOpenMenu] = useState(null);
  const [mounted,setMounted] = useState(false);

  const fetchAll = useCallback(async()=>{
    setLoading(true);
    try {
      const [bRes,sRes,tRes,subRes] = await Promise.all([
        api.get('/batches'),
        api.get('/users?role=student&limit=500'),
        api.get('/users?role=teacher&limit=500'),
        api.get('/subjects'),
      ]);
      setBatches(bRes.data.data||[]);
      setAllStudents(sRes.data.data.users||[]);
      setTeachers(tRes.data.data.users||[]);
      setSubjects(subRes.data.data||[]);
    } catch{} finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    const timer = setTimeout(()=>{
      setMounted(true);
      fetchAll();
    },0);
    return () => clearTimeout(timer);
  },[fetchAll]);

  const handleDelete = async(id,name)=>{
    try{await api.delete(`/batches/${id}`);toast({message:`${name} deleted`,type:'success'});fetchAll();}
    catch(err){toast({message:err.response?.data?.message||'Cannot delete batch',type:'error'});}
    setOpenMenu(null);
  };

  const openStudents = async batch => {
    setSelectedBatch(batch);
    const res = await api.get(`/batches/${batch.id}/students?limit=200`).catch(()=>null);
    setBatchStudents(res?.data?.data?.students||[]);
    setStudentsOpen(true);
  };

  const refreshBatchStudents = async() => {
    if(!selectedBatch) return;
    const res = await api.get(`/batches/${selectedBatch.id}/students?limit=200`).catch(()=>null);
    setBatchStudents(res?.data?.data?.students||[]);
    fetchAll();
  };

  const openAssignments = async (batch) => {
    setSelectedBatch(batch);
    const res = await api.get(`/batches/${batch.id}/assignments`).catch(() => null);
    setBatchAssignments(res?.data?.data || []);
    setAssignmentsOpen(true);
  };

  const refreshBatchAssignments = async () => {
    if (!selectedBatch) return;
    const res = await api.get(`/batches/${selectedBatch.id}/assignments`).catch(() => null);
    setBatchAssignments(res?.data?.data || []);
    fetchAll();
  };

  return (
    <div style={{opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'all 0.5s cubic-bezier(0.16,1,0.3,1)',fontFamily:"'Inter',sans-serif"}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 style={{fontSize:'clamp(24px,3vw,32px)',fontWeight:900,letterSpacing:'-0.04em',color:'#0A0A0A',marginBottom:6}}>Batches</h1>
          <p style={{fontSize:14,color:'#6B6B6B'}}>{loading?'...':`${batches.length} batches`}</p>
        </div>
        <Button icon={<Plus size={15}/>} onClick={()=>{setSelected(null);setModalOpen(true);}}>Create Batch</Button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {loading?Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>):
        batches.length===0?(
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:'80px 24px'}}>
            <Layers size={40} style={{margin:'0 auto 16px',color:'#D0D0CC'}}/>
            <p style={{fontSize:16,fontWeight:700,color:'#6B6B6B',marginBottom:8}}>No batches yet</p>
            <p style={{fontSize:14,color:'#A3A3A0',marginBottom:20}}>Create batches to organise your students</p>
            <Button onClick={()=>{setSelected(null);setModalOpen(true);}}>Create first batch</Button>
          </div>
        ):batches.map(b=>(
          <div key={b.id} style={{background:'white',borderRadius:20,border:'1px solid #E5E5E3',padding:24,
            transition:'all 0.2s',position:'relative',overflow:'hidden'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='translateY(0)';}}>
            <div style={{position:'absolute',right:-16,top:-16,width:80,height:80,borderRadius:'50%',
              background:'rgba(37,99,235,0.05)',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,position:'relative'}}>
              <div style={{width:44,height:44,background:'#EFF6FF',borderRadius:14,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Layers size={20} color="#2563EB"/>
              </div>
              <div style={{position:'relative'}}>
                <button onClick={()=>setOpenMenu(openMenu===b.id?null:b.id)}
                  style={{background:'none',border:'none',cursor:'pointer',color:'#A3A3A0',padding:6,borderRadius:8,display:'flex',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#F5F5F3';e.currentTarget.style.color='#0A0A0A';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#A3A3A0';}}>
                  <MoreHorizontal size={16}/>
                </button>
                {openMenu===b.id&&(
                  <div style={{position:'absolute',right:0,top:'100%',zIndex:50,background:'white',border:'1px solid #E5E5E3',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.1)',minWidth:160,overflow:'hidden'}}>
                    <button onClick={()=>{setSelected(b);setModalOpen(true);setOpenMenu(null);}}
                      style={{width:'100%',padding:'10px 14px',textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#0A0A0A',fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,transition:'background 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#F5F5F3';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                      <Pencil size={12}/>Edit
                    </button>
                    <button onClick={()=>handleDelete(b.id,b.name)}
                      style={{width:'100%',padding:'10px 14px',textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#EF4444',fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,transition:'background 0.15s',borderTop:'1px solid #F5F5F3'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#FFF5F5';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                      <Trash2 size={12}/>Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <h3 style={{fontSize:18,fontWeight:800,color:'#0A0A0A',letterSpacing:'-0.02em',marginBottom:4}}>{b.name}</h3>
            {b.academic_year&&<p style={{fontSize:12,color:'#A3A3A0',marginBottom:12}}>{b.academic_year}</p>}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <Users size={14} color="#6B6B6B"/>
                <span style={{fontSize:13,color:'#6B6B6B',fontWeight:500}}>{b.student_count||0} students</span>
                <span style={{fontSize:12,color:'#A3A3A0'}}>•</span>
                <span style={{fontSize:13,color:'#6B6B6B',fontWeight:500}}>{b.teacher_count||0} teachers</span>
              </div>
              <Link href={`/admin/batches/${b.id}`}>
                <button
                  style={{fontSize:12,fontWeight:700,color:'#2563EB',background:'#EFF6FF',
                    border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#DBEAFE';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#EFF6FF';}}
                >
                  Manage →
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <BatchModal open={modalOpen} onClose={()=>setModalOpen(false)} onSuccess={fetchAll} existing={selected}/>
      <BatchStudentsModal open={studentsOpen} onClose={()=>setStudentsOpen(false)}
        batch={{...selectedBatch,students:batchStudents}} allStudents={allStudents} onSuccess={refreshBatchStudents}/>
      <BatchAssignmentsModal
        open={assignmentsOpen}
        onClose={()=>setAssignmentsOpen(false)}
        batch={selectedBatch}
        assignments={batchAssignments}
        subjects={subjects}
        teachers={teachers}
        onRefresh={refreshBatchAssignments}
      />
      {openMenu&&<div style={{position:'fixed',inset:0,zIndex:40}} onClick={()=>setOpenMenu(null)}/>}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}