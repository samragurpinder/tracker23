import React, { useState, useContext, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { UserContext } from '../App';
import { CoachingLog as CoachingLogType, SubjectName, User, CoachingLecture, CoachingTestActivity, CoachingLogActivity, Doubt, DailyPlanTask, TopicStatus, CoachingOtherActivity, DailyPlan, Document } from '../types';
import { PlusIcon, XMarkIcon, PencilIcon, TrashIcon, BuildingLibraryIcon, AcademicCapIcon, BookOpenIcon, SparklesIcon, CalendarDaysIcon, DocumentDuplicateIcon, DocumentArrowUpIcon, LinkIcon, EyeIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { listFilesFromDrive, DriveFile } from '../services/driveService';
import DocumentViewer from './DocumentViewer';

// --- Helper Functions ---
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDateToDisplay = (dateStr: string): string => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};
const formatTimeToAMPM = (time: string): string => {
    if (!time || !time.includes(':')) return '';
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${String(formattedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
};

// --- Reusable Modal ---
const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string, maxWidth?: string }> = ({ children, onClose, title, maxWidth = 'max-w-2xl' }) => {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} p-6 relative max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">{title}</h2>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('popover-root')!
    );
};

// --- Form Modals ---
const LectureFormModal: React.FC<{
    onClose: () => void;
    onSave: (lecture: Omit<CoachingLecture, 'id' | 'type'>) => void;
    initialLecture?: CoachingLecture;
}> = ({ onClose, onSave, initialLecture }) => {
    const { user, updateUser } = useContext(UserContext);
    const [form, setForm] = useState({
        startTime: initialLecture?.startTime || '09:00',
        endTime: initialLecture?.endTime || '10:30',
        subject: initialLecture?.subject || 'Physics' as SubjectName,
        teacher: initialLecture?.teacher || '',
        category: initialLecture?.category || 'Combined' as CoachingLecture['category'],
        chapter: initialLecture?.chapter || '',
        subtopicsTaught: initialLecture?.subtopicsTaught || [] as string[],
        remarks: initialLecture?.remarks || '',
        rating: initialLecture?.rating || 3,
        homework: initialLecture?.homework || '',
        doubts: initialLecture?.doubts || '',
    });
    const [newTeacher, setNewTeacher] = useState('');
    const [showNewTeacherInput, setShowNewTeacherInput] = useState(false);
    
    const chaptersForSubject = useMemo(() => {
        if (!user) return [];
        const subjectData = user.topics[form.subject.toLowerCase() as keyof typeof user.topics];
        return 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.flatMap(s => s.chapters);
    }, [user, form.subject]);

    const subtopicsForChapter = useMemo(() => {
        return chaptersForSubject.find(c => c.name === form.chapter)?.majorTopics.flatMap(mt => mt.subtopics.map(st => st.name)) || [];
    }, [chaptersForSubject, form.chapter]);

    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'add_new') {
            setShowNewTeacherInput(true);
            setForm(f => ({ ...f, teacher: '' }));
        } else {
            setShowNewTeacherInput(false);
            setForm(f => ({ ...f, teacher: value }));
        }
    };
    
    const handleAddNewTeacher = () => {
        if (newTeacher.trim() && !user?.teachers.includes(newTeacher.trim())) {
            updateUser(prev => ({ ...prev!, teachers: [...prev!.teachers, newTeacher.trim()] }));
            setForm(f => ({ ...f, teacher: newTeacher.trim() }));
            setShowNewTeacherInput(false);
            setNewTeacher('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal onClose={onClose} title={initialLecture ? 'Edit Coaching Lecture' : 'Add Coaching Lecture'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label>Start Time</label><input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className={inputStyle} /></div>
                    <div><label>End Time</label><input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className={inputStyle} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label>Subject</label><select value={form.subject} onChange={e => setForm({...form, subject: e.target.value as SubjectName})} className={inputStyle}><option>Physics</option><option>Chemistry</option><option>Math</option></select></div>
                    <div><label>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className={inputStyle}><option>Combined</option><option>Theory</option><option>Concepts</option><option>Questions</option><option>Doubt</option><option>Motivation/Strategies</option><option>Other</option></select></div>
                </div>
                <div>
                    <label>Teacher</label>
                    {!showNewTeacherInput ? (
                        <select value={form.teacher} onChange={handleTeacherChange} className={inputStyle}>
                            <option value="">Select Teacher</option>
                            {user?.teachers.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="add_new">-- Add New Teacher --</option>
                        </select>
                    ) : (
                        <div className="flex gap-2"><input type="text" value={newTeacher} onChange={e => setNewTeacher(e.target.value)} className={inputStyle} autoFocus /><button type="button" onClick={handleAddNewTeacher} className="px-4 py-2 bg-primary text-white rounded-md">Add</button></div>
                    )}
                </div>
                <div><label>Chapter</label><select value={form.chapter} onChange={e => setForm({...form, chapter: e.target.value, subtopicsTaught: []})} className={inputStyle} required><option value="">Select Chapter</option>{chaptersForSubject.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                {subtopicsForChapter.length > 0 && <div><label>Subtopics Taught</label><div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-1 p-2 bg-background rounded-md">{subtopicsForChapter.map(st => <label key={st} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.subtopicsTaught.includes(st)} onChange={e => setForm(f => ({ ...f, subtopicsTaught: e.target.checked ? [...f.subtopicsTaught, st] : f.subtopicsTaught.filter(s => s !== st) }))} />{st}</label>)}</div></div>}
                <div><label>Remarks</label><textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} className={inputStyle + " h-20"} /></div>
                <div><label>Homework</label><textarea value={form.homework} onChange={e => setForm({...form, homework: e.target.value})} className={inputStyle + " h-20"} placeholder="This will be added to today's to-do list." /></div>
                <div><label>Doubts from this Class</label><textarea value={form.doubts} onChange={e => setForm({...form, doubts: e.target.value})} className={inputStyle + " h-20"} placeholder="Each line will be added as a separate doubt in your journal." /></div>
                <div><label>Rating</label><div className="flex items-center gap-1">{[1,2,3,4,5].map(r => <StarIcon key={r} onClick={() => setForm({...form, rating: r})} className={`w-8 h-8 cursor-pointer ${r <= form.rating ? 'text-amber-400' : 'text-gray-300'}`} />)}</div></div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Save Lecture</button>
            </form>
        </Modal>
    )
}

const TestLogModal: React.FC<{
    onClose: () => void;
    onSave: (test: Omit<CoachingTestActivity, 'id'|'type'>) => void;
}> = ({ onClose, onSave }) => {
    const { user } = useContext(UserContext);
    const [source, setSource] = useState('custom'); // 'upcoming', 'history', 'custom'
    const [selectedTestId, setSelectedTestId] = useState('');
    const [customTestName, setCustomTestName] = useState('');
    const [startTime, setStartTime] = useState('14:00');
    const [endTime, setEndTime] = useState('17:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const testName = source === 'custom' ? customTestName : user?.upcomingTests.find(t => t.id === selectedTestId)?.name || user?.tests.find(t => t.id === selectedTestId)?.name || 'Test';
        if (!testName) return;

        onSave({
            upcomingTestId: source === 'upcoming' ? selectedTestId : null,
            testResultId: source === 'history' ? selectedTestId : null,
            testName,
            startTime, endTime
        });
    };

    return (
        <Modal onClose={onClose} title="Log Coaching Test" maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div><label>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 bg-background rounded-md" /></div>
                    <div><label>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 bg-background rounded-md" /></div>
                </div>
                <div>
                    <label>Test Source</label>
                    <select value={source} onChange={e => {setSource(e.target.value); setSelectedTestId('')}} className="w-full p-2 bg-background rounded-md">
                        <option value="custom">Custom Test Name</option>
                        <option value="upcoming">From Upcoming Tests</option>
                        <option value="history">From Test History</option>
                    </select>
                </div>
                {source === 'upcoming' && user?.upcomingTests && <select value={selectedTestId} onChange={e=>setSelectedTestId(e.target.value)} className="w-full p-2 bg-background rounded-md"><option value="">Select an upcoming test...</option>{user.upcomingTests.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
                {source === 'history' && user?.tests && <select value={selectedTestId} onChange={e=>setSelectedTestId(e.target.value)} className="w-full p-2 bg-background rounded-md"><option value="">Select from test history...</option>{user.tests.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
                {source === 'custom' && <input type="text" placeholder="e.g., Surprise Quiz" value={customTestName} onChange={e=>setCustomTestName(e.target.value)} className="w-full p-2 bg-background rounded-md" />}
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Log Test</button>
            </form>
        </Modal>
    )
};

const OtherActivityModal: React.FC<{
    onClose: () => void;
    onSave: (activity: Omit<CoachingOtherActivity, 'id'|'type'>) => void;
}> = ({ onClose, onSave }) => {
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!description) return;
        onSave({description, startTime, endTime});
    };

    return (
         <Modal onClose={onClose} title="Log Other Activity" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label>Description</label><input type="text" placeholder="e.g., Holiday, Celebration" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-background rounded-md" required/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 bg-background rounded-md"/></div>
                    <div><label>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 bg-background rounded-md"/></div>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Log Activity</button>
            </form>
         </Modal>
    );
};

// --- Documents Section ---
const CategorizeDocumentModal: React.FC<{
    onClose: () => void;
    onSave: (doc: Omit<Document, 'id' | 'dateAdded' | 'driveFileId' | 'mimeType'>) => void;
    driveFile: DriveFile;
}> = ({ onClose, onSave, driveFile }) => {
    const { user } = useContext(UserContext);
    const [name, setName] = useState(driveFile.name.replace(/\.(pdf|png|jpg|jpeg)$/i, ''));
    const [type, setType] = useState<'Notes' | 'Test Paper' | 'Question Bank' | 'Other'>('Notes');
    const [subject, setSubject] = useState<SubjectName | 'Other'>('Physics');
    const [chapter, setChapter] = useState('');
    const [description, setDescription] = useState('');

    const chaptersForSubject = useMemo(() => {
        if (!user || subject === 'Other') return [];
        const subjectData = user.topics[subject.toLowerCase() as keyof typeof user.topics];
        return 'chapters' in subjectData ? subjectData.chapters.map(c => c.name) : subjectData.sections.flatMap(s => s.chapters).map(c => c.name);
    }, [user, subject]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const docData: Omit<Document, 'id' | 'dateAdded' | 'driveFileId' | 'mimeType'> & { chapter?: string; description?: string } = {
            name,
            type,
            subject,
        };
        if (subject !== 'Other') {
            docData.chapter = chapter;
        } else {
            docData.description = description;
        }
        onSave(docData);
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal onClose={onClose} title="Categorize Document">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label>Document Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyle} required /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label>Type</label><select value={type} onChange={e => setType(e.target.value as any)} className={inputStyle}><option>Notes</option><option>Test Paper</option><option>Question Bank</option><option>Other</option></select></div>
                    <div><label>Subject</label><select value={subject} onChange={e => setSubject(e.target.value as SubjectName | 'Other')} className={inputStyle}><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Math">Math</option><option value="Other">Other</option></select></div>
                </div>
                {subject !== 'Other' ? (
                    <div><label>Chapter</label><select value={chapter} onChange={e => setChapter(e.target.value)} className={inputStyle} required={subject !== 'Other'}><option value="">Select Chapter...</option>{chaptersForSubject.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                ) : (
                    <div><label>Description</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputStyle} placeholder="e.g., Formula Sheet, Syllabus PDF" required/></div>
                )}
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Save to Archive</button>
            </form>
        </Modal>
    );
};

const DocumentsManager: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [docToView, setDocToView] = useState<Document | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [folderIdInput, setFolderIdInput] = useState(user?.driveFolderId || '');
    const [showFolderIdSaved, setShowFolderIdSaved] = useState(false);
    
    const [credFile, setCredFile] = useState<File | null>(null);
    const [credFileName, setCredFileName] = useState('');
    const [showCredsSaved, setShowCredsSaved] = useState(false);

    const [filters, setFilters] = useState({ subject: 'All', type: 'All', search: '' });
    
    const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [docToCategorize, setDocToCategorize] = useState<DriveFile | null>(null);
    const [isDriveSetupExpanded, setIsDriveSetupExpanded] = useState(false);


    const handleDeleteDocument = () => {
        if (!docToDelete) return;
        updateUser(prev => ({...prev!, documents: (prev!.documents || []).filter(d => d.id !== docToDelete.id)}));
        setDocToDelete(null);
    };

    const handleSaveFolderId = () => {
        updateUser({ driveFolderId: folderIdInput.trim() });
        setShowFolderIdSaved(true);
        setTimeout(() => setShowFolderIdSaved(false), 2000);
    };

    const handleCredFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/json') {
            setCredFile(file);
            setCredFileName(file.name);
        } else {
            setCredFile(null);
            setCredFileName('');
            alert('Please select a valid JSON credentials file.');
        }
    };

    const handleSaveCreds = () => {
        if (!credFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const creds = JSON.parse(event.target?.result as string);
                if (creds.client_email && creds.private_key) {
                    updateUser({ driveServiceAccountCreds: creds });
                    setShowCredsSaved(true);
                    setTimeout(() => setShowCredsSaved(false), 2000);
                    setCredFile(null);
                    setCredFileName('');
                } else {
                    alert('Invalid Service Account JSON file.');
                }
            } catch (e) {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(credFile);
    };
    
    const handleRemoveCreds = () => {
        updateUser({ driveServiceAccountCreds: null });
    };

    const handleSyncDrive = async () => {
        if (!user?.driveFolderId || !user?.driveServiceAccountCreds) {
            setError("Please set your Drive credentials and Folder ID first.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const files = await listFilesFromDrive(user.driveServiceAccountCreds, user.driveFolderId);
            setDriveFiles(files);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCategorizedDocument = (docData: Omit<Document, 'id' | 'dateAdded' | 'driveFileId' | 'mimeType'>) => {
        if (!docToCategorize) return;
        const newDocument: Document = {
            ...docData,
            id: Date.now().toString(),
            driveFileId: docToCategorize.id,
            mimeType: docToCategorize.mimeType,
            dateAdded: new Date().toISOString(),
        };
        updateUser(prev => ({ ...prev!, documents: [newDocument, ...(prev?.documents || [])]}));
        setDocToCategorize(null);
    };

    const categorizedFileIds = useMemo(() => new Set(user?.documents.map(d => d.driveFileId)), [user?.documents]);
    const uncategorizedFiles = useMemo(() => driveFiles.filter(f => !categorizedFileIds.has(f.id)), [driveFiles, categorizedFileIds]);

    const filteredDocuments = useMemo(() => {
        if (!user?.documents) return [];
        return user.documents.filter(doc => {
            if (!doc) return false;
            const subjectMatch = filters.subject === 'All' || doc.subject === filters.subject;
            const typeMatch = filters.type === 'All' || doc.type === filters.type;
            const searchMatch = filters.search === '' || doc.name.toLowerCase().includes(filters.search.toLowerCase()) || (doc.chapter && doc.chapter.toLowerCase().includes(filters.search.toLowerCase())) || (doc.description && doc.description.toLowerCase().includes(filters.search.toLowerCase()));
            return subjectMatch && typeMatch && searchMatch;
        }).sort((a,b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }, [user?.documents, filters]);
    
    return (
        <div className="mt-6 bg-surface p-6 rounded-xl shadow-lg border border-accent">
            {docToCategorize && <CategorizeDocumentModal onClose={() => setDocToCategorize(null)} onSave={handleSaveCategorizedDocument} driveFile={docToCategorize} />}
            {docToView && <DocumentViewer document={docToView} onClose={() => setDocToView(null)} />}
            {docToDelete && <Modal onClose={() => setDocToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md"><p>Are you sure you want to delete "{docToDelete.name}"?</p><div className="flex justify-end gap-2 mt-4"><button onClick={() => setDocToDelete(null)} className="px-4 py-2 bg-accent rounded-md">Cancel</button><button onClick={handleDeleteDocument} className="px-4 py-2 bg-danger text-white rounded-md">Delete</button></div></Modal>}

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                 <div className="flex items-center space-x-3"><DocumentDuplicateIcon className="w-8 h-8 text-primary" /><h2 className="text-2xl font-bold text-text-primary">Documents Archive</h2></div>
            </div>
            
            <div className="mt-4 bg-background p-3 rounded-lg border border-accent">
                <button onClick={() => setIsDriveSetupExpanded(!isDriveSetupExpanded)} className="w-full flex justify-between items-center text-left">
                    <h3 className="text-lg font-semibold text-text-primary">Drive Integration Setup</h3>
                    <ChevronDownIcon className={`w-6 h-6 text-text-secondary transition-transform ${isDriveSetupExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${isDriveSetupExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">1. Google Drive Folder ID</label>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <input type="text" placeholder="Paste your Google Drive Folder ID here" value={folderIdInput} onChange={e => setFolderIdInput(e.target.value)} className="flex-grow p-2 bg-surface border border-accent rounded-md"/>
                                <button onClick={handleSaveFolderId} className="w-full sm:w-auto px-4 py-2 bg-primary text-white font-semibold rounded-md flex items-center justify-center">
                                    <CheckCircleIcon className={`w-5 h-5 mr-2 transition-transform duration-300 ${showFolderIdSaved ? 'scale-100' : 'scale-0'}`} />
                                    {showFolderIdSaved ? 'Saved!' : 'Save ID'}
                                </button>
                            </div>
                            {user?.driveServiceAccountCreds?.client_email && folderIdInput && (
                                <div className="mt-2 text-xs p-3 bg-blue-500/10 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-500/20">
                                    <p className="font-bold text-sm">Action Required: Grant Folder Access</p>
                                    <p className="mt-1">
                                        You must share your Google Drive folder with your service account. The service account needs permission to add files to your folder.
                                    </p>
                                    <ol className="list-decimal list-inside my-2 space-y-1">
                                        <li>In Google Drive, find the folder you want to use. You must be the <strong>Owner</strong> or an <strong>Editor</strong>.</li>
                                        <li>Right-click the folder and select 'Share' &gt; 'Share'.</li>
                                        <li>In the 'Add people and groups' field, paste this email:</li>
                                    </ol>
                                    <p className="font-semibold bg-blue-200 dark:bg-blue-900/50 rounded px-2 py-1 inline-block my-1 break-all">
                                        {user.driveServiceAccountCreds.client_email}
                                    </p>
                                    <p>Give it <strong>Editor</strong> permissions, then click 'Send'.</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium">2. Service Account Credentials (.json)</label>
                            <div className="flex items-center p-3 mt-1 rounded-md bg-danger/10 text-danger border border-danger/20">
                                <ExclamationTriangleIcon className="w-12 h-12 mr-3 flex-shrink-0"/>
                                <div className="text-xs">
                                    <strong className="font-bold block">SECURITY RISK:</strong> This feature is for demonstration only. Handling private keys in a browser is insecure. Anyone with access could control your Google services. Proceed with extreme caution.
                                </div>
                            </div>
                             {user?.driveServiceAccountCreds?.client_email ? (
                                <div className="mt-2 flex justify-between items-center bg-success/10 text-success p-2 rounded-md">
                                    <p className="text-sm font-medium flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2" />Credentials for <strong>{user.driveServiceAccountCreds.client_email}</strong> are set.</p>
                                    <button onClick={handleRemoveCreds} className="text-xs font-semibold text-danger hover:underline">Remove</button>
                                </div>
                             ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                                    <label className="flex-grow w-full flex items-center gap-2 p-2 bg-surface rounded-md border border-accent cursor-pointer hover:border-primary">
                                        <DocumentArrowUpIcon className="w-5 h-5 text-text-secondary" />
                                        <span className="text-text-secondary truncate">{credFileName || 'Select a .json file...'}</span>
                                        <input type="file" accept="application/json" onChange={handleCredFileChange} className="hidden"/>
                                    </label>
                                    <button onClick={handleSaveCreds} disabled={!credFile} className="w-full sm:w-auto px-4 py-2 bg-primary text-white font-semibold rounded-md flex items-center justify-center disabled:bg-accent disabled:text-text-secondary">
                                        <CheckCircleIcon className={`w-5 h-5 mr-2 transition-transform duration-300 ${showCredsSaved ? 'scale-100' : 'scale-0'}`} />
                                        {showCredsSaved ? 'Saved!' : 'Save Credentials'}
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
            
             <div className="mt-4 bg-background p-3 rounded-lg border border-accent space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">Uncategorized Files from Drive</h3>
                    <button onClick={handleSyncDrive} disabled={isLoading || !user?.driveFolderId || !user?.driveServiceAccountCreds} className="bg-primary/20 text-primary font-semibold py-2 px-4 rounded-md flex items-center justify-center disabled:bg-accent disabled:text-text-secondary">
                        <ArrowPathIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Syncing...' : 'Sync with Drive'}
                    </button>
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {uncategorizedFiles.length > 0 ? uncategorizedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-surface p-2 rounded-md">
                            <div className="flex items-center gap-3 truncate">
                                {file.thumbnailLink ? <img src={file.thumbnailLink} alt="thumbnail" className="w-8 h-8 rounded object-cover flex-shrink-0"/> : <DocumentDuplicateIcon className="w-6 h-6 text-text-secondary flex-shrink-0"/> }
                                <span className="truncate" title={file.name}>{file.name}</span>
                            </div>
                            <button onClick={() => setDocToCategorize(file)} className="text-sm font-semibold text-primary hover:underline flex-shrink-0 ml-2">Categorize</button>
                        </div>
                    )) : (
                        <p className="text-center text-sm text-text-secondary py-4">
                            {isLoading ? 'Loading...' : (driveFiles.length > 0 ? 'All files are categorized!' : 'Sync to see files from your Drive folder.')}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold text-text-primary">Archived Documents</h3>
                <div className="bg-background p-3 rounded-lg border border-accent flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow"><MagnifyingGlassIcon className="w-5 h-5 absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary" /><input type="text" placeholder="Search by name or chapter..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="w-full p-2 pl-10 bg-surface border border-accent rounded-md" /></div>
                    <select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))} className="p-2 bg-surface border-accent rounded-md"><option value="All">All Subjects</option><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Math">Math</option><option value="Other">Other</option></select>
                    <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="p-2 bg-surface border-accent rounded-md"><option value="All">All Types</option><option>Notes</option><option>Test Paper</option><option>Question Bank</option><option>Other</option></select>
                </div>
            </div>

            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredDocuments.map(doc => (
                    <div key={doc.id} className="bg-background p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <p className="font-bold text-text-primary">{doc.name}</p>
                            <p className="text-sm text-text-secondary">{doc.subject} &bull; {doc.subject === 'Other' ? doc.description : doc.chapter}</p>
                            <p className="text-xs text-text-secondary/70">Added: {new Date(doc.dateAdded).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                             <span className="text-xs font-semibold bg-accent px-2 py-1 rounded-full text-text-secondary">{doc.type}</span>
                             <button onClick={() => setDocToView(doc)} className="p-2 rounded-md hover:bg-accent" title="View Document"><EyeIcon className="w-5 h-5" /></button>
                             <a href={`https://drive.google.com/file/d/${doc.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent" title="Open in Google Drive"><ArrowTopRightOnSquareIcon className="w-5 h-5" /></a>
                             <button onClick={() => setDocToDelete(doc)} className="p-2 rounded-md hover:bg-accent text-danger" title="Delete Document"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
                 {filteredDocuments.length === 0 && <p className="text-center text-text-secondary py-8">No documents in your archive match the current filters.</p>}
            </div>
        </div>
    );
};

const CoachingLog: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activityTypeToLog, setActivityTypeToLog] = useState< 'lecture' | 'test' | 'other' | null>(null);
    const [activityToEdit, setActivityToEdit] = useState<CoachingLogActivity | null>(null);

    const selectedDateString = useMemo(() => formatDate(selectedDate), [selectedDate]);
    const currentLog = useMemo(() => user?.coachingLogs.find(l => l.date === selectedDateString), [user?.coachingLogs, selectedDateString]);
    
    const handleSaveActivity = (activityData: Omit<CoachingLogActivity, 'id' | 'type'>, type: 'lecture' | 'test' | 'other') => {
        updateUser(prev => {
            if (!prev) return prev;

            const updatedUser = JSON.parse(JSON.stringify(prev));

            const newActivity: CoachingLogActivity = { ...activityData, type, id: activityToEdit?.id || Date.now().toString() } as CoachingLogActivity;

            let logForToday = updatedUser.coachingLogs.find((l: CoachingLogType) => l.date === selectedDateString);
            if (!logForToday) {
                logForToday = { date: selectedDateString, activities: [], motivation: 3 };
                updatedUser.coachingLogs.push(logForToday);
            }

            if (activityToEdit) {
                const activityIndex = logForToday.activities.findIndex((a: CoachingLogActivity) => a.id === activityToEdit.id);
                if (activityIndex > -1) {
                    logForToday.activities[activityIndex] = newActivity;
                }
            } else {
                logForToday.activities.push(newActivity);
            }

            if (type === 'lecture') {
                const lectureData = activityData as Omit<CoachingLecture, 'id' | 'type'>;
                if (lectureData.homework.trim()) {
                    let todayPlan = updatedUser.dailyPlans.find((p: DailyPlan) => p.date === selectedDateString);
                    if (!todayPlan) {
                        todayPlan = { date: selectedDateString, subjectPlans: { Physics: [], Chemistry: [], Math: [] }, schedule: [], tasks: [], isReviewed: false, wakeUpTime: '06:00', sleepTime: '23:00', questionsSolved: [] };
                        updatedUser.dailyPlans.push(todayPlan);
                    }
                    const homeworkTask: DailyPlanTask = { id: `hw-${newActivity.id}`, text: `HW from ${lectureData.teacher}'s class: ${lectureData.homework}`, status: 'Pending' };
                    if (!todayPlan.tasks.some((t: DailyPlanTask) => t.text === homeworkTask.text)) { todayPlan.tasks.push(homeworkTask); }
                }
                if (lectureData.doubts.trim()) {
                    const doubtEntries = lectureData.doubts.trim().split('\n').filter((d: string) => d.trim());
                    doubtEntries.forEach((d: string) => {
                        const newDoubt: Doubt = { id: Date.now().toString() + d, subject: lectureData.subject, topic: lectureData.chapter, description: d, date: selectedDateString, status: 'Still Confusing', context: `From ${lectureData.teacher}'s class on ${lectureData.chapter}` };
                        updatedUser.doubts.push(newDoubt);
                    });
                }
                if (lectureData.subtopicsTaught.length > 0) {
                    const subjectData = updatedUser.topics[lectureData.subject.toLowerCase() as keyof typeof updatedUser.topics];
                    const chapters = 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.flatMap((s: any) => s.chapters);
                    const chapter = chapters.find((c: any) => c.name === lectureData.chapter);
                    if (chapter) {
                        chapter.majorTopics.forEach((mt: any) => mt.subtopics.forEach((st: any) => {
                            if (lectureData.subtopicsTaught.includes(st.name) && st.coachingStatus === TopicStatus.NotStarted) {
                                st.coachingStatus = TopicStatus.InProgress;
                            }
                        }));
                    }
                }
            }

            updatedUser.coachingLogs.sort((a: CoachingLogType, b: CoachingLogType) => new Date(a.date).getTime() - new Date(b.date).getTime());
            updatedUser.dailyPlans.sort((a: DailyPlan, b: DailyPlan) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return updatedUser;
        });

        setActivityTypeToLog(null);
        setActivityToEdit(null);
    };

    const handleDeleteActivity = (id: string) => {
        updateUser(prev => {
            if (!prev) return prev;
            const updatedUser = JSON.parse(JSON.stringify(prev));
            const log = updatedUser.coachingLogs.find((l: CoachingLogType) => l.date === selectedDateString);
            if (log) {
                log.activities = log.activities.filter((a: CoachingLogActivity) => a.id !== id);
            }
            return updatedUser;
        });
    };

    const handleMotivationChange = (motivation: number) => {
        updateUser(prev => {
            if (!prev) return prev;
            const updatedUser = JSON.parse(JSON.stringify(prev));
            let log = updatedUser.coachingLogs.find((l: CoachingLogType) => l.date === selectedDateString);
            if (log) {
                log.motivation = motivation;
            } else {
                log = { date: selectedDateString, activities: [], motivation: motivation };
                updatedUser.coachingLogs.push(log);
                updatedUser.coachingLogs.sort((a: CoachingLogType, b: CoachingLogType) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }
            return updatedUser;
        });
    };

    const motivationEmojis = ['❓', '😞', '😐', '🙂', '😊', '😄'];

    return (
        <div className="space-y-6">
            {activityTypeToLog === 'lecture' && <LectureFormModal onClose={() => { setActivityTypeToLog(null); setActivityToEdit(null); }} onSave={(data) => handleSaveActivity(data, 'lecture')} initialLecture={activityToEdit as CoachingLecture} />}
            {activityTypeToLog === 'test' && <TestLogModal onClose={() => setActivityTypeToLog(null)} onSave={(data) => handleSaveActivity(data, 'test')} />}
            {activityTypeToLog === 'other' && <OtherActivityModal onClose={() => setActivityTypeToLog(null)} onSave={(data) => handleSaveActivity(data, 'other')} />}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <BuildingLibraryIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Coaching Log</h1>
                </div>
                <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                    <input type="date" value={selectedDateString} onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} className="p-2 bg-surface border border-accent rounded-md w-full sm:w-auto"/>
                    <button onClick={() => setSelectedDate(new Date())} className="text-sm font-semibold px-3 py-2 bg-accent rounded-md hover:bg-primary/20 whitespace-nowrap">Today</button>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-lg border border-accent">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-text-primary text-center sm:text-left">{formatDateToDisplay(selectedDateString)}</h2>
                    <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                         <button onClick={() => setActivityTypeToLog('lecture')} className="flex items-center bg-primary/20 text-primary p-2 sm:py-2 sm:px-3 rounded-md font-semibold hover:bg-primary/30 text-sm">
                            <BookOpenIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">Log Lecture</span>
                         </button>
                         <button onClick={() => setActivityTypeToLog('test')} className="flex items-center bg-indigo-500/20 text-indigo-500 p-2 sm:py-2 sm:px-3 rounded-md font-semibold hover:bg-indigo-500/30 text-sm">
                            <AcademicCapIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">Log Test</span>
                         </button>
                         <button onClick={() => setActivityTypeToLog('other')} className="flex items-center bg-purple-500/20 text-purple-500 p-2 sm:py-2 sm:px-3 rounded-md font-semibold hover:bg-purple-500/30 text-sm">
                            <SparklesIcon className="w-5 h-5 sm:mr-1" /> <span className="hidden sm:inline">Log Other</span>
                         </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentLog?.activities.map(activity => (
                        <div key={activity.id} className="bg-background p-4 rounded-lg">
                            {activity.type === 'lecture' && (
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1"><BookOpenIcon className="w-5 h-5 text-primary" /><span className="font-bold">{activity.subject}: {activity.chapter}</span></div>
                                        <p className="text-sm text-text-secondary">w/ {activity.teacher} ({formatTimeToAMPM(activity.startTime)} - {formatTimeToAMPM(activity.endTime)})</p>
                                        <p className="text-sm text-text-secondary">Topics: {activity.subtopicsTaught.join(', ') || 'N/A'}</p>
                                        {activity.remarks && <p className="text-sm italic mt-1">"{activity.remarks}"</p>}
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0">
                                        <div className="flex">{[1,2,3,4,5].map(r => <StarIcon key={r} className={`w-5 h-5 ${r <= activity.rating ? 'text-amber-400' : 'text-gray-300'}`} />)}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setActivityToEdit(activity); setActivityTypeToLog('lecture'); }} className="text-secondary hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteActivity(activity.id)} className="text-secondary hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                             {activity.type === 'test' && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1"><AcademicCapIcon className="w-5 h-5 text-indigo-500" /><span className="font-bold">Test: {activity.testName}</span></div>
                                        <p className="text-sm text-text-secondary">{formatTimeToAMPM(activity.startTime)} - {formatTimeToAMPM(activity.endTime)}</p>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <button className="text-secondary hover:text-danger" onClick={() => handleDeleteActivity(activity.id)}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                             {activity.type === 'other' && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1"><SparklesIcon className="w-5 h-5 text-purple-500" /><span className="font-bold">{activity.description}</span></div>
                                        <p className="text-sm text-text-secondary">{formatTimeToAMPM(activity.startTime)} - {formatTimeToAMPM(activity.endTime)}</p>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <button className="text-secondary hover:text-danger" onClick={() => handleDeleteActivity(activity.id)}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {!currentLog || currentLog.activities.length === 0 && <p className="text-center text-text-secondary py-8">No coaching activities logged for this day.</p>}
                </div>

                <div className="mt-6 pt-4 border-t border-accent">
                    <label className="text-lg font-semibold text-text-primary">Overall Motivation Today</label>
                    <div className="flex items-center justify-around mt-2">
                        {[1,2,3,4,5].map(m => (
                            <button key={m} onClick={() => handleMotivationChange(m)} className={`text-4xl p-2 rounded-full transition-transform hover:scale-125 ${currentLog?.motivation === m ? 'bg-primary/20 scale-125' : ''}`}>
                                {motivationEmojis[m]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <DocumentsManager />
        </div>
    );
};

export default CoachingLog;