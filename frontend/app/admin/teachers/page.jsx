'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, Plus, MoreHorizontal, AlertTriangle, GraduationCap, UserX, BookOpen, Pencil, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function SkeletonRow() {
  return (
    <tr>
      {[40,140,130,130,90,40].map((w,i) => (
        <td key={i} style={{padding:'14px 16px'}}>
          <div style={{height:14,width:w,borderRadius:6,
            background:'linear-gradient(90deg,#F0F0EE 25%,#E8E8E6 50%,#F0F0EE 75%)',
            backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
        </td>
      ))}
    </tr>
  );
}

function AddTeacherModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ name:'', email:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = f => e => setForm(p=>({...p,[f]:e.target.value}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name||!form.email){setError('All fields required');return;}
    setLoading(true);setError('');
    try {
      await api.post('/users/teachers', form);
      toast({message:`${form.name} added. Credentials sent to email.`,type:'success'});
      onSuccess();onClose();setForm({name:'',email:''});
    } catch(err){setError(err.response?.data?.message||'Failed to add teacher');}
    finally{setLoading(false);}
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Teacher">
      {error&&<div style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center'}}>
        <AlertTriangle size={14} color="#E53E3E"/><span style={{fontSize:13,color:'#C53030'}}>{error}</span></div>}
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Full Name" placeholder="Dr. Anjali Sharma" value={form.name} onChange={set('name')} required/>
        <Input label="Work Email" type="email" placeholder="anjali@school.com" value={form.email} onChange={set('email')} required/>
        <p style={{fontSize:12,color:'#A3A3A0',lineHeight:1.5}}>Login credentials will be sent to the teacher&#39s email automatically.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Teacher</Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignSubjectModal({ open, onClose, teacher, subjects, batches, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({subjectId:'',batchId:''});
  const [loading, setLoading] = useState(false);
  const set = f => e => setForm(p=>({...p,[f]:e.target.value}));
  const sel = {width:'100%',background:'white',border:'1.5px solid #E5E5E3',borderRadius:12,padding:'11px 14px',fontSize:14,color:'#0A0A0A',outline:'none',fontFamily:'inherit',cursor:'pointer'};

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setForm({ subjectId: '', batchId: '' }), 0);
    return () => clearTimeout(timer);
  }, [open, teacher?.id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if(!form.subjectId||!form.batchId)return;
    setLoading(true);
    try {
      await api.post(`/subjects/${form.subjectId}/assign`,{teacherId:teacher.id,batchId:form.batchId});
      toast({message:'Subject assigned successfully',type:'success'});
      onSuccess();onClose();
    } catch(err){toast({message:err.response?.data?.message||'Failed',type:'error'});}
    finally{setLoading(false);}
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Subject — ${teacher?.name||''}`}>
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Subject</label>
          <select value={form.subjectId} onChange={set('subjectId')} style={sel} required>
            <option value="">Select subject...</option>
            {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Batch</label>
          <select value={form.batchId} onChange={set('batchId')} style={sel} required>
            <option value="">Select batch...</option>
            {batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} icon={<BookOpen size={14}/>}>Assign</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditAssignmentModal({ open, onClose, teacher, assignment, batches, onSuccess }) {
  const toast = useToast();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setBatchId(assignment?.batch_id || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [open, assignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignment?.subject_id || !batchId || !teacher?.id) return;
    setLoading(true);
    try {
      await api.patch(`/subjects/${assignment.subject_id}/assignments/${assignment.id}`, {
        teacherId: teacher.id,
        batchId,
      });
      toast({ message: 'Assignment updated', type: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to update assignment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sel = {
    width: '100%', background: 'white', border: '1.5px solid #E5E5E3', borderRadius: 12,
    padding: '11px 14px', fontSize: 14, color: '#0A0A0A', outline: 'none', fontFamily: 'inherit', cursor: 'pointer'
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Assignment — ${teacher?.name || ''}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{fontSize:13,color:'#6B6B6B'}}>
          Subject: <strong style={{color:'#0A0A0A'}}>{assignment?.subject_name || '-'}</strong>
        </div>
        <div>
          <label style={{fontSize:11,fontWeight:700,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Batch</label>
          <select value={batchId} onChange={(e)=>setBatchId(e.target.value)} style={sel} required>
            <option value="">Select batch...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function ManageAssignmentsModal({ open, onClose, teacher, onCreate, onEdit, onDelete }) {
  const assignments = teacher?.assignments || [];

  return (
    <Modal open={open} onClose={onClose} title={`Assignments — ${teacher?.name || ''}`} size="lg">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <p style={{fontSize:13,color:'#6B6B6B'}}>Subject-batch ownership for this teacher.</p>
        <Button size="sm" icon={<Plus size={14}/>} onClick={onCreate}>Assign New</Button>
      </div>

      {assignments.length === 0 ? (
        <div style={{textAlign:'center',padding:'26px 12px',border:'1px dashed #E5E5E3',borderRadius:14,color:'#A3A3A0',fontSize:14}}>
          No assignments yet.
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
          {assignments.map((a) => (
            <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'10px 12px',background:'#FAFAF8',border:'1px solid #F0F0EE',borderRadius:12}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                <Badge variant="default">{a.subject_name}</Badge>
                <Badge variant="blue">{a.batch_name}</Badge>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>onEdit(a)} style={{background:'white',border:'1px solid #E5E5E3',borderRadius:9,padding:'6px 8px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:'#0A0A0A'}}>
                  <Pencil size={12}/>Edit
                </button>
                <button onClick={()=>onDelete(a)} style={{background:'#FFF5F5',border:'1px solid #FED7D7',borderRadius:9,padding:'6px 8px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:'#EF4444'}}>
                  <Trash2 size={12}/>Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function AdminTeachers() {
  const router = useRouter();
  const toast = useToast();
  const [teachers,setTeachers] = useState([]);
  const [subjects,setSubjects] = useState([]);
  const [batches,setBatches] = useState([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState('');
  const [addOpen,setAddOpen] = useState(false);
  const [assignOpen,setAssignOpen] = useState(false);
  const [manageOpen,setManageOpen] = useState(false);
  const [editOpen,setEditOpen] = useState(false);
  const [selectedAssignment,setSelectedAssignment] = useState(null);
  const [selectedTeacher,setSelectedTeacher] = useState(null);
  const [openMenu,setOpenMenu] = useState(null);
  const [mounted,setMounted] = useState(false);

  const fetchAll = useCallback(async()=>{
    setLoading(true);
    try {
      const [tRes,sRes,bRes] = await Promise.all([
        api.get('/users?role=teacher&limit=500'),
        api.get('/subjects'),
        api.get('/batches'),
      ]);
      setTeachers(tRes.data.data.users||[]);
      setSubjects(sRes.data.data||[]);
      setBatches(bRes.data.data||[]);
    } catch{} finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    const timer = setTimeout(()=>{
      setMounted(true);
      fetchAll();
    },0);
    return () => clearTimeout(timer);
  },[fetchAll]);

  const handleDeactivate = async(id,name)=>{
    try{await api.delete(`/users/${id}`);toast({message:`${name} deactivated`,type:'success'});fetchAll();}
    catch{toast({message:'Failed',type:'error'});}
    setOpenMenu(null);
  };

  const filtered = teachers.filter(t=>!search||
    t.name.toLowerCase().includes(search.toLowerCase())||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const getTeacherById = useCallback((id) => teachers.find(t => t.id === id) || null, [teachers]);

  const selectedTeacherFresh = useMemo(() => {
    if (!selectedTeacher?.id) return null;
    return getTeacherById(selectedTeacher.id);
  }, [selectedTeacher, getTeacherById]);

  const handleDeleteAssignment = async (assignment) => {
    if (!selectedTeacherFresh) return;
    try {
      await api.delete(`/subjects/${assignment.subject_id}/assignments/${assignment.id}`);
      toast({ message: 'Assignment removed', type: 'success' });
      await fetchAll();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to remove assignment', type: 'error' });
    }
  };

  return (
    <div style={{opacity:mounted?1:0,transform:mounted?'translateY(0)':'translateY(12px)',transition:'all 0.5s cubic-bezier(0.16,1,0.3,1)',fontFamily:"'Inter',sans-serif"}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 style={{fontSize:'clamp(24px,3vw,32px)',fontWeight:900,letterSpacing:'-0.04em',color:'#0A0A0A',marginBottom:6}}>Teachers</h1>
          <p style={{fontSize:14,color:'#6B6B6B'}}>{loading?'...':`${filtered.length} teachers`}</p>
        </div>
        <Button icon={<Plus size={15}/>} onClick={()=>setAddOpen(true)}>Add Teacher</Button>
      </div>

      <div style={{position:'relative',maxWidth:360,marginBottom:20}}>
        <Search size={15} color="#A3A3A0" style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
        <input placeholder="Search teachers..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:'100%',background:'white',border:'1.5px solid #E5E5E3',borderRadius:12,padding:'11px 14px 11px 38px',fontSize:14,outline:'none',fontFamily:'inherit',color:'#0A0A0A',transition:'all 0.15s'}}
          onFocus={e=>{e.target.style.borderColor='#0A0A0A';}} onBlur={e=>{e.target.style.borderColor='#E5E5E3';}}/>
      </div>

      <div style={{background:'white',borderRadius:20,border:'1px solid #E5E5E3',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #F0F0EE'}}>
              {['Teacher','Email','Subjects','Batches','Status',''].map(h=>(
                <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#A3A3A0',textTransform:'uppercase',letterSpacing:'0.06em',background:'#FAFAF8'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading?Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>):
            filtered.length===0?(
              <tr><td colSpan={6} style={{padding:'60px 24px',textAlign:'center'}}>
                <GraduationCap size={32} style={{margin:'0 auto 12px',color:'#D0D0CC'}}/>
                <p style={{fontSize:15,fontWeight:600,color:'#6B6B6B',marginBottom:4}}>No teachers yet</p>
                <p style={{fontSize:13,color:'#A3A3A0'}}>Add your first teacher to get started</p>
              </td></tr>
            ):filtered.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:i<filtered.length-1?'1px solid #F5F5F3':'none',transition:'background 0.1s'}}
                onClick={()=>router.push(`/admin/teachers/${t.id}`)}
                onMouseEnter={e=>{e.currentTarget.style.background='#FAFAF8';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                <td style={{padding:'13px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Avatar name={t.name} size="sm"/>
                    <span style={{fontSize:14,fontWeight:600,color:'#0A0A0A'}}>{t.name}</span>
                  </div>
                </td>
                <td style={{padding:'13px 16px',fontSize:13,color:'#6B6B6B'}}>{t.email}</td>
                <td style={{padding:'13px 16px'}}>
                  {t.subjects?.length
                    ?<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {t.subjects.slice(0,2).map(s=><Badge key={s.id} variant="default">{s.name}</Badge>)}
                        {t.subjects.length>2&&<Badge variant="default">+{t.subjects.length-2}</Badge>}
                      </div>
                    :<span style={{color:'#C0C0BC',fontSize:12}}>Not assigned</span>
                  }
                </td>
                <td style={{padding:'13px 16px'}}>
                  {(t.assignments || []).length
                    ?<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {[...new Map((t.assignments || []).map(a => [a.batch_id, a])).values()].slice(0,2).map(a => <Badge key={a.batch_id} variant="blue">{a.batch_name}</Badge>)}
                        {[...new Set((t.assignments || []).map(a => a.batch_id))].length > 2 && <Badge variant="blue">+{[...new Set((t.assignments || []).map(a => a.batch_id))].length - 2}</Badge>}
                      </div>
                    :<span style={{color:'#C0C0BC',fontSize:12}}>Not assigned</span>
                  }
                </td>
                <td style={{padding:'13px 16px'}}><Badge variant={t.is_active?'green':'red'}>{t.is_active?'Active':'Inactive'}</Badge></td>
                <td style={{padding:'13px 16px',position:'relative'}}>
                  <button onClick={(event)=>{event.stopPropagation();setOpenMenu(openMenu===t.id?null:t.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'#A3A3A0',padding:6,borderRadius:8,display:'flex',transition:'all 0.15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='#F5F5F3';e.currentTarget.style.color='#0A0A0A';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#A3A3A0';}}>
                    <MoreHorizontal size={16}/>
                  </button>
                  {openMenu===t.id&&(
                    <div onClick={(event)=>event.stopPropagation()} style={{position:'absolute',right:12,top:'100%',zIndex:50,background:'white',border:'1px solid #E5E5E3',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.1)',minWidth:180,overflow:'hidden'}}>
                      <button onClick={(event)=>{event.stopPropagation();setSelectedTeacher(t);setAssignOpen(true);setOpenMenu(null);}}
                        style={{width:'100%',padding:'11px 16px',textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#0A0A0A',fontWeight:500,fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,transition:'background 0.15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#F5F5F3';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                        <BookOpen size={13}/>Assign Subject
                      </button>
                      <button onClick={(event)=>{event.stopPropagation();setSelectedTeacher(t);setManageOpen(true);setOpenMenu(null);}}
                        style={{width:'100%',padding:'11px 16px',textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#0A0A0A',fontWeight:500,fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,transition:'background 0.15s',borderTop:'1px solid #F5F5F3'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#F5F5F3';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                        <Pencil size={13}/>Manage Assignments
                      </button>
                      {t.is_active&&<button onClick={(event)=>{event.stopPropagation();handleDeactivate(t.id,t.name);}}
                        style={{width:'100%',padding:'11px 16px',textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#EF4444',fontWeight:500,fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,transition:'background 0.15s',borderTop:'1px solid #F5F5F3'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#FFF5F5';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                        <UserX size={13}/>Deactivate
                      </button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddTeacherModal open={addOpen} onClose={()=>setAddOpen(false)} onSuccess={fetchAll}/>
      <AssignSubjectModal open={assignOpen} onClose={()=>setAssignOpen(false)} teacher={selectedTeacher} subjects={subjects} batches={batches} onSuccess={fetchAll}/>
      <ManageAssignmentsModal
        open={manageOpen}
        onClose={()=>setManageOpen(false)}
        teacher={selectedTeacherFresh}
        onCreate={()=>{setManageOpen(false);setAssignOpen(true);}}
        onEdit={(assignment)=>{setSelectedAssignment(assignment);setManageOpen(false);setEditOpen(true);}}
        onDelete={handleDeleteAssignment}
      />
      <EditAssignmentModal
        open={editOpen}
        onClose={()=>setEditOpen(false)}
        teacher={selectedTeacherFresh}
        assignment={selectedAssignment}
        batches={batches}
        onSuccess={fetchAll}
      />
      {openMenu&&<div style={{position:'fixed',inset:0,zIndex:40}} onClick={()=>setOpenMenu(null)}/>}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}