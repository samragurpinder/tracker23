import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { UserContext } from '../App';
import { WellnessLog, DailyPlan, Doubt, SubjectName } from '../types';
import { LightBulbIcon, PencilSquareIcon, HeartIcon, PlusIcon, XMarkIcon, BeakerIcon, ClockIcon, TrashIcon, AdjustmentsHorizontalIcon, CheckCircleIcon, QuestionMarkCircleIcon, PlayIcon, PauseIcon, ArrowPathIcon, ForwardIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDateToDDMM = (dateStr: string): string => {
    const date = new Date(`${dateStr}T00:00:00`); // Use T00:00:00 to avoid timezone issues
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};
const formatDateToDisplay = (dateStr: string): string => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};


const WellnessLogModal: React.FC<{
    onClose: () => void;
    onSave: (log: Omit<WellnessLog, 'date'>) => void;
    initialLog?: Omit<WellnessLog, 'date'>;
}> = ({ onClose, onSave, initialLog }) => {
    const [mood, setMood] = useState(initialLog?.mood || 3);
    const [sleepHours, setSleepHours] = useState(initialLog?.sleepHours?.toString() || '8');
    const [journal, setJournal] = useState(initialLog?.journal || '');

    const moodOptions = [{ mood: 1, emoji: '😞' }, { mood: 2, emoji: '😐' }, { mood: 3, emoji: '🙂' }, { mood: 4, emoji: '😊' }, { mood: 5, emoji: '😄' }];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ mood, sleepHours: parseFloat(sleepHours) || 0, journal });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                 <h2 className="text-2xl font-bold text-text-primary mb-4">Log Today's Wellness</h2>
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-primary">How are you feeling?</label>
                        <div className="flex justify-around items-center p-2 bg-background rounded-lg mt-1">
                            {moodOptions.map(opt => (
                                <button key={opt.mood} type="button" onClick={() => setMood(opt.mood)} className={`text-4xl p-2 rounded-full transition-transform hover:scale-125 ${mood === opt.mood ? 'bg-primary/20 scale-125' : ''}`}>
                                    {opt.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="sleepHours" className="text-sm font-medium text-text-primary">How many hours did you sleep last night?</label>
                        <input id="sleepHours" type="number" step="0.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="w-full mt-1 p-2 bg-background border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                     <div>
                        <label htmlFor="journal" className="text-sm font-medium text-text-primary">A short note for today (optional)</label>
                        <textarea id="journal" value={journal} onChange={e => setJournal(e.target.value)} className="w-full mt-1 h-24 p-2 bg-background border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Any thoughts?"/>
                    </div>
                     <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-primary-light transition-transform hover:scale-105">
                        Save Log
                    </button>
                 </form>
            </div>
        </div>
    );
};

const DoubtJournal: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'All' | 'Still Confusing'>('All');
    
    // Form state
    const [subject, setSubject] = useState<SubjectName>('Physics');
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');

    const handleAddDoubt = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !description.trim()) return;
        const newDoubt: Doubt = {
            id: Date.now().toString(),
            subject,
            topic,
            description,
            date: formatDate(new Date()),
            status: 'Still Confusing'
        };
        updateUser(prev => ({ ...prev!, doubts: [newDoubt, ...prev!.doubts] }));
        // Reset form and close modal
        setTopic('');
        setDescription('');
        setIsModalOpen(false);
    };

    const handleToggleStatus = (doubtId: string) => {
        updateUser(prev => ({ ...prev!, doubts: prev!.doubts.map(d => d.id === doubtId ? { ...d, status: d.status === 'Cleared' ? 'Still Confusing' : 'Cleared' } : d)}));
    };
    
    const handleDeleteDoubt = (doubtId: string) => {
        updateUser(prev => ({ ...prev!, doubts: prev!.doubts.filter(d => d.id !== doubtId)}));
    };

    const filteredDoubts = useMemo(() => {
        if (!user?.doubts) return [];
        const sorted = [...user.doubts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (filter === 'Still Confusing') {
            return sorted.filter(d => d.status === 'Still Confusing');
        }
        return sorted;
    }, [user?.doubts, filter]);

    const doubtsBySubjectData = useMemo(() => {
        if (!user?.doubts) return [];
        const counts: { [key in SubjectName]: number } = { Physics: 0, Chemistry: 0, Math: 0 };
        user.doubts.forEach(d => {
            if (counts[d.subject] !== undefined) {
                counts[d.subject]++;
            }
        });
        return Object.entries(counts).map(([subject, count]) => ({ subject, count }));
    }, [user?.doubts]);

    const statusStyle = { 'Cleared': 'bg-success/20 text-success', 'Still Confusing': 'bg-warning/20 text-warning' };

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md space-y-4 border border-accent transition-shadow hover:shadow-lg">
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Log a New Doubt</h3>
                        <form onSubmit={handleAddDoubt} className="space-y-3">
                            <select value={subject} onChange={e => setSubject(e.target.value as SubjectName)} className="w-full p-2 bg-background rounded-md"><option>Physics</option><option>Chemistry</option><option>Math</option></select>
                            <input type="text" placeholder="Topic / Chapter" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 bg-background rounded-md" required />
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your doubt..." className="w-full p-2 h-24 bg-background rounded-md" required></textarea>
                            <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Add Doubt</button>
                        </form>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2"><QuestionMarkCircleIcon className="w-8 h-8 text-primary"/>Doubt Journal</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-primary/20 text-primary py-2 px-4 rounded-md font-semibold hover:bg-primary/30 self-start sm:self-center"><PlusIcon className="w-5 h-5 mr-2" />Log Doubt</button>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-2 text-center">Doubts by Subject</h3>
                     <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={doubtsBySubjectData}>
                            <XAxis dataKey="subject" tick={{fill: '#475569'}}/>
                            <YAxis allowDecimals={false} tick={{fill: '#475569'}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center bg-background p-4 rounded-lg">
                    <p className="text-center text-5xl font-bold text-warning">{filteredDoubts.filter(d => d.status === 'Still Confusing').length}</p>
                    <p className="text-center text-text-secondary">Doubts Still Confusing</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter:</span>
                <button onClick={() => setFilter('All')} className={`px-3 py-1 text-sm rounded-full ${filter === 'All' ? 'bg-primary text-white' : 'bg-accent'}`}>All</button>
                <button onClick={() => setFilter('Still Confusing')} className={`px-3 py-1 text-sm rounded-full ${filter === 'Still Confusing' ? 'bg-primary text-white' : 'bg-accent'}`}>Still Confusing</button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {filteredDoubts.map(doubt => (
                    <div key={doubt.id} className={`bg-background p-4 rounded-lg border-l-4 ${doubt.status === 'Cleared' ? 'border-success' : 'border-warning'}`}>
                         <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-text-primary">{doubt.topic}</p>
                                <p className="text-sm text-text-secondary">{doubt.subject} - Logged on {formatDateToDisplay(doubt.date)}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle[doubt.status]}`}>{doubt.status}</span>
                                <button onClick={() => handleDeleteDoubt(doubt.id)} className="text-text-secondary/50 hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                             </div>
                         </div>
                         <p className="mt-2 text-text-secondary">{doubt.description}</p>
                         <button onClick={() => handleToggleStatus(doubt.id)} className="text-sm text-primary hover:underline mt-2 flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4"/>
                            Mark as {doubt.status === 'Cleared' ? 'Still Confusing' : 'Cleared'}
                         </button>
                    </div>
                ))}
                {filteredDoubts.length === 0 && <p className="text-center text-text-secondary py-8">No doubts logged. Keep asking questions!</p>}
            </div>
        </div>
    )
};


const WellnessTracker: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [logToEdit, setLogToEdit] = useState<WellnessLog | null>(null);
    const [graphView, setGraphView] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

    const todayString = useMemo(() => formatDate(new Date()), []);
    const todayLogExists = useMemo(() => user?.wellnessLogs.some(log => log.date === todayString), [user?.wellnessLogs, todayString]);

    const handleSaveLog = (logData: Omit<WellnessLog, 'date'>) => {
        const dateToUse = logToEdit ? logToEdit.date : todayString;
        const newLog: WellnessLog = { ...logData, date: dateToUse };
        updateUser(prev => {
            const existing = prev!.wellnessLogs.find(l => l.date === dateToUse);
            if (existing) {
                return { ...prev!, wellnessLogs: prev!.wellnessLogs.map(l => l.date === dateToUse ? newLog : l)};
            } else {
                return { ...prev!, wellnessLogs: [...prev!.wellnessLogs, newLog].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
            }
        });
        setLogToEdit(null);
    };
    
    const chartData = useMemo(() => {
        if (!user) return [];
        const now = new Date();

        if (graphView === 'weekly') {
            const last7Days: any[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                const dateString = formatDate(date);
                const log = user.wellnessLogs.find(l => l.date === dateString);
                last7Days.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    mood: log?.mood,
                    sleep: log?.sleepHours,
                });
            }
            return last7Days;
        }
        
        if (graphView === 'monthly') {
            const monthlyStats: { [key: string]: { moods: number[], sleeps: number[], count: number } } = {};
            const last12Months = new Date();
            last12Months.setMonth(last12Months.getMonth() - 11);
            last12Months.setDate(1);

            user.wellnessLogs
                .filter(log => new Date(log.date) >= last12Months)
                .forEach(log => {
                    const monthKey = new Date(log.date).toLocaleString('default', { month: 'short', year: '2-digit' });
                    if (!monthlyStats[monthKey]) {
                        monthlyStats[monthKey] = { moods: [], sleeps: [], count: 0 };
                    }
                    monthlyStats[monthKey].moods.push(log.mood);
                    monthlyStats[monthKey].sleeps.push(log.sleepHours);
                    monthlyStats[monthKey].count++;
                });

            return Object.entries(monthlyStats).map(([date, data]) => ({
                date,
                mood: data.moods.reduce((a, b) => a + b, 0) / data.count,
                sleep: data.sleeps.reduce((a, b) => a + b, 0) / data.count,
            }));
        }

        // Daily (last 30 days)
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        return user.wellnessLogs
            .filter(log => new Date(log.date) >= last30Days)
            .map(log => ({
                date: formatDateToDDMM(log.date),
                mood: log.mood,
                sleep: log.sleepHours,
            }));

    }, [user, graphView]);

    const wellnessEmojis = ['❓', '😞', '😐', '🙂', '😊', '😄'];
    const buttonStyle = "px-3 py-1 text-sm rounded-full transition-colors";
    const activeButtonStyle = "bg-primary text-white";
    const inactiveButtonStyle = "bg-accent hover:bg-primary/20";

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md space-y-4 border border-accent transition-shadow hover:shadow-lg">
             {isModalOpen && <WellnessLogModal onClose={() => setIsModalOpen(false)} onSave={handleSaveLog} initialLog={logToEdit || undefined}/>}
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2"><HeartIcon className="w-8 h-8 text-primary"/>Wellness Tracker</h2>
                <button onClick={() => { setLogToEdit(null); setIsModalOpen(true); }} disabled={todayLogExists} className="flex items-center bg-primary/20 text-primary py-2 px-4 rounded-md font-semibold hover:bg-primary/30 disabled:bg-accent disabled:text-text-secondary disabled:cursor-not-allowed self-start sm:self-center">
                    <PlusIcon className="w-5 h-5 mr-2" />{todayLogExists ? "Logged for Today" : "Log Today's Wellness"}
                </button>
            </div>
            
            <div className="bg-background p-4 rounded-lg">
                 <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-center mb-2 sm:mb-0">Wellness Trend</h3>
                    <div className="flex items-center gap-2 p-1 bg-surface rounded-full">
                        <button onClick={() => setGraphView('weekly')} className={`${buttonStyle} ${graphView === 'weekly' ? activeButtonStyle : inactiveButtonStyle}`}>Weekly</button>
                        <button onClick={() => setGraphView('daily')} className={`${buttonStyle} ${graphView === 'daily' ? activeButtonStyle : inactiveButtonStyle}`}>Daily</button>
                        <button onClick={() => setGraphView('monthly')} className={`${buttonStyle} ${graphView === 'monthly' ? activeButtonStyle : inactiveButtonStyle}`}>Monthly</button>
                    </div>
                 </div>
                 {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{fontSize: 12}} />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 5]} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 12]}/>
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="mood" name="Mood (1-5)" stroke="#f59e0b" strokeWidth={2} connectNulls />
                            <Bar yAxisId="right" dataKey="sleep" name="Sleep (hrs)" fill="#10b981" />
                        </ComposedChart>
                    </ResponsiveContainer>
                 ) : (
                     <p className="text-center text-text-secondary py-20">Log your wellness for a few days to see your trend graph.</p>
                 )}
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {[...(user?.wellnessLogs || [])].reverse().map(log => (
                    <div key={log.date} className="bg-background p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <span className="font-semibold text-text-primary">{formatDateToDisplay(log.date)}</span>
                            {log.journal && <p className="text-sm text-text-secondary italic">"{log.journal}"</p>}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center"><p className="text-3xl">{wellnessEmojis[log.mood]}</p><p className="text-xs text-text-secondary">Mood</p></div>
                            <div className="text-center"><p className="text-2xl font-bold">{log.sleepHours}</p><p className="text-xs text-text-secondary">Sleep (hrs)</p></div>
                            <button onClick={() => { setLogToEdit(log); setIsModalOpen(true); }} className="text-text-secondary/50 hover:text-primary"><PencilSquareIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const NotesAndTools: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [notes, setNotes] = useState(user?.notes || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setNotes(user?.notes || '');
    }, [user?.notes]);

    const handleSave = () => {
        updateUser({ notes });
        setIsEditing(false);
    };

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md space-y-4 border border-accent transition-shadow hover:shadow-lg">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2"><LightBulbIcon className="w-8 h-8 text-primary"/>My Notes & Scratchpad</h2>
                 {!isEditing ? (
                     <button onClick={() => setIsEditing(true)} className="flex items-center bg-primary/20 text-primary py-2 px-4 rounded-md font-semibold hover:bg-primary/30"><PencilSquareIcon className="w-5 h-5 mr-2" />Edit</button>
                 ) : (
                     <button onClick={handleSave} className="flex items-center bg-success/20 text-success py-2 px-4 rounded-md font-semibold hover:bg-success/30">Save</button>
                 )}
            </div>
            
            {isEditing ? (
                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="w-full h-64 p-4 bg-background rounded-md border border-accent focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                    placeholder="Jot down your thoughts, formulas, or anything important..."
                />
            ) : (
                 <div className="prose prose-sm md:prose-base max-w-none p-4 bg-background rounded-md text-text-primary h-64 overflow-y-auto whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: notes.replace(/\n/g, '<br />') }} />
            )}
        </div>
    );
};

const StudyTools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'stopwatch' | 'timer'>('stopwatch');

    const formatTime = (time: number, showMs = true) => {
        const ms = Math.floor((time % 1000) / 10);
        const secs = Math.floor((time / 1000) % 60);
        const mins = Math.floor((time / (1000 * 60)) % 60);
        const hours = Math.floor(time / (1000 * 60 * 60));
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}${showMs ? `.${String(ms).padStart(2, '0')}` : ''}`;
    };

    // Stopwatch logic
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
    const stopwatchIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isStopwatchRunning) {
            const startTime = Date.now() - stopwatchTime;
            stopwatchIntervalRef.current = window.setInterval(() => {
                setStopwatchTime(Date.now() - startTime);
            }, 10);
        } else {
            if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
        }
        return () => { if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current); };
    }, [isStopwatchRunning]);

    // Timer logic
    const [timerInput, setTimerInput] = useState({ h: '0', m: '25', s: '0' });
    const [initialTime, setInitialTime] = useState(25 * 60 * 1000);
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<number | null>(null);
    const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isTimerRunning) {
            const endTime = Date.now() + timeLeft;
            timerIntervalRef.current = window.setInterval(() => {
                const remaining = endTime - Date.now();
                if (remaining <= 0) {
                    setTimeLeft(0);
                    setIsTimerRunning(false);
                    alarmAudioRef.current?.play();
                    clearInterval(timerIntervalRef.current!);
                } else {
                    setTimeLeft(remaining);
                }
            }, 100);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    }, [isTimerRunning, timeLeft]);

    const handleTimerInputChange = (unit: 'h' | 'm' | 's', value: string) => {
        const numValue = parseInt(value) || 0;
        const newInputs = { ...timerInput, [unit]: String(numValue) };
        setTimerInput(newInputs);
        const newTotalMs = (parseInt(newInputs.h)*3600 + parseInt(newInputs.m)*60 + parseInt(newInputs.s)) * 1000;
        setInitialTime(newTotalMs);
        setTimeLeft(newTotalMs);
    };

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md space-y-4 border border-accent">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2"><BeakerIcon className="w-8 h-8 text-primary"/>Study Tools</h2>
            <div className="flex p-1 bg-background rounded-lg"><button onClick={() => setActiveTool('stopwatch')} className={`w-1/2 py-2 rounded-md font-semibold ${activeTool === 'stopwatch' ? 'bg-primary text-white' : ''}`}>Stopwatch</button><button onClick={() => setActiveTool('timer')} className={`w-1/2 py-2 rounded-md font-semibold ${activeTool === 'timer' ? 'bg-primary text-white' : ''}`}>Timer</button></div>
            {activeTool === 'stopwatch' ? (
                <div className="text-center p-4"><p className="text-5xl font-mono font-bold tracking-tighter">{formatTime(stopwatchTime)}</p><div className="flex justify-center gap-4 mt-4"><button onClick={() => setIsStopwatchRunning(!isStopwatchRunning)} className={`px-6 py-2 rounded-md font-semibold text-white ${isStopwatchRunning ? 'bg-danger' : 'bg-success'}`}>{isStopwatchRunning ? 'Pause' : 'Start'}</button><button onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }} className="px-6 py-2 rounded-md font-semibold bg-accent">Reset</button></div></div>
            ) : (
                <div className="text-center p-4 space-y-4">
                    <p className="text-5xl font-mono font-bold tracking-tighter">{formatTime(timeLeft, false)}</p>
                    {!isTimerRunning && (<div className="flex justify-center items-center gap-2"><input type="number" value={timerInput.h} onChange={e => handleTimerInputChange('h', e.target.value)} className="w-16 p-1 text-center bg-background rounded-md"/><span>h</span><input type="number" value={timerInput.m} onChange={e => handleTimerInputChange('m', e.target.value)} className="w-16 p-1 text-center bg-background rounded-md"/><span>m</span><input type="number" value={timerInput.s} onChange={e => handleTimerInputChange('s', e.target.value)} className="w-16 p-1 text-center bg-background rounded-md"/><span>s</span></div>)}
                    <div className="flex justify-center gap-4 mt-4"><button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-6 py-2 rounded-md font-semibold text-white ${isTimerRunning ? 'bg-danger' : 'bg-success'}`}>{isTimerRunning ? 'Pause' : 'Start'}</button><button onClick={() => { setIsTimerRunning(false); setTimeLeft(initialTime); }} className="px-6 py-2 rounded-md font-semibold bg-accent">Reset</button></div>
                    <audio ref={alarmAudioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto"></audio>
                </div>
            )}
        </div>
    );
};


const Notes: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NotesAndTools />
                <StudyTools />
            </div>
            <WellnessTracker />
            <DoubtJournal />
        </div>
    );
};
export default Notes;