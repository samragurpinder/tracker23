

import React, { useContext, useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserContext } from '../App';
import { TestResult, TestType, Chapter, TestSyllabusItem, UpcomingTest, User, SubjectName } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { XMarkIcon, PlusIcon, DocumentArrowUpIcon, LinkIcon, PencilIcon, TrashIcon, AcademicCapIcon, CalendarDaysIcon, ChevronDownIcon, ClockIcon, CheckCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { listFilesFromDrive } from '../services/driveService';

// --- Analytics Data & Functions ---
const jeeMainsPercentileData: { marks: [number, number]; percentile: [number, number] }[] = [
    { marks: [281, 300], percentile: [99.999, 100] }, { marks: [270, 280], percentile: [99.991, 99.994] },
    { marks: [262, 269], percentile: [99.977, 99.990] }, { marks: [250, 261], percentile: [99.960, 99.975] },
    { marks: [240, 249], percentile: [99.935, 99.956] }, { marks: [230, 239], percentile: [99.901, 99.928] },
    { marks: [220, 229], percentile: [99.851, 99.893] }, { marks: [210, 219], percentile: [99.795, 99.845] },
    { marks: [200, 209], percentile: [99.710, 99.782] }, { marks: [190, 199], percentile: [99.597, 99.688] },
    { marks: [180, 189], percentile: [99.456, 99.573] }, { marks: [170, 179], percentile: [99.272, 99.431] },
    { marks: [160, 169], percentile: [99.028, 99.239] }, { marks: [150, 159], percentile: [98.732, 98.990] },
    { marks: [140, 149], percentile: [98.317, 98.666] }, { marks: [130, 139], percentile: [97.811, 98.254] },
    { marks: [120, 129], percentile: [97.142, 97.685] }, { marks: [110, 119], percentile: [96.204, 96.978] },
    { marks: [100, 109], percentile: [94.998, 96.064] }, { marks: [90, 99], percentile: [93.471, 94.749] },
    { marks: [80, 89], percentile: [91.072, 93.152] }, { marks: [70, 79], percentile: [87.512, 90.702] },
    { marks: [60, 69], percentile: [82.016, 86.907] }, { marks: [50, 59], percentile: [73.287, 80.982] },
    { marks: [40, 49], percentile: [58.151, 71.302] }, { marks: [30, 39], percentile: [37.694, 56.569] },
    { marks: [21, 29], percentile: [13.495, 33.229] }, { marks: [0, 20], percentile: [0.843, 9.695] }
];

const jeeAdvancedRankData: { marks: [number, number]; rank: string }[] = [
    { marks: [278, Infinity], rank: '1 - 101' }, { marks: [262, 277], rank: '201 - 500' },
    { marks: [234, 261], rank: '501 - 1000' }, { marks: [208, 233], rank: '1001 - 1500' },
    { marks: [193, 207], rank: '1501 - 2000' }, { marks: [181, 192], rank: '1501 - 2000' },
    { marks: [172, 180], rank: '2001 - 2500' }, { marks: [165, 171], rank: '2501 - 3000' },
    { marks: [154, 164], rank: '3001 - 4000' }, { marks: [149, 153], rank: '4001 - 4500' },
    { marks: [145, 148], rank: '4501 - 5000' }, { marks: [135, 144], rank: '5001 - 6701' },
    { marks: [120, 134], rank: '6801 - 9901' }, { marks: [110, 119], rank: '10001 - 13001' },
    { marks: [105, 109], rank: '13101 - 14901' }, { marks: [100, 104], rank: '15001 - 17001' },
    { marks: [94, 99], rank: '17101 - 19901' }, { marks: [86, 93], rank: '20001 - 24901' },
    { marks: [80, 85], rank: '25001 - 29101' }, { marks: [74, 79], rank: '29201 - 33801' },
    { marks: [0, 73], rank: '> 33801' }
];

const getJeeMainsPercentile = (score: number): string => {
    const range = jeeMainsPercentileData.find(d => score >= d.marks[0] && score <= d.marks[1]);
    if (!range) return "N/A";
    if (range.percentile[0] === 99.999) return "99.999+";
    const avgPercentile = (range.percentile[0] + range.percentile[1]) / 2;
    return `~ ${avgPercentile.toFixed(3)}`;
};

const calculateRank = (percentile: number, totalStudents: number): string => {
    if (isNaN(percentile)) return "N/A";
    const rank = Math.round((100 - percentile) / 100 * totalStudents);
    return `~ ${rank.toLocaleString()}`;
};

const getJeeAdvancedRank = (score: number): string => {
    const range = jeeAdvancedRankData.find(d => score >= d.marks[0] && score <= d.marks[1]);
    return range ? range.rank : "N/A";
};

const formatDateToDDMMYYYY = (date: Date | string): string => {
    const d = typeof date === 'string' && !date.includes('T') ? new Date(`${date}T00:00:00`) : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatTimeToAMPM = (time: string): string => { 
    if (!time || !time.includes(':')) return '';
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${String(formattedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
};

// --- Reusable Components ---
const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string, maxWidth?: string }> = ({ children, onClose, title, maxWidth = 'max-w-3xl' }) => {
     useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => { 
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} p-6 relative max-h-[90vh] flex flex-col transition-transform duration-300 scale-95 animate-fade-in`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">{title}</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('popover-root')!
    );
};

const Countdown: React.FC<{ targetDate: string, targetTime: string }> = ({ targetDate, targetTime }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(`${targetDate}T${targetTime || '00:00'}`) - +new Date();
        let timeLeft: { [key: string]: number } = {};
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setTimeout(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
        return () => clearTimeout(timer);
    });
    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => (
        <div key={interval} className="text-center p-2 bg-background rounded-lg min-w-[60px]">
            <span className="text-2xl font-bold text-primary">{String(value).padStart(2, '0')}</span>
            <span className="text-xs block text-text-secondary capitalize">{interval}</span>
        </div>
    ));
    return (
        <div className="flex justify-center gap-2 mt-2">
            {timerComponents.length ? timerComponents : <span className="text-danger font-semibold p-4">Time's up! Good luck!</span>}
        </div>
    );
};

// --- Form Components ---
const UpcomingTestForm: React.FC<{
    initialState: Partial<UpcomingTest>;
    onSubmit: (test: Omit<UpcomingTest, 'id'>) => void;
    onClose: () => void;
    user: User | null;
}> = ({ initialState, onSubmit, onClose, user }) => {
    const [form, setForm] = useState({
        name: initialState.name || '',
        date: initialState.date || new Date().toISOString().split('T')[0],
        time: initialState.time || '09:00',
        type: initialState.type || 'JEE Mains',
        totalMarks: initialState.totalMarks?.toString() || '300',
        targetMarks: initialState.targetMarks?.toString() || '250',
        testScope: initialState.testScope || 'Full Syllabus',
        customSyllabus: initialState.customSyllabus || '',
    });
    const [syllabus, setSyllabus] = useState<TestSyllabusItem[]>(initialState.syllabus || []);
    const allChapters = useMemo(() => !user ? { Physics: [], Chemistry: [], Math: [] } : { Physics: user.topics.physics.chapters.map(c => c.name), Chemistry: user.topics.chemistry.sections.flatMap(s => s.chapters).map(c => c.name), Math: user.topics.math.chapters.map(c => c.name) }, [user]);

    const handleSyllabusChange = (subject: string, chapter: string, checked: boolean) => setSyllabus(prev => checked ? [...prev, { subject, chapter }] : prev.filter(s => !(s.subject === subject && s.chapter === chapter)));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...form, totalMarks: Number(form.totalMarks) || 0, targetMarks: Number(form.targetMarks) || 0, type: form.type as TestType, syllabus });
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary";
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Test Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputStyle} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputStyle} required />
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className={inputStyle} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputStyle}>
                    {(['JEE Mains', 'JEE Advanced', 'Board'] as TestType[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.testScope} onChange={e => setForm({...form, testScope: e.target.value})} className={inputStyle}>
                    <option>Full Syllabus</option><option>Part Syllabus</option><option>Chapter-wise</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Max Marks" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: e.target.value})} className={inputStyle} required />
                <input type="number" placeholder="Target Marks" value={form.targetMarks} onChange={e => setForm({...form, targetMarks: e.target.value})} className={inputStyle} required />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Syllabus</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto bg-background p-3 rounded-lg border border-accent">
                    {(Object.keys(allChapters) as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <h4 className="font-bold text-text-primary mb-1">{subject}</h4>
                            <div className="space-y-1">{allChapters[subject].map(chapter => (<label key={chapter} className="flex items-center space-x-2 text-sm text-text-secondary cursor-pointer"><input type="checkbox" checked={syllabus.some(s => s.subject === subject && s.chapter === chapter)} onChange={e => handleSyllabusChange(subject, chapter, e.target.checked)} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary"/><span>{chapter}</span></label>))}</div>
                        </div>
                    ))}
                </div>
            </div>
            <textarea placeholder="Custom syllabus notes..." value={form.customSyllabus} onChange={e => setForm({...form, customSyllabus: e.target.value})} className={`${inputStyle} h-20`}></textarea>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-primary-light transition-transform hover:scale-105">Save Test</button>
        </form>
    );
};

const TestForm: React.FC<{
    initialState: Partial<TestResult>;
    onSubmit: (test: Partial<TestResult>, completedUpcomingTestId?: string) => void;
    onClose: () => void;
    isEdit: boolean;
    upcomingTests: UpcomingTest[];
    user: User | null;
}> = ({ initialState, onSubmit, onClose, isEdit, upcomingTests, user }) => {
    const [form, setForm] = useState({
        name: initialState.name || '',
        date: initialState.date || new Date().toISOString().split('T')[0],
        type: initialState.type || 'JEE Mains',
        physics: initialState.marks?.physics.toString() || '',
        chemistry: initialState.marks?.chemistry.toString() || '',
        math: initialState.marks?.math.toString() || '',
        negPhysics: initialState.negativeMarks?.physics.toString() || '0',
        negChemistry: initialState.negativeMarks?.chemistry.toString() || '0',
        negMath: initialState.negativeMarks?.math.toString() || '0',
        totalMarks: initialState.totalMarks?.toString() || '300',
        feedback: initialState.feedback || '',
        learnings: initialState.learnings || '',
        classRank: initialState.classRank?.toString() || '',
        testScope: initialState.testScope || 'Full Syllabus',
    });
    const [syllabus, setSyllabus] = useState<TestSyllabusItem[]>(initialState.syllabus || []);
    const [customSyllabus, setCustomSyllabus] = useState(initialState.customSyllabus || '');
    const [pdfFileId, setPdfFileId] = useState(initialState.testPdfFileId || '');
    const [selectedUpcomingTestId, setSelectedUpcomingTestId] = useState('');
    const [driveFiles, setDriveFiles] = useState<{id: string, name: string}[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const allChapters = useMemo(() => !user ? { Physics: [], Chemistry: [], Math: [] } : { Physics: user.topics.physics.chapters.map(c => c.name), Chemistry: user.topics.chemistry.sections.flatMap(s => s.chapters).map(c => c.name), Math: user.topics.math.chapters.map(c => c.name) }, [user]);

    useEffect(() => {
        const fetchDriveFiles = async () => {
            if (user?.driveFolderId && user?.driveServiceAccountCreds) {
                setIsLoadingFiles(true);
                try {
                    const files = await listFilesFromDrive(user.driveServiceAccountCreds, user.driveFolderId);
                    const relevantFiles = files
                        .filter(file => ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimeType))
                        .map(file => ({ id: file.id, name: file.name }));
                    setDriveFiles(relevantFiles);
                } catch (error) {
                    console.error("Failed to fetch files from Drive:", error);
                } finally {
                    setIsLoadingFiles(false);
                }
            }
        };
        fetchDriveFiles();
    }, [user]);

    useEffect(() => {
        if (selectedUpcomingTestId) {
            const selectedTest = upcomingTests.find(t => t.id === selectedUpcomingTestId);
            if (selectedTest) {
                setForm(prev => ({ ...prev, name: selectedTest.name, date: selectedTest.date, type: selectedTest.type, testScope: selectedTest.testScope || 'Part Syllabus', totalMarks: selectedTest.totalMarks.toString() }));
                setSyllabus(selectedTest.syllabus || []);
                setCustomSyllabus(selectedTest.customSyllabus || '');
            }
        } else if (!isEdit) {
             setForm({
                name: '', date: new Date().toISOString().split('T')[0], type: 'JEE Mains',
                physics: '', chemistry: '', math: '',
                negPhysics: '0', negChemistry: '0', negMath: '0',
                totalMarks: '300', feedback: '', learnings: '', classRank: '', testScope: 'Full Syllabus',
            });
            setSyllabus([]);
            setCustomSyllabus('');
        }
    }, [selectedUpcomingTestId, upcomingTests, isEdit]);

    const handleSyllabusChange = (subject: string, chapter: string, checked: boolean) => setSyllabus(prev => checked ? [...prev, { subject, chapter }] : prev.filter(s => !(s.subject === subject && s.chapter === chapter)));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submittedTest: Partial<TestResult> = {
            name: form.name, date: form.date, type: form.type as TestType,
            marks: { 
                physics: Number(form.physics) || 0, 
                chemistry: Number(form.chemistry) || 0, 
                math: Number(form.math) || 0 
            },
            negativeMarks: {
                physics: Number(form.negPhysics) || 0,
                chemistry: Number(form.negChemistry) || 0,
                math: Number(form.negMath) || 0,
            },
            totalMarks: Number(form.totalMarks) || 0,
            feedback: form.feedback, learnings: form.learnings,
            testPdfFileId: pdfFileId,
            classRank: Number(form.classRank) || null,
            testScope: form.testScope,
            syllabus: syllabus,
            customSyllabus: customSyllabus,
        };
        onSubmit(submittedTest, selectedUpcomingTestId || undefined);
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary";
    const textareaStyle = `${inputStyle} h-24 resize-none`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
            {!isEdit && (
                <div>
                    <label className="text-sm font-medium text-text-primary">Link to Upcoming Test (Optional)</label>
                    <select value={selectedUpcomingTestId} onChange={e => setSelectedUpcomingTestId(e.target.value)} className={inputStyle}>
                        <option value="">-- Add a new test result --</option>
                        {upcomingTests.map(test => <option key={test.id} value={test.id}>{test.name} ({formatDateToDDMMYYYY(test.date)})</option>)}
                    </select>
                </div>
            )}
            <input type="text" placeholder="Test Name (e.g., AITS-3)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputStyle} required />
            <div>
                <label className="text-sm font-medium text-text-primary">Gross Marks (Before Negatives)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                    <input type="number" placeholder="Physics Gross" value={form.physics} onChange={e => setForm({...form, physics: e.target.value})} className={inputStyle} required />
                    <input type="number" placeholder="Chemistry Gross" value={form.chemistry} onChange={e => setForm({...form, chemistry: e.target.value})} className={inputStyle} required />
                    <input type="number" placeholder="Math Gross" value={form.math} onChange={e => setForm({...form, math: e.target.value})} className={inputStyle} required />
                </div>
            </div>
             <div>
                <label className="text-sm font-medium text-text-primary">Negative Marks</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                    <input type="number" placeholder="Physics Negative" value={form.negPhysics} onChange={e => setForm({...form, negPhysics: e.target.value})} className={inputStyle} />
                    <input type="number" placeholder="Chemistry Negative" value={form.negChemistry} onChange={e => setForm({...form, negChemistry: e.target.value})} className={inputStyle} />
                    <input type="number" placeholder="Math Negative" value={form.negMath} onChange={e => setForm({...form, negMath: e.target.value})} className={inputStyle} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Max Test Marks" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: e.target.value})} className={inputStyle} required />
                 <input type="number" placeholder="Class Rank (Optional)" value={form.classRank} onChange={e => setForm({...form, classRank: e.target.value})} className={inputStyle} />
            </div>
            <select value={form.testScope} onChange={e => setForm({...form, testScope: e.target.value})} className={inputStyle}>
                <option>Full Syllabus</option> <option>Part Syllabus</option> <option>Chapter-wise</option>
            </select>
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Syllabus</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto bg-background p-3 rounded-lg border border-accent">
                    {(Object.keys(allChapters) as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <h4 className="font-bold text-text-primary mb-1">{subject}</h4>
                            <div className="space-y-1">{allChapters[subject].map(chapter => (<label key={chapter} className="flex items-center space-x-2 text-sm text-text-secondary cursor-pointer"><input type="checkbox" checked={syllabus.some(s => s.subject === subject && s.chapter === chapter)} onChange={e => handleSyllabusChange(subject, chapter, e.target.checked)} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary"/><span>{chapter}</span></label>))}</div>
                        </div>
                    ))}
                </div>
            </div>
            <textarea placeholder="Custom syllabus notes..." value={customSyllabus} onChange={e => setCustomSyllabus(e.target.value)} className={`${inputStyle} h-20`}></textarea>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea placeholder="My Feedback..." value={form.feedback} onChange={e => setForm({...form, feedback: e.target.value})} className={textareaStyle}></textarea>
                <textarea placeholder="What I Learnt..." value={form.learnings} onChange={e => setForm({...form, learnings: e.target.value})} className={textareaStyle}></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Test Paper PDF (from Drive)</label>
                <select 
                    value={pdfFileId} 
                    onChange={e => setPdfFileId(e.target.value)} 
                    className={inputStyle}
                    disabled={isLoadingFiles}
                >
                    <option value="">{isLoadingFiles ? 'Loading files...' : '-- Select a file --'}</option>
                    {driveFiles.map(file => (
                        <option key={file.id} value={file.id}>{file.name}</option>
                    ))}
                </select>
                {(!user?.driveFolderId || !user?.driveServiceAccountCreds) && (
                    <p className="text-xs text-warning mt-1">Setup Drive Integration in the Coaching Log to select a test paper.</p>
                )}
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-primary-light transition-transform hover:scale-105">{isEdit ? 'Update Test' : 'Add Test Result'}</button>
        </form>
    );
};

const TestDetailContent: React.FC<{ test: TestResult }> = ({ test }) => {
    const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
    const netPhysics = test.marks.physics - neg.physics;
    const netChemistry = test.marks.chemistry - neg.chemistry;
    const netMath = test.marks.math - neg.math;
    const totalScore = netPhysics + netChemistry + netMath;

    const mainsPercentile = test.type === 'JEE Mains' ? getJeeMainsPercentile(totalScore) : null;
    const mainsRank = mainsPercentile ? calculateRank(parseFloat(mainsPercentile.replace('~', '')), 1600000) : null;
    const advancedRank = test.type === 'JEE Advanced' ? getJeeAdvancedRank(totalScore) : null;
    
    const driveId = test.testPdfFileId;

    const scoreData = useMemo(() => [
        { name: 'Physics', value: Math.max(0, netPhysics), fill: '#3b82f6' },
        { name: 'Chemistry', value: Math.max(0, netChemistry), fill: '#10b981' },
        { name: 'Math', value: Math.max(0, netMath), fill: '#f59e0b' },
    ], [netPhysics, netChemistry, netMath]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-background p-4 rounded-lg">
                <div><p className="text-sm text-text-secondary">Date</p><p className="text-lg font-semibold text-text-primary">{formatDateToDDMMYYYY(test.date)}</p></div>
                <div><p className="text-sm text-text-secondary">Type</p><p className="text-lg font-semibold text-text-primary">{test.type}</p></div>
                <div><p className="text-sm text-text-secondary">Scope</p><p className="text-lg font-semibold text-text-primary">{test.testScope}</p></div>
                <div><p className="text-sm text-text-secondary">Class Rank</p><p className="text-lg font-semibold text-text-primary">{test.classRank || 'N/A'}</p></div>
                <div><p className="text-sm text-text-secondary">Total Score</p><p className="text-2xl font-bold text-primary">{`${totalScore} / ${test.totalMarks}`}</p></div>
            </div>

            <div className="bg-background p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center"><AcademicCapIcon className="w-5 h-5 mr-2 text-primary" />Performance Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(test.type === 'JEE Mains' && mainsPercentile) && (
                        <div className="text-center bg-surface p-3 rounded-md">
                            <p className="text-sm text-text-secondary">Est. Mains Percentile</p>
                            <p className="text-xl font-bold text-primary">{mainsPercentile}</p>
                        </div>
                    )}
                     {(test.type === 'JEE Mains' && mainsRank) && (
                        <div className="text-center bg-surface p-3 rounded-md">
                            <p className="text-sm text-text-secondary">Est. Mains Rank (out of 16 Lakh)</p>
                            <p className="text-xl font-bold text-primary">{mainsRank}</p>
                        </div>
                    )}
                    {(test.type === 'JEE Advanced' && advancedRank) && (
                        <div className="text-center bg-surface p-3 rounded-md sm:col-span-2">
                            <p className="text-sm text-text-secondary">Est. Advanced Rank (out of 2.5 Lakh)</p>
                            <p className="text-xl font-bold text-primary">{advancedRank}</p>
                        </div>
                    )}
                     {test.type === 'Board' && <p className="text-text-secondary text-center sm:col-span-2">Rank analysis is not available for Board exams.</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Subject-wise Score Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead className="text-sm text-text-secondary"><tr className="border-b-2 border-accent"><th className="p-2 font-semibold text-left">Subject</th><th className="p-2 font-semibold">Gross Score</th><th className="p-2 font-semibold">Negative</th><th className="p-2 font-semibold">Net Score</th></tr></thead>
                            <tbody>
                                <tr className="border-b border-accent/50"><td className="p-2 font-medium text-left">Physics</td><td>{test.marks.physics}</td><td className="text-danger">-{neg.physics}</td><td className="font-bold">{netPhysics}</td></tr>
                                <tr className="border-b border-accent/50"><td className="p-2 font-medium text-left">Chemistry</td><td>{test.marks.chemistry}</td><td className="text-danger">-{neg.chemistry}</td><td className="font-bold">{netChemistry}</td></tr>
                                <tr><td className="p-2 font-medium text-left">Math</td><td>{test.marks.math}</td><td className="text-danger">-{neg.math}</td><td className="font-bold">{netMath}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-background p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 text-center">Score Contribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={scoreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {scoreData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `${(value as number).toFixed(2)} marks`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>


            {(test.syllabus?.length > 0 || test.customSyllabus) && <div className="bg-background p-4 rounded-lg"><h3 className="text-lg font-semibold text-text-primary mb-2">Syllabus</h3>{test.syllabus?.length > 0 && <ul className="list-disc list-inside text-text-secondary space-y-1">{test.syllabus.map(s => <li key={`${s.subject}-${s.chapter}`}>{s.subject}: {s.chapter}</li>)}</ul>}{test.customSyllabus && <p className="text-text-secondary mt-2"><b>Custom:</b> {test.customSyllabus}</p>}</div>}
            {test.feedback && <div className="bg-background p-4 rounded-lg"><h3 className="text-lg font-semibold text-text-primary mb-1">Feedback</h3><p className="text-text-secondary whitespace-pre-wrap">{test.feedback}</p></div>}
            {test.learnings && <div className="bg-background p-4 rounded-lg"><h3 className="text-lg font-semibold text-text-primary mb-1">Learnings</h3><p className="text-text-secondary whitespace-pre-wrap">{test.learnings}</p></div>}
             {driveId && (
                <div className="bg-background p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Test Paper PDF</h3>
                    <div className="w-full h-[80vh] rounded-lg overflow-hidden border border-accent">
                        <iframe src={`https://drive.google.com/file/d/${driveId}/preview`} width="100%" height="100%"></iframe>
                    </div>
                     <a href={`https://drive.google.com/file/d/${driveId}/view`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark underline flex items-center mt-2">
                         <LinkIcon className="w-4 h-4 mr-2" /> Open in New Tab
                     </a>
                </div>
            )}
        </div>
    );
};

const AdvancedAnalytics: React.FC<{ tests: TestResult[] }> = ({ tests }) => {
    const subjectPerformance = useMemo(() => {
        if (tests.length === 0) return [];
        const data: { [key in SubjectName]: { score: number, negative: number, max: number, count: number } } = { 
            Physics: { score: 0, negative: 0, max: 0, count: 0 }, 
            Chemistry: { score: 0, negative: 0, max: 0, count: 0 }, 
            Math: { score: 0, negative: 0, max: 0, count: 0 }
        };
        
        tests.forEach(test => {
            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
            const maxPerSubject = test.totalMarks > 0 ? test.totalMarks / 3 : 100;
            
            data.Physics.score += test.marks.physics - neg.physics;
            data.Physics.negative += neg.physics;
            data.Physics.max += maxPerSubject;
            data.Physics.count++;
            
            data.Chemistry.score += test.marks.chemistry - neg.chemistry;
            data.Chemistry.negative += neg.chemistry;
            data.Chemistry.max += maxPerSubject;
            data.Chemistry.count++;

            data.Math.score += test.marks.math - neg.math;
            data.Math.negative += neg.math;
            data.Math.max += maxPerSubject;
            data.Math.count++;
        });

        return [
            { subject: 'Physics', '% Score': data.Physics.max > 0 ? Math.max(0, (data.Physics.score / data.Physics.max) * 100) : 0, 'Avg Negative': data.Physics.count > 0 ? data.Physics.negative / data.Physics.count : 0 },
            { subject: 'Chemistry', '% Score': data.Chemistry.max > 0 ? Math.max(0, (data.Chemistry.score / data.Chemistry.max) * 100) : 0, 'Avg Negative': data.Chemistry.count > 0 ? data.Chemistry.negative / data.Chemistry.count : 0 },
            { subject: 'Math', '% Score': data.Math.max > 0 ? Math.max(0, (data.Math.score / data.Math.max) * 100) : 0, 'Avg Negative': data.Math.count > 0 ? data.Math.negative / data.Math.count : 0 },
        ];
    }, [tests]);

    const negativeVsScore = useMemo(() => {
        return tests.map(test => {
            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
            return {
                negative: neg.physics + neg.chemistry + neg.math,
                score: (test.marks.physics - neg.physics) + (test.marks.chemistry - neg.chemistry) + (test.marks.math - neg.math),
            }
        });
    }, [tests]);
    
    if (tests.length === 0) {
        return (
            <div className="bg-surface p-6 rounded-xl shadow-md border border-accent text-center text-text-secondary">
                <h2 className="text-xl font-bold text-text-primary mb-4">Advanced Analytics</h2>
                <p>Log some more tests to see advanced analytics.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md border border-accent">
            <h2 className="text-xl font-bold text-text-primary mb-4">Advanced Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold text-center mb-2">Subject Performance vs. Negative Marks</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={subjectPerformance}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey="subject" tick={{ fill: '#475569' }}/>
                             <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: '% Score', angle: -90, position: 'insideLeft' }} />
                             <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Avg Negative', angle: 90, position: 'insideRight' }}/>
                             <Tooltip />
                             <Legend />
                             <Bar yAxisId="left" dataKey="% Score" fill="#3b82f6" />
                             <Bar yAxisId="right" dataKey="Avg Negative" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-center mb-2">Total Negative Marks vs. Final Score</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <ScatterChart>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis type="number" dataKey="negative" name="Negative Marks" unit="" tick={{ fill: '#475569' }} />
                             <YAxis type="number" dataKey="score" name="Final Score" unit="" tick={{ fill: '#475569' }}/>
                             <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                             <Scatter name="Tests" data={negativeVsScore} fill="#8b5cf6" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const UpcomingTestsManager: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [testToEdit, setTestToEdit] = useState<UpcomingTest | null>(null);
    const [testToDelete, setTestToDelete] = useState<UpcomingTest | null>(null);
    const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
    
    const upcomingTests = useMemo(() => {
        if (!user) return [];
        const now = new Date();
        return user.upcomingTests
            .map(test => ({ ...test, dateTime: new Date(`${test.date}T${test.time || '00:00'}`) }))
            .filter(test => test.dateTime >= now)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    }, [user]);

    const handleSave = (testData: Omit<UpcomingTest, 'id'>) => {
        updateUser(prev => {
            if (!prev) return null;
            if (testToEdit) { // Editing
                return { ...prev, upcomingTests: prev.upcomingTests.map(t => t.id === testToEdit.id ? { ...t, ...testData } : t) };
            } else { // Adding
                const newTest = { ...testData, id: Date.now().toString() };
                return { ...prev, upcomingTests: [...prev.upcomingTests, newTest] };
            }
        });
        setIsModalOpen(false);
        setTestToEdit(null);
    };

    const handleDelete = () => {
        if (!testToDelete) return;
        updateUser(prev => ({ ...prev!, upcomingTests: prev!.upcomingTests.filter(t => t.id !== testToDelete.id) }));
        setTestToDelete(null);
    };

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md border border-accent">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Upcoming Tests</h2>
                <button onClick={() => { setTestToEdit(null); setIsModalOpen(true); }} className="flex items-center bg-primary/20 text-primary py-2 px-4 rounded-md font-semibold hover:bg-primary/30 transition-transform hover:scale-105">
                    <CalendarDaysIcon className="w-5 h-5 mr-2" /> Schedule Test
                </button>
            </div>

            <div className="space-y-4">
                {upcomingTests.length > 0 ? upcomingTests.map(test => (
                    <div key={test.id} className="bg-background p-4 rounded-lg border border-accent/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-text-primary">{test.name}</p>
                                <p className="text-sm text-text-secondary">{test.type} &bull; {test.testScope}</p>
                                <p className="text-sm text-text-secondary">{formatDateToDDMMYYYY(test.date)} at {formatTimeToAMPM(test.time)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)} className="p-1 text-secondary hover:text-primary"><ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedTestId === test.id ? 'rotate-180' : ''}`} /></button>
                                <button onClick={() => { setTestToEdit(test); setIsModalOpen(true); }} className="p-1 text-secondary hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => setTestToDelete(test)} className="p-1 text-secondary hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <Countdown targetDate={test.date} targetTime={test.time} />
                        {expandedTestId === test.id && (
                             <div className="mt-4 pt-4 border-t border-accent animate-fade-in">
                                <p className="font-semibold text-text-primary">Target Marks: <span className="text-primary">{test.targetMarks} / {test.totalMarks}</span></p>
                                {(test.syllabus.length > 0 || test.customSyllabus) && (
                                    <div className="mt-2">
                                        <h4 className="font-semibold text-text-primary mb-1">Syllabus:</h4>
                                        <ul className="list-disc list-inside text-text-secondary text-sm space-y-1">{test.syllabus.map(s => <li key={`${s.subject}-${s.chapter}`}>{s.subject}: {s.chapter}</li>)}</ul>
                                        {test.customSyllabus && <p className="text-text-secondary text-sm mt-1"><b>Notes:</b> {test.customSyllabus}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )) : <p className="text-center text-text-secondary py-4">No tests scheduled. Get planning!</p>}
            </div>

            {isModalOpen && (
                <Modal onClose={() => { setIsModalOpen(false); setTestToEdit(null); }} title={testToEdit ? "Edit Upcoming Test" : "Schedule New Test"} maxWidth="max-w-3xl">
                    <UpcomingTestForm initialState={testToEdit || {}} onSubmit={handleSave} onClose={() => setIsModalOpen(false)} user={user} />
                </Modal>
            )}
            {testToDelete && (
                 <Modal onClose={() => setTestToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md">
                    <p className="text-text-secondary my-2">Are you sure you want to delete the scheduled test "{testToDelete.name}"?</p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => setTestToDelete(null)} className="px-4 py-2 bg-accent text-text-secondary rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600">Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const CustomGraphTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-surface p-3 rounded-lg shadow-lg border border-accent">
                <p className="font-bold text-text-primary">{data.name}</p>
                <p className="text-sm text-text-secondary mb-2">{label}</p>
                <p className="text-primary-dark font-semibold">Total: {data.Total.toFixed(2)}</p>
                {data.Rank && <p className="text-indigo-500 font-semibold">Rank: {data.Rank}</p>}
                <p className="text-blue-500">Physics: {data.Physics.toFixed(2)}</p>
                <p className="text-success">Chemistry: {data.Chemistry.toFixed(2)}</p>
                <p className="text-warning">Math: {data.Math.toFixed(2)}</p>
                <p className="text-danger">Negative: {data.Negative.toFixed(2)}</p>
                {data.Trend && <p className="text-purple-500 font-semibold">Trend: {data.Trend.toFixed(2)}</p>}
            </div>
        );
    }
    return null;
};

const TestTracker: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
    const [testToEdit, setTestToEdit] = useState<TestResult | null>(null);
    const [testToDelete, setTestToDelete] = useState<TestResult | null>(null);
    const [activeTab, setActiveTab] = useState<TestType>('JEE Mains');

    const handleAddTest = (newTest: Partial<TestResult>, completedUpcomingTestId?: string) => {
        if(!user) return;
        const completeTest: TestResult = { ...newTest, id: Date.now().toString(), analysisDone: newTest.analysisDone || false } as TestResult;
        updateUser(prev => {
            if (!prev) return null;
            const updatedTests = [...prev.tests, completeTest];
            const updatedUpcomingTests = completedUpcomingTestId ? prev.upcomingTests.filter(t => t.id !== completedUpcomingTestId) : prev.upcomingTests;
            return {...prev, tests: updatedTests, upcomingTests: updatedUpcomingTests};
        }, { type: 'ADD_TEST', test: completeTest });
        setIsAddModalOpen(false);
    };

    const handleEditTest = (updatedTest: Partial<TestResult>) => {
        if (!user || !testToEdit) return;
        const fullTest = { ...testToEdit, ...updatedTest };
        updateUser(prev => ({...prev!, tests: prev!.tests.map(t => t.id === testToEdit.id ? fullTest : t) }), { type: 'ADD_TEST', test: fullTest });
        setTestToEdit(null);
    };

    const handleDeleteTest = () => {
        if (!user || !testToDelete) return;
        updateUser(prev => ({...prev!, tests: prev!.tests.filter(t => t.id !== testToDelete.id) }));
        setTestToDelete(null);
    };

    const handleAnalysisDoneToggle = (testId: string) => {
        if (!user) return;
        updateUser({ tests: user.tests.map(t => t.id === testId ? { ...t, analysisDone: !t.analysisDone } : t) });
    };

    const filteredTests = useMemo(() => user?.tests.filter(t => t.type === activeTab).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [], [user?.tests, activeTab]);
    
    const chartData = useMemo(() => {
        return filteredTests.slice().reverse().map(test => {
            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
            const totalNegative = neg.physics + neg.chemistry + neg.math;
            const netPhysics = test.marks.physics - neg.physics;
            const netChemistry = test.marks.chemistry - neg.chemistry;
            const netMath = test.marks.math - neg.math;
            return {
                date: formatDateToDDMMYYYY(test.date),
                name: test.name,
                Physics: netPhysics,
                Chemistry: netChemistry,
                Math: netMath,
                Total: netPhysics + netChemistry + netMath,
                Negative: totalNegative > 0 ? -totalNegative : 0,
                Rank: test.classRank || null,
            }
        });
    }, [filteredTests]);
    
    const trendlineData = useMemo(() => {
        if (chartData.length < 2) return chartData;

        const n = chartData.length;
        const sumX = chartData.reduce((acc, _, i) => acc + i, 0);
        const sumY = chartData.reduce((acc, data) => acc + data.Total, 0);
        const sumXY = chartData.reduce((acc, data, i) => acc + (i * data.Total), 0);
        const sumX2 = chartData.reduce((acc, _, i) => acc + (i * i), 0);
        
        const mDenominator = n * sumX2 - sumX * sumX;
        if (mDenominator === 0) return chartData;

        const m = (n * sumXY - sumX * sumY) / mDenominator;
        const c = (sumY - m * sumX) / n;

        return chartData.map((data, i) => ({
            ...data,
            Trend: m * i + c,
        }));
    }, [chartData]);
    
    const keyStats = useMemo(() => {
        if (filteredTests.length === 0) return null;
        const scores = filteredTests.map(test => {
            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
            return (test.marks.physics - neg.physics) + (test.marks.chemistry - neg.chemistry) + (test.marks.math - neg.math);
        });
        const totalNegativeMarks = filteredTests.reduce((sum, test) => {
            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
            return sum + neg.physics + neg.chemistry + neg.math;
        }, 0);

        return {
            highestScore: Math.max(...scores),
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            averageNegative: totalNegativeMarks / filteredTests.length,
        };
    }, [filteredTests]);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Test Tracker</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition-transform hover:scale-105 animate-pulse-sm">
                    <PlusIcon className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Add Test Result</span>
                    <span className="sm:hidden">Add Test</span>
                </button>
            </div>
            
            <UpcomingTestsManager />

            {isAddModalOpen && (
                 <Modal onClose={() => setIsAddModalOpen(false)} title="Add New Test Result">
                    <TestForm initialState={{}} onSubmit={handleAddTest} onClose={() => setIsAddModalOpen(false)} isEdit={false} upcomingTests={user?.upcomingTests || []} user={user}/>
                </Modal>
            )}

            {testToEdit && (
                 <Modal onClose={() => setTestToEdit(null)} title="Edit Test Result">
                    <TestForm initialState={testToEdit} onSubmit={handleEditTest} onClose={() => setTestToEdit(null)} isEdit={true} upcomingTests={user?.upcomingTests || []} user={user} />
                </Modal>
            )}
            
            {testToDelete && (
                <Modal onClose={() => setTestToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md">
                    <p className="text-text-secondary my-2">Are you sure you want to delete the test "{testToDelete.name}"?</p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => setTestToDelete(null)} className="px-4 py-2 bg-accent text-text-secondary rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleDeleteTest} className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600">Delete</button>
                    </div>
                </Modal>
            )}

            {selectedTest && (
                <Modal onClose={() => setSelectedTest(null)} title={selectedTest.name} maxWidth="max-w-7xl">
                    <TestDetailContent test={selectedTest} />
                </Modal>
            )}
            
            <div className="flex space-x-1 p-1 bg-surface rounded-lg border border-accent">{(['JEE Mains', 'JEE Advanced', 'Board'] as TestType[]).map(type => (<button key={type} onClick={() => setActiveTab(type)} className={`w-full py-2 text-center font-semibold rounded-md transition-all duration-300 ${activeTab === type ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-accent'}`}>{type}</button>))}</div>
            
            {keyStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-surface p-4 rounded-lg text-center border border-accent">
                        <p className="text-sm text-text-secondary">Highest Score</p>
                        <p className="text-2xl font-bold text-success">{keyStats.highestScore.toFixed(2)}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-lg text-center border border-accent">
                        <p className="text-sm text-text-secondary">Average Score</p>
                        <p className="text-2xl font-bold text-primary">{keyStats.averageScore.toFixed(2)}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-lg text-center border border-accent">
                        <p className="text-sm text-text-secondary">Average Negative Marks</p>
                        <p className="text-2xl font-bold text-danger">{keyStats.averageNegative.toFixed(2)}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-6 rounded-xl shadow-md border border-accent">
                    <h2 className="text-xl font-bold text-text-primary mb-4">{activeTab} Net Score Performance</h2>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendlineData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="date" tick={{ fill: '#475569' }} /><YAxis tick={{ fill: '#475569' }} /><Tooltip content={<CustomGraphTooltip />} /><Legend wrapperStyle={{ color: '#1e3a8a' }} /><Line type="monotone" dataKey="Total" stroke="#1e3a8a" strokeWidth={3} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="Physics" stroke="#3b82f6" strokeWidth={1} /><Line type="monotone" dataKey="Chemistry" stroke="#10b981" strokeWidth={1} /><Line type="monotone" dataKey="Math" stroke="#f59e0b" strokeWidth={1} /><Line type="monotone" dataKey="Negative" stroke="#ef4444" strokeWidth={2} /><Line type="monotone" dataKey="Trend" stroke="#8b5cf6" strokeWidth={2} name="Score Trend" dot={false} strokeDasharray="5 5" /></LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-text-secondary py-10">Log a test result for this category to see your performance graph.</p>
                    )}
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-md border border-accent">
                    <h2 className="text-xl font-bold text-text-primary mb-4">{activeTab} Class Rank Progression</h2>
                    {chartData.some(d => d.Rank) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fill: '#475569' }} />
                                <YAxis reversed={true} tick={{ fill: '#475569' }} domain={['dataMin', 'dataMax']} />
                                <Tooltip content={<CustomGraphTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="Rank" stroke="#6366f1" strokeWidth={2} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-text-secondary py-10">Add tests with class ranks to see your rank progression.</p>
                    )}
                </div>
            </div>
            
            <AdvancedAnalytics tests={filteredTests} />

            <div className="bg-surface p-6 rounded-xl shadow-md border border-accent">
                <h2 className="text-xl font-bold text-text-primary mb-4">{activeTab} Test History</h2>
                
                {filteredTests.length > 0 ? (
                    <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm text-text-secondary"><tr className="border-b border-accent"><th className="p-2 font-semibold">Date</th><th className="p-2 font-semibold">Name</th><th className="p-2 font-semibold">Scope</th><th className="p-2 font-semibold">Rank</th><th className="p-2 font-semibold">Score</th><th className="p-2 font-semibold text-center">Analysis</th><th className="p-2 font-semibold">Actions</th></tr></thead>
                            <tbody>
                                {filteredTests.map((test, index) => {
                                    const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
                                    const totalScore = (test.marks.physics - neg.physics) + (test.marks.chemistry - neg.chemistry) + (test.marks.math - neg.math);
                                    return (
                                    <tr key={test.id} onClick={() => setSelectedTest(test)} className="border-b border-accent/50 hover:bg-primary/5 transition-all duration-200 ease-out cursor-pointer animate-slide-in-up transform hover:scale-[1.005] hover:shadow-md" style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}>
                                    <td className="p-2 text-text-secondary">{formatDateToDDMMYYYY(test.date)}</td><td className="p-2 text-text-primary font-medium">{test.name}</td><td className="p-2 text-text-secondary">{test.testScope}</td><td className="p-2 text-text-primary font-semibold">{test.classRank || '-'}</td><td className="p-2 text-text-primary font-bold">{totalScore}/{test.totalMarks}</td>
                                    <td className="p-2 text-center"><input type="checkbox" checked={test.analysisDone} onChange={(e) => { e.stopPropagation(); handleAnalysisDoneToggle(test.id); }} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary cursor-pointer"/></td>
                                    <td className="p-2" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => setTestToEdit(test)} className="p-1 text-secondary hover:text-primary transition-transform hover:scale-125"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => setTestToDelete(test)} className="p-1 text-secondary hover:text-danger transition-transform hover:scale-125"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredTests.map((test, index) => {
                            const neg = test.negativeMarks || { physics: 0, chemistry: 0, math: 0 };
                            const totalScore = (test.marks.physics - neg.physics) + (test.marks.chemistry - neg.chemistry) + (test.marks.math - neg.math);
                            return (
                                <div key={test.id} className="bg-background p-4 rounded-lg border border-accent animate-slide-in-up" style={{ animationDelay: `${index * 50}ms`, opacity: 0 }} onClick={() => setSelectedTest(test)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-text-primary">{test.name}</p>
                                            <p className="text-sm text-text-secondary">{formatDateToDDMMYYYY(test.date)}</p>
                                        </div>
                                        <p className="font-bold text-lg text-primary">{totalScore}/{test.totalMarks}</p>
                                    </div>
                                    <div className="mt-3 flex justify-between items-center">
                                        <label className="flex items-center space-x-2 text-sm" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={test.analysisDone} onChange={() => handleAnalysisDoneToggle(test.id)} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary cursor-pointer"/>
                                            <span>Analysis Done</span>
                                        </label>
                                        <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setTestToEdit(test)} className="p-1 text-secondary hover:text-primary"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => setTestToDelete(test)} className="p-1 text-secondary hover:text-danger"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    </>
                ) : (
                    <p className="text-center text-text-secondary py-10">No tests logged for this category yet.</p>
                )}
            </div>
        </div>
    );
};

export default TestTracker;