

import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { UserContext } from '../App';
import { UpcomingTest, TestType, TestSyllabusItem, SubjectName, DailyPlan, HourlySlot, DailyPlanTask, TopicStatus, CalendarEvent, PlannedTopic, User, TestResult, Achievement, Rank, RankTier, StudyChallenge, ChallengeType, ChallengeStatus, QuestionsSolvedLog, Lecture, WellnessLog } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon, XMarkIcon, PlusIcon, SparklesIcon, ClockIcon, CheckCircleIcon, FireIcon, PresentationChartLineIcon, CheckBadgeIcon, ArrowUturnLeftIcon, PencilIcon, ClipboardDocumentCheckIcon, CalendarIcon, LightBulbIcon, ExclamationTriangleIcon, TrophyIcon, StarIcon, Cog6ToothIcon, ArrowPathIcon, HashtagIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';


const CountUp: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (isNaN(value) || value === null) return;
        let startTimestamp: number | null = null;
        const duration = 1200; // ms

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setDisplayValue(Math.floor(progress * value));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [value]);

    return <>{displayValue.toLocaleString()}</>;
};

// --- Helper Functions for Formatting ---
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDateToDDMMYYYY = (date: Date | string): string => {
    // If date is a string 'YYYY-MM-DD', it's parsed by default as UTC midnight.
    // Creating it with T00:00:00 makes it local midnight, avoiding timezone shifts.
    const d = typeof date === 'string' && !date.includes('T')
        ? new Date(`${date}T00:00:00`)
        : new Date(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};
const formatTimeToAMPM = (time: string): string => { // time is "HH:mm"
    if (!time || !time.includes(':')) return 'Invalid Time';
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12
    return `${String(formattedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
};

// --- Helper Components ---
const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string, maxWidth?: string }> = ({ children, onClose, title, maxWidth = 'max-w-3xl' }) => {
     useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);
    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-surface rounded-xl shadow-2xl w-full ${maxWidth} p-6 relative max-h-[90vh] flex flex-col transition-transform duration-300 scale-95 animate-fade-in`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">{title}</h2>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                <div className="overflow-y-auto pr-2 -mr-2 flex-grow">
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('popover-root')!
    );
}

// --- Dashboard Header ---
const DashboardHeader: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const today = new Date();
    const dateString = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const handleNameUpdate = () => {
        if (newName.trim() && newName.trim() !== user?.displayName) {
            updateUser({ displayName: newName.trim() });
        }
        setIsEditingName(false);
    };
    
    const RankDisplay: React.FC<{ rank: Rank }> = ({ rank }) => {
        const trophyColors: { [key in RankTier]: string } = { Bronze: 'text-yellow-600', Silver: 'text-slate-400', Gold: 'text-yellow-400', Platinum: 'text-cyan-400' };
        return (
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg transition-transform hover:scale-105">
                <TrophyIcon className={`w-8 h-8 ${trophyColors[rank.tier]}`} />
                <div>
                    <p className="font-bold text-lg leading-tight">{rank.name}</p>
                    <p className="text-xs text-indigo-200">Rank Score: {rank.score.toFixed(1)}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-primary-dark to-primary text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div>
                 {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNameUpdate()} className="bg-transparent border-b-2 border-white/50 text-3xl font-bold focus:outline-none focus:border-white" autoFocus onBlur={handleNameUpdate}/>
                        <button onClick={handleNameUpdate} className="p-1 rounded-full bg-white/20 hover:bg-white/40"><CheckCircleIcon className="w-6 h-6"/></button>
                    </div>
                ) : (
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        Welcome, {user?.displayName}!
                        <button onClick={() => { setNewName(user?.displayName || ''); setIsEditingName(true); }} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                            <PencilIcon className="w-5 h-5 opacity-60 hover:opacity-100" />
                        </button>
                    </h1>
                )}
                <p className="text-indigo-200">{dateString}</p>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                {user?.rank && <RankDisplay rank={user.rank} />}
                <div className="text-center flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                    <FireIcon className="w-8 h-8 text-red-400" />
                    <div>
                        <p className="text-3xl font-bold"><CountUp value={user?.studyStreak || 1} /></p>
                        <p className="text-xs text-indigo-200 -mt-1">Day Streak</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrepTimelineWidget: React.FC = () => {
    const { user } = useContext(UserContext);

    const prepStartDate = useMemo(() => new Date(user?.prepStartDate || '2025-04-01T00:00:00Z'), [user?.prepStartDate]);
    const examDate = useMemo(() => new Date(user?.examDate || '2027-01-03T00:00:00Z'), [user?.examDate]);
    
    const today = new Date();
    const daysOfPrep = Math.floor((today.getTime() - prepStartDate.getTime()) / (1000 * 3600 * 24));
    const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const totalQuestions = useMemo(() => {
        if (!user?.dailyPlans) return 0;
        return user.dailyPlans.reduce((total, plan) =>
            total + (plan.questionsSolved?.reduce((sum, q) => sum + q.count, 0) || 0)
        , 0);
    }, [user?.dailyPlans]);

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex justify-around items-center">
            <div className="text-center">
                <p className="text-4xl font-bold text-success"><CountUp value={daysOfPrep < 0 ? 0 : daysOfPrep} /></p>
                <p className="text-sm text-text-secondary">Days of Prep</p>
            </div>
            <div className="h-16 w-px bg-accent"></div>
            <div className="text-center">
                <p className="text-4xl font-bold text-primary"><CountUp value={totalQuestions} /></p>
                <p className="text-sm text-text-secondary">Questions Solved</p>
            </div>
            <div className="h-16 w-px bg-accent"></div>
            <div className="text-center">
                <p className="text-4xl font-bold text-danger"><CountUp value={daysLeft < 0 ? 0 : daysLeft} /></p>
                <p className="text-sm text-text-secondary">Days Left for Exam</p>
            </div>
        </div>
    );
};

// --- Ongoing Chapters/Topics Component ---
const OngoingTopics: React.FC = () => {
    const { user } = useContext(UserContext);
    const ongoing: { [key in SubjectName]: string[] } = useMemo(() => {
        if (!user) return { Physics: [], Chemistry: [], Math: [] };
        
        const inProgressTopics: { [key in SubjectName]: string[] } = { Physics: [], Chemistry: [], Math: [] };

        // Physics
        user.topics.physics.chapters.forEach(c => {
            if (c.status === TopicStatus.InProgress && !inProgressTopics.Physics.find(t => t.startsWith(c.name))) {
                inProgressTopics.Physics.push(`${c.name} (Chapter)`);
            }
            c.majorTopics.forEach(mt => mt.subtopics.forEach(st => {
                if (st.status === TopicStatus.InProgress) {
                    inProgressTopics.Physics.push(`${c.name} - ${st.name}`);
                }
            }));
        });
        user.topics.chemistry.sections.forEach(section => {
            section.chapters.forEach(c => {
                if (c.status === TopicStatus.InProgress && !inProgressTopics.Chemistry.find(t => t.startsWith(c.name))) {
                    inProgressTopics.Chemistry.push(`${c.name} (Chapter)`);
                }
                c.majorTopics.forEach(mt => mt.subtopics.forEach(st => {
                    if (st.status === TopicStatus.InProgress) {
                        inProgressTopics.Chemistry.push(`${c.name} - ${st.name}`);
                    }
                }));
            });
        });
        user.topics.math.chapters.forEach(c => {
            if (c.status === TopicStatus.InProgress && !inProgressTopics.Math.find(t => t.startsWith(c.name))) {
                inProgressTopics.Math.push(`${c.name} (Chapter)`);
            }
            c.majorTopics.forEach(mt => mt.subtopics.forEach(st => {
                if (st.status === TopicStatus.InProgress) {
                    inProgressTopics.Math.push(`${c.name} - ${st.name}`);
                }
            }));
        });
        return inProgressTopics;
    }, [user]);

    const hasOngoingTopics = Object.values(ongoing).some(arr => arr.length > 0);

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
            <h2 className="text-xl font-bold text-text-primary mb-3">Ongoing Chapters & Topics</h2>
            {hasOngoingTopics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['Physics', 'Chemistry', 'Math'] as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <h3 className="font-semibold text-text-primary border-b border-accent pb-1 mb-2">{subject}</h3>
                            <ul className="space-y-1 text-sm text-text-secondary list-disc list-inside">
                                {ongoing[subject].length > 0 ? ongoing[subject].map((topic, index) => <li key={topic} className="animate-slide-in-up" style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}>{topic}</li>) : <li>No ongoing topics.</li>}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-text-secondary text-center py-4">No topics are currently in progress. Go to the Topic Tracker to get started!</p>
            )}
        </div>
    );
};

// --- NEW Upcoming Tests & Events Widget ---
const UpcomingTestsAndEventsWidget: React.FC = () => {
    const { user } = useContext(UserContext);

    const upcomingItems = useMemo(() => {
        if (!user) return [];
        const now = new Date();
        const twentyDaysFromNow = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const tests = (user.upcomingTests || [])
            .map(test => ({
                id: test.id,
                title: test.name,
                dateTime: new Date(`${test.date}T${test.time || '00:00'}`),
                itemType: 'test' as const
            }))
            .filter(test => test.dateTime >= now && test.dateTime <= twentyDaysFromNow);
        
        const events = (user.events || [])
            .map(event => ({
                id: event.id,
                title: event.title,
                dateTime: new Date(`${event.date}T${event.time || '00:00'}`),
                itemType: 'event' as const,
                eventType: event.type
            }))
            .filter(evt => evt.dateTime >= now && evt.dateTime <= sevenDaysFromNow);

        return [...tests, ...events]
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    }, [user]);

    const Countdown: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
        const calculateTimeLeft = useCallback(() => {
            const difference = +targetDate - +new Date();
            let timeLeft: { [key: string]: number } = {};
            if (difference > 0) {
                timeLeft = {
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                };
            }
            return timeLeft;
        }, [targetDate]);

        const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
        useEffect(() => {
            const timer = setTimeout(() => { setTimeLeft(calculateTimeLeft()); }, 1000 * 60); // Update every minute
            return () => clearTimeout(timer);
        });

        if (!Object.keys(timeLeft).length) return <span className="text-sm font-semibold text-danger animate-pulse">Today!</span>;
        
        return (
            <div className="flex items-end gap-1 font-mono">
                {timeLeft.d > 0 && <><span className="text-lg font-bold text-primary">{timeLeft.d}</span><span className="text-xs text-text-secondary -mb-px">d</span></>}
                <span className="text-lg font-bold text-primary">{String(timeLeft.h).padStart(2, '0')}</span><span className="text-xs text-text-secondary -mb-px">h</span>
                <span className="text-lg font-bold text-primary">{String(timeLeft.m).padStart(2, '0')}</span><span className="text-xs text-text-secondary -mb-px">m</span>
            </div>
        );
    }

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
            <h2 className="text-xl font-bold text-text-primary mb-3 flex-shrink-0">Upcoming Tests & Events</h2>
            {upcomingItems.length > 0 ? (
                <div className="space-y-3 overflow-y-auto pr-2 -mr-2">
                    {upcomingItems.map((item, index) => (
                        <div key={item.id} className="bg-background p-3 rounded-lg flex justify-between items-center animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}>
                            <div className="flex items-center gap-3">
                                {item.itemType === 'test' ? <ClipboardDocumentCheckIcon className="w-6 h-6 text-primary" /> : <BellAlertIcon className="w-6 h-6 text-amber-500" />}
                                <div>
                                    <p className="font-semibold text-text-primary">{item.title}</p>
                                    <p className="text-sm text-text-secondary">{formatDateToDDMMYYYY(item.dateTime)} at {formatTimeToAMPM(item.dateTime.toTimeString())}</p>
                                </div>
                            </div>
                            <Countdown targetDate={item.dateTime} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-text-secondary text-center py-4">No upcoming tests or events. Enjoy the peace or get planning!</p>
            )}
        </div>
    );
};


// --- Graphical Progress Components ---
const SyllabusProgress: React.FC = () => {
    const { user } = useContext(UserContext);

    const progressData = useMemo(() => {
        if (!user) return { Physics: { data: [], total: 0, completed: 0 }, Chemistry: { data: [], total: 0, completed: 0 }, Math: { data: [], total: 0, completed: 0 } };
        
        const result: { [key in SubjectName]: { data: { name: string; value: number }[]; total: number; completed: number } } = { 
            Physics: { data: [], total: 0, completed: 0 }, 
            Chemistry: { data: [], total: 0, completed: 0 }, 
            Math: { data: [], total: 0, completed: 0 } 
        };

        (['Physics', 'Chemistry', 'Math'] as SubjectName[]).forEach(subject => {
            const subjectKey = subject.toLowerCase() as 'physics' | 'chemistry' | 'math';
            const subjectData = user.topics[subjectKey];
            const allChapters = 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.flatMap(s => s.chapters);
            const allSubtopics = allChapters.flatMap(c => c.majorTopics.flatMap(mt => mt.subtopics));
            
            const total = allSubtopics.length;
            const completed = allSubtopics.filter(st => st.status === TopicStatus.Completed).length;
            const percentage = total > 0 ? (completed / total) * 100 : 0;

            result[subject] = {
                data: [
                    { name: 'Completed', value: percentage },
                    { name: 'Remaining', value: 100 - percentage }
                ],
                total,
                completed
            };
        });
        return result;
    }, [user]);

    const subjectColors = ['#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
            <h3 className="text-lg font-bold text-text-primary mb-2 text-center">Syllabus Progress</h3>
            <div className="grid grid-cols-3 gap-2">
                {(['Physics', 'Chemistry', 'Math'] as SubjectName[]).map((subject, i) => {
                    const { data, total, completed } = progressData[subject];
                    const percentage = data[0]?.value ?? 0;
                    return (
                        <div key={subject} className="text-center">
                            <div className="relative h-28 w-28 mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={0} cornerRadius={5}>
                                            <Cell fill={subjectColors[i]} />
                                            <Cell fill="#e5e7eb" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-text-primary">{percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                            <p className="text-sm font-semibold mt-1">{subject}</p>
                            <p className="text-xs text-text-secondary">{completed} / {total}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const WeeklyFocus: React.FC = () => {
    const { user } = useContext(UserContext);

    const weeklyData = useMemo(() => {
        if (!user) return [];
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
        const weekStart = new Date(today.setDate(diff));
        
        const data = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateString = formatDate(date);
            const plan = user.dailyPlans.find(p => p.date === dateString);
            const hours = { Physics: 0, Chemistry: 0, Math: 0 };
            if (plan) {
                plan.schedule.forEach(slot => {
                    if (slot.status === 'Completed' && slot.subject) {
                        const start = new Date(`1970-01-01T${slot.startTime}:00`);
                        const end = new Date(`1970-01-01T${slot.endTime}:00`);
                        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        if (duration > 0) hours[slot.subject] += duration;
                    }
                });
            }
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                Physics: parseFloat(hours.Physics.toFixed(2)),
                Chemistry: parseFloat(hours.Chemistry.toFixed(2)),
                Math: parseFloat(hours.Math.toFixed(2)),
            };
        });
        return data;
    }, [user]);

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
             <h2 className="text-2xl font-bold text-text-primary mb-4">Weekly Study Focus (Hours)</h2>
             <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                    <XAxis dataKey="day" tick={{ fill: '#475569' }}/>
                    <YAxis tick={{ fill: '#475569' }}/>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ color: '#1e3a8a' }}/>
                    <Bar dataKey="Physics" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Chemistry" stackId="a" fill="#10b981" />
                    <Bar dataKey="Math" stackId="a" fill="#f59e0b" />
                </BarChart>
             </ResponsiveContainer>
        </div>
    );
};


// --- Advanced Daily Planner ---
const AddTopicModal: React.FC<{
    subject: SubjectName; onClose: () => void; onAddTopic: (topic: Omit<PlannedTopic, 'id' | 'status'>) => void;
}> = ({ subject, onClose, onAddTopic }) => {
    const { user } = useContext(UserContext);
    const [chapterName, setChapterName] = useState('');
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const subjectData = user!.topics[subject.toLowerCase() as keyof typeof user.topics];
    const chapters = 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.flatMap(s => s.chapters);
    const availableSubtopics = useMemo(() => chapters.find(c => c.name === chapterName)?.majorTopics.flatMap(mt => mt.subtopics.map(st => st.name)) || [], [chapterName, chapters]);

    const handleSubtopicToggle = (subtopicName: string) => setSelectedSubtopics(prev => prev.includes(subtopicName) ? prev.filter(s => s !== subtopicName) : [...prev, subtopicName]);
    const handleSelectAll = () => setSelectedSubtopics(availableSubtopics);
    const handleDeselectAll = () => setSelectedSubtopics([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); if (!chapterName) return;
        onAddTopic({ subject, chapterName, note, isFullChapter: selectedSubtopics.length === availableSubtopics.length && availableSubtopics.length > 0, subtopicNames: selectedSubtopics });
        onClose();
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300";
    return (
        <Modal onClose={onClose} title={`Plan for ${subject}`} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-text-primary">Chapter</label>
                    <select value={chapterName} onChange={e => {setChapterName(e.target.value); setSelectedSubtopics([]);}} className={inputStyle} required>
                        <option value="">Select a chapter...</option>
                        {chapters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {chapterName && availableSubtopics.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-text-primary">Subtopics</label>
                        <div className="flex gap-2 mb-2"><button type="button" onClick={handleSelectAll} className="text-xs text-primary hover:underline">Select All</button><button type="button" onClick={handleDeselectAll} className="text-xs text-primary hover:underline">Deselect All</button></div>
                        <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-background rounded-md border border-accent">
                            {availableSubtopics.map(st => (<label key={st} className="flex items-center space-x-2 text-sm text-text-secondary cursor-pointer hover:text-primary"><input type="checkbox" checked={selectedSubtopics.includes(st)} onChange={() => handleSubtopicToggle(st)} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary"/><span>{st}</span></label>))}
                        </div>
                    </div>
                )}
                <div><label className="text-sm font-medium text-text-primary">Notes / Specific Task</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., Solve PYQs, Read theory from page X to Y" className={`${inputStyle} h-20`}></textarea></div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-primary-light transition-transform hover:scale-105">Add to Plan</button>
            </form>
        </Modal>
    );
};

const CalendarPopover: React.FC<{ currentDate: Date; onDateSelect: (date: Date) => void; onClose: () => void; }> = ({ currentDate, onDateSelect, onClose }) => {
    const [viewDate, setViewDate] = useState(currentDate);
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const days = [];
    let day = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }

    return (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface p-4 rounded-lg shadow-2xl border border-accent z-30">
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 rounded-full hover:bg-accent"><ArrowLeftIcon className="w-4 h-4" /></button>
                <span className="font-semibold text-sm">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 rounded-full hover:bg-accent"><ArrowRightIcon className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-1">
                {days.map((d, i) => {
                    const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                    const isSelected = formatDate(d) === formatDate(currentDate);
                    return (<button key={i} onClick={() => onDateSelect(d)} className={`w-8 h-8 rounded-full text-xs transition-colors ${isSelected ? 'bg-primary text-white' : isCurrentMonth ? 'text-text-primary hover:bg-accent' : 'text-text-secondary/40 hover:bg-accent'}`}>
                        {d.getDate()}
                    </button>);
                })}
            </div>
        </div>
    );
};


const AdvancedDailyPlanner: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [modalSubject, setModalSubject] = useState<SubjectName>('Physics');
    const [newTaskText, setNewTaskText] = useState('');
    // State for question logger
    const [qSubject, setQSubject] = useState<SubjectName>('Physics');
    const [qChapter, setQChapter] = useState('');
    const [qCount, setQCount] = useState('');
    const [qType, setQType] = useState<'Basic' | 'Mains' | 'Advanced'>('Basic');
    const [qSource, setQSource] = useState<QuestionsSolvedLog['source']>('Module');

    const selectedDateString = useMemo(() => formatDate(selectedDate), [selectedDate]);
    const currentPlan = useMemo((): DailyPlan => user?.dailyPlans.find(p => p.date === selectedDateString) || { date: selectedDateString, subjectPlans: { Physics: [], Chemistry: [], Math: [] }, schedule: [], tasks: [], isReviewed: false, wakeUpTime: '06:00', sleepTime: '23:00', questionsSolved: [], dailyMood: null }, [user?.dailyPlans, selectedDateString]);
    
    const allChaptersForSubject = useMemo(() => {
        if (!user) return [];
        const subjectData = user.topics[qSubject.toLowerCase() as keyof typeof user.topics];
        return 'chapters' in subjectData ? subjectData.chapters.map(c => c.name) : subjectData.sections.flatMap(s => s.chapters).map(c => c.name);
    }, [user, qSubject]);

    useEffect(() => {
        setQChapter(''); // Reset chapter when subject changes
    }, [qSubject]);

    const handleUpdatePlan = useCallback((updatedPlan: DailyPlan, context?: any) => {
        updateUser((prevUser: User) => {
            if (!prevUser) return prevUser;
            const otherPlans = prevUser.dailyPlans.filter(p => p.date !== selectedDateString);
            return { ...prevUser, dailyPlans: [...otherPlans, updatedPlan].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
        }, context);
    }, [updateUser, selectedDateString]);
    
    useEffect(() => {
        if (user && (currentPlan.wakeUpTime || currentPlan.sleepTime)) {
            const startHour = parseInt((currentPlan.wakeUpTime || '06:00').split(':')[0]);
            let endHour = parseInt((currentPlan.sleepTime || '23:00').split(':')[0]);

            if (endHour <= startHour) endHour += 24;

            const newTimeSlots = Array.from({ length: endHour - startHour }, (_, i) => `${((startHour + i) % 24).toString().padStart(2, '0')}:00`);
            
            const newSchedule: HourlySlot[] = newTimeSlots.map((time, index) => {
                const existingSlot = currentPlan.schedule.find(s => s.startTime === time);
                const nextTime = newTimeSlots[index + 1] || currentPlan.sleepTime || '23:00';
                return {
                    id: `${selectedDateString}-${time}`,
                    startTime: time,
                    endTime: nextTime,
                    plannedTopicId: existingSlot?.plannedTopicId || null,
                    subject: existingSlot?.subject || null,
                    status: existingSlot?.status || 'Pending',
                };
            });
            
            if (JSON.stringify(newSchedule) !== JSON.stringify(currentPlan.schedule)) {
                 handleUpdatePlan({ ...currentPlan, schedule: newSchedule });
            }
        }
    }, [currentPlan.wakeUpTime, currentPlan.sleepTime, selectedDateString, user, handleUpdatePlan, currentPlan]);

    const allPlannedTopics: PlannedTopic[] = useMemo(() => [...currentPlan.subjectPlans.Physics, ...currentPlan.subjectPlans.Chemistry, ...currentPlan.subjectPlans.Math], [currentPlan.subjectPlans]);
    
    const handleAddTopic = (topic: Omit<PlannedTopic, 'id' | 'status'>) => {
        const newTopic: PlannedTopic = { ...topic, id: Date.now().toString(), status: 'Pending' };
        handleUpdatePlan({ ...currentPlan, subjectPlans: { ...currentPlan.subjectPlans, [topic.subject]: [...currentPlan.subjectPlans[topic.subject], newTopic] } });
    };

    const handleChallengeProgressUpdate = (challengeId: string, newProgress: number) => {
        updateUser(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                challenges: prev.challenges.map(c => c.id === challengeId ? { ...c, current: Math.max(0, newProgress) } : c),
            };
        });
    };

    const handleTaskStatusChange = (taskId: string) => {
        if (taskId.startsWith('challenge-')) {
            const challengeId = taskId.replace('challenge-', '');
            const challenge = user?.challenges.find(c => c.id === challengeId);
            if (challenge) {
                // When ticking the box, if it's not completed, set progress to goal. If it is completed, set to 0.
                const isCompleting = challenge.status !== 'completed';
                handleChallengeProgressUpdate(challengeId, isCompleting ? challenge.goal : 0);
            }
        } else {
            handleUpdatePlan({ ...currentPlan, tasks: currentPlan.tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t) });
        }
    };

    const handleScheduleStatusChange = (slotId: string) => {
        const slot = currentPlan.schedule.find(s => s.id === slotId);
        if (!slot) return;
        const newStatus = slot.status === 'Completed' ? 'Pending' : 'Completed';
        const context = newStatus === 'Completed' ? { type: 'COMPLETE_SLOT', slot } : undefined;
        handleUpdatePlan({ ...currentPlan, schedule: currentPlan.schedule.map(s => s.id === slotId ? { ...s, status: newStatus } : s) }, context);
    };
    const handleScheduleItemChange = (slotId: string, itemId: string) => {
        const updatedSchedule = currentPlan.schedule.map(s => {
            if (s.id !== slotId) return s;
            
            const selectedTopic = allPlannedTopics.find(t => t.id === itemId);
            if (selectedTopic) return { ...s, plannedTopicId: selectedTopic.id, subject: selectedTopic.subject };
            
            const selectedLecture = user?.lectures.find(l => `lecture-${l.id}` === itemId);
            if (selectedLecture) return { ...s, plannedTopicId: itemId, subject: selectedLecture.subject };

            // Find activity in today's coaching log
            const todaysCoachingLog = user?.coachingLogs.find(log => log.date === selectedDateString);
            const coachingActivity = todaysCoachingLog?.activities.find(act => act.id === itemId);
            if(coachingActivity) {
                const subject = coachingActivity.type === 'lecture' ? coachingActivity.subject : null;
                return { ...s, plannedTopicId: coachingActivity.id, subject: subject };
            }

            const selectedTask = currentPlan.tasks.find(t => t.id === itemId);
            if (selectedTask) return { ...s, plannedTopicId: selectedTask.id, subject: null };

            if (['rest', 'entertainment'].includes(itemId)) {
                return { ...s, plannedTopicId: itemId, subject: null };
            }
            return { ...s, plannedTopicId: null, subject: null }; // Free slot
        });
        handleUpdatePlan({ ...currentPlan, schedule: updatedSchedule });
    };

    const handleAddTask = (e: React.FormEvent) => { e.preventDefault(); if (!newTaskText.trim()) return; handleUpdatePlan({ ...currentPlan, tasks: [...currentPlan.tasks, { id: Date.now().toString(), text: newTaskText, status: 'Pending' }] }); setNewTaskText(''); };
    const handleDeleteTask = (taskId: string) => {
        handleUpdatePlan({...currentPlan, tasks: currentPlan.tasks.filter(t => t.id !== taskId), schedule: currentPlan.schedule.map(s => s.plannedTopicId === taskId ? {...s, plannedTopicId: null, subject: null} : s)});
    }
    
    const handleAddQuestions = (e: React.FormEvent) => {
        e.preventDefault();
        if (!qChapter || !qCount || Number(qCount) <= 0) return;
        const newLog: QuestionsSolvedLog = { id: Date.now().toString(), subject: qSubject, chapter: qChapter, count: Number(qCount), type: qType, source: qSource };
        handleUpdatePlan({ ...currentPlan, questionsSolved: [...currentPlan.questionsSolved, newLog] });
        setQCount('');
    };
    const handleDeleteQuestionLog = (logId: string) => {
        handleUpdatePlan({ ...currentPlan, questionsSolved: currentPlan.questionsSolved.filter(q => q.id !== logId) });
    };

    const dayEfficiency = useMemo(() => {
        const scheduledSlots = currentPlan.schedule.filter(s => s.plannedTopicId);
        if (scheduledSlots.length === 0) return null;
        const completedSlots = scheduledSlots.filter(s => s.status === 'Completed').length;
        return (completedSlots / scheduledSlots.length) * 100;
    }, [currentPlan.schedule]);

    const handleReviewDay = () => {
        if (!user) return;

        let dailyHours = 0;
        currentPlan.schedule.forEach(slot => {
            if (slot.status === 'Completed' && slot.subject) {
                const start = new Date(`1970-01-01T${slot.startTime}:00`);
                const end = new Date(`1970-01-01T${slot.endTime}:00`);
                dailyHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }
        });

        const isNewBest = dailyHours > user.personalBestStudyHours;
        const efficiency = dayEfficiency !== null ? Math.round(dayEfficiency) : 0;

        updateUser((prevUser: User) => {
            if (!prevUser) return prevUser;

            const updatedUser = JSON.parse(JSON.stringify(prevUser));
    
            const tomorrow = new Date(selectedDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowString = formatDate(tomorrow);
            
            const currentPlanInCopy = updatedUser.dailyPlans.find((p: DailyPlan) => p.date === selectedDateString);
            
            if (!currentPlanInCopy) return updatedUser;

            const isNewBestFresh = dailyHours > prevUser.personalBestStudyHours;
            if (isNewBestFresh) {
                updatedUser.personalBestStudyHours = dailyHours;
            }

            const allPlannedTopicsInCopy: PlannedTopic[] = [...currentPlanInCopy.subjectPlans.Physics, ...currentPlanInCopy.subjectPlans.Chemistry, ...currentPlanInCopy.subjectPlans.Math];
    
            const incompleteTasks = currentPlanInCopy.tasks.filter((t: DailyPlanTask) => !t.id.startsWith('challenge-') && t.status !== 'Completed');
            const incompleteTopics = allPlannedTopicsInCopy.filter((topic: PlannedTopic) => {
                const slotsForTopic = currentPlanInCopy.schedule.filter((s: HourlySlot) => s.plannedTopicId === topic.id);
                return slotsForTopic.length === 0 ? topic.status !== 'Completed' : slotsForTopic.some((s: HourlySlot) => s.status !== 'Completed');
            });
            const activeChallengesToCarryOver = updatedUser.challenges
                .filter((c: StudyChallenge) => c.status === 'active');
    
            let tomorrowPlan = updatedUser.dailyPlans.find((p: DailyPlan) => p.date === tomorrowString);
    
            if (incompleteTopics.length > 0 || incompleteTasks.length > 0 || activeChallengesToCarryOver.length > 0) {
                if (!tomorrowPlan) {
                    tomorrowPlan = {
                        date: tomorrowString,
                        subjectPlans: { Physics: [], Chemistry: [], Math: [] },
                        schedule: [], tasks: [], isReviewed: false,
                        wakeUpTime: currentPlanInCopy.wakeUpTime || '06:00',
                        sleepTime: currentPlanInCopy.sleepTime || '23:00',
                        questionsSolved: [],
                        dailyMood: null
                    };
                    updatedUser.dailyPlans.push(tomorrowPlan);
                }
    
                incompleteTopics.forEach((topic: PlannedTopic) => {
                    const carriedOverTopic: PlannedTopic = { ...topic, id: `${topic.id}-co`, isCarriedOver: true, status: 'Pending' };
                    if (!tomorrowPlan.subjectPlans[topic.subject].some((t: PlannedTopic) => t.chapterName === carriedOverTopic.chapterName)) {
                         tomorrowPlan.subjectPlans[topic.subject].push(carriedOverTopic);
                    }
                });
    
                incompleteTasks.forEach((task: DailyPlanTask) => {
                    const carriedOverTask: DailyPlanTask = { ...task, id: `${task.id}-co`, isCarriedOver: true, status: 'Pending' };
                    if (!tomorrowPlan.tasks.some((t: DailyPlanTask) => t.text === carriedOverTask.text)) {
                         tomorrowPlan.tasks.push(carriedOverTask);
                    }
                });
    
                activeChallengesToCarryOver.forEach((challenge: StudyChallenge) => {
                    const challengeTaskId = `challenge-${challenge.id}`;
                    if (!tomorrowPlan.tasks.some((t: DailyPlanTask) => t.id === challengeTaskId)) {
                        tomorrowPlan.tasks.push({
                            id: challengeTaskId,
                            text: `Challenge: ${challenge.title}`,
                            status: 'Pending' as const,
                            isCarriedOver: true,
                        });
                    }
                });
            }
    
            let roundedSleepHours = 0;
            const todaySleepTime = currentPlanInCopy.sleepTime;
            const tomorrowWakeTime = tomorrowPlan?.wakeUpTime;
            if (todaySleepTime && tomorrowWakeTime) {
                const [sleepH, sleepM] = todaySleepTime.split(':').map(Number);
                const sleepHourDecimal = sleepH + sleepM / 60;
                const [wakeH, wakeM] = tomorrowWakeTime.split(':').map(Number);
                const wakeHourDecimal = wakeH + wakeM / 60;
                let sleepDuration = wakeHourDecimal < sleepHourDecimal ? (24 - sleepHourDecimal) + wakeHourDecimal : wakeHourDecimal - sleepHourDecimal;
                if (sleepDuration > 0 && sleepDuration < 24) {
                    roundedSleepHours = parseFloat(sleepDuration.toFixed(1));
                    const todaysLogIndex = updatedUser.wellnessLogs.findIndex((l: WellnessLog) => l.date === selectedDateString);
                    if (todaysLogIndex > -1) {
                        updatedUser.wellnessLogs[todaysLogIndex].sleepHours = roundedSleepHours;
                    } else {
                        updatedUser.wellnessLogs.push({ date: selectedDateString, mood: currentPlanInCopy.dailyMood || 3, sleepHours: roundedSleepHours });
                    }
                }
            }
            if (currentPlanInCopy.dailyMood) {
                const todaysLogIndex = updatedUser.wellnessLogs.findIndex((l: WellnessLog) => l.date === selectedDateString);
                if (todaysLogIndex > -1) {
                    updatedUser.wellnessLogs[todaysLogIndex].mood = currentPlanInCopy.dailyMood;
                } else if (roundedSleepHours === 0) {
                    updatedUser.wellnessLogs.push({ date: selectedDateString, mood: currentPlanInCopy.dailyMood, sleepHours: 0 });
                }
            }
    
            currentPlanInCopy.isReviewed = true;
    
            updatedUser.dailyPlans.sort((a: DailyPlan, b: DailyPlan) => new Date(a.date).getTime() - new Date(b.date).getTime());
            updatedUser.wellnessLogs.sort((a: WellnessLog, b: WellnessLog) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
            return updatedUser;
        }, { type: 'REVIEW_DAY', date: selectedDateString, dailyHours, isNewBest, efficiency });
    
        alert('Day reviewed! Incomplete items carried over.');
    };
    
    const getItemStyle = (slot: HourlySlot) => {
        if (!slot.plannedTopicId) return 'border-transparent';

        const coachingActivity = user?.coachingLogs.find(l => l.date === selectedDateString)?.activities.find(a => a.id === slot.plannedTopicId);
        if(coachingActivity) {
            if (coachingActivity.type === 'lecture') return 'border-blue-500';
            if (coachingActivity.type === 'test') return 'border-indigo-500';
            if (coachingActivity.type === 'other') return 'border-purple-500';
        }

        if (slot.subject === 'Physics') return 'border-blue-500';
        if (slot.subject === 'Chemistry') return 'border-green-500';
        if (slot.subject === 'Math') return 'border-amber-500';
        if (['rest', 'entertainment'].includes(slot.plannedTopicId)) return 'border-slate-500';
        if (currentPlan.tasks.some(t => t.id === slot.plannedTopicId)) return 'border-purple-500';
        return 'border-transparent';
    };
    
    const moodOptions = [{ mood: 1, emoji: '😞' }, { mood: 2, emoji: '😐' }, { mood: 3, emoji: '🙂' }, { mood: 4, emoji: '😊' }, { mood: 5, emoji: '😄' }];

    const todaysCoachingActivities = user?.coachingLogs.find(l => l.date === selectedDateString)?.activities || [];


    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <div className="relative">
                    <button onClick={() => setIsCalendarOpen(c => !c)} className="flex items-center gap-2 text-2xl font-bold text-text-primary">
                        <CalendarIcon className="w-6 h-6"/>
                        <span>Daily Planner: {formatDateToDDMMYYYY(selectedDate)}</span>
                    </button>
                    {isCalendarOpen && <CalendarPopover currentDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />}
                </div>
                 <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button onClick={() => setSelectedDate(d => { const prev = new Date(d); prev.setDate(d.getDate() - 1); return prev;})} className="p-2 rounded-full hover:bg-accent"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setSelectedDate(new Date())} className="text-sm font-semibold px-3 py-1 bg-accent rounded-full hover:bg-primary/20">Today</button>
                    <button onClick={() => setSelectedDate(d => { const next = new Date(d); next.setDate(d.getDate() + 1); return next;})} className="p-2 rounded-full hover:bg-accent"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Study Plan</h3></div>
                    {(['Physics', 'Chemistry', 'Math'] as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <div className="flex justify-between items-center mb-1"><h4 className="font-semibold">{subject}</h4><button onClick={() => { setModalSubject(subject); setIsTopicModalOpen(true); }} className="text-primary hover:text-primary-dark"><PlusIcon className="w-5 h-5"/></button></div>
                            <div className="space-y-1 text-sm text-text-secondary">{currentPlan.subjectPlans[subject].map(topic => (<div key={topic.id} className={`bg-background p-2 rounded-md ${topic.isCarriedOver ? 'border-l-4 border-amber-400' : ''}`}><p className="font-medium text-text-primary">{topic.chapterName}</p><p className="text-xs">{topic.isFullChapter ? 'Full Chapter' : topic.subtopicNames.join(', ')}</p>{topic.note && <p className="text-xs italic mt-1">Note: {topic.note}</p>}</div>))} {currentPlan.subjectPlans[subject].length === 0 && <p className="text-xs text-center p-2">No topics planned.</p>}</div>
                        </div>
                    ))}
                    <div>
                        <h3 className="text-lg font-bold mt-4 mb-2">To-Do List</h3>
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-2"><input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Add a new task..." className="flex-grow p-2 text-sm bg-background border border-accent rounded-md" /><button type="submit" className="bg-primary text-white p-2 rounded-md"><PlusIcon className="w-5 h-5"/></button></form>
                        <div className="space-y-1 text-sm">{currentPlan.tasks.map(task => {
                            const isChallengeTask = task.id.startsWith('challenge-');
                            const challenge = isChallengeTask ? user?.challenges.find(c => c.id === task.id.replace('challenge-', '')) : null;
                            const isCompleted = challenge ? challenge.status === 'completed' : task.status === 'Completed';

                            return (<div key={task.id} className="flex items-center justify-between bg-background p-2 rounded-md">
                                <label className={`flex items-center gap-2 cursor-pointer ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                <input type="checkbox" checked={isCompleted} onChange={() => handleTaskStatusChange(task.id)} className="h-4 w-4 rounded text-primary focus:ring-primary/50" />
                                {task.isCarriedOver && <ArrowUturnLeftIcon className="w-3 h-3 text-amber-500"/>}
                                {task.text}
                                </label>
                                <div className="flex items-center gap-2">
                                    {challenge && challenge.status === 'active' && (
                                        <input type="number" value={challenge.current} min="0" max={challenge.goal} onChange={e => handleChallengeProgressUpdate(challenge.id, Number(e.target.value))} className="w-20 p-1 text-xs bg-surface border border-accent rounded-md text-right"/>
                                    )}
                                    <button onClick={() => handleDeleteTask(task.id)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>)
                        })}</div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-2">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Hourly Schedule</h3>{dayEfficiency !== null && (<div className="text-right"><p className="font-bold text-primary text-lg">{dayEfficiency.toFixed(0)}%</p><p className="text-xs text-text-secondary -mt-1">Day's Efficiency</p></div>)}</div>
                     <div className="flex gap-4 p-2 bg-background rounded-md items-center border border-accent">
                        <div>
                            <label className="text-xs font-medium text-text-secondary block">Wake Up Time</label>
                            <input type="time" value={currentPlan.wakeUpTime || '06:00'} onChange={e => handleUpdatePlan({ ...currentPlan, wakeUpTime: e.target.value }, { type: 'WAKE_UP_UPDATE', wakeUpTime: e.target.value })} className="bg-transparent border-none text-text-primary font-semibold text-sm p-1 focus:ring-0" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-secondary block">Sleep Time</label>
                            <input type="time" value={currentPlan.sleepTime || '23:00'} onChange={e => handleUpdatePlan({ ...currentPlan, sleepTime: e.target.value })} className="bg-transparent border-none text-text-primary font-semibold text-sm p-1 focus:ring-0" />
                        </div>
                    </div>
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                    {currentPlan.schedule.map(slot => (
                        <div key={slot.id} className={`flex items-center gap-2 bg-background p-1 rounded-md border-l-4 ${getItemStyle(slot)}`}>
                            <span className="text-xs font-mono text-text-secondary w-20 text-center">{formatTimeToAMPM(slot.startTime)}</span>
                            <select value={slot.plannedTopicId || 'free'} onChange={e => handleScheduleItemChange(slot.id, e.target.value)} className="flex-grow p-1.5 text-sm bg-transparent border-none rounded-md appearance-none focus:ring-0">
                                <option value="free">-- Free Slot --</option>
                                <optgroup label="Planned Topics">{allPlannedTopics.map(t => <option key={t.id} value={t.id}>{t.subject}: {t.chapterName}</option>)}</optgroup>
                                <optgroup label="Lectures">{user?.lectures.map(l => <option key={l.id} value={`lecture-${l.id}`}>{l.title}</option>)}</optgroup>
                                {todaysCoachingActivities.length > 0 && (
                                    <optgroup label="Coaching Activities">
                                        {todaysCoachingActivities.map(act => {
                                            const name = act.type === 'lecture' ? `${act.subject}: ${act.chapter}` : act.type === 'test' ? `Test: ${act.testName}` : act.description;
                                            return <option key={act.id} value={act.id}>{name}</option>
                                        })}
                                    </optgroup>
                                )}
                                <optgroup label="To-Do List">{currentPlan.tasks.map(t => <option key={t.id} value={t.id}>{t.text}</option>)}</optgroup>
                                <optgroup label="Activities"><option value="rest">Rest / Break</option><option value="entertainment">Entertainment</option></optgroup>
                            </select>
                            <button onClick={() => handleScheduleStatusChange(slot.id)} className={`p-1 rounded-full transition-colors ${slot.status === 'Completed' ? 'bg-success text-white' : 'bg-accent text-text-secondary'}`}><CheckCircleIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-background rounded-lg border border-accent space-y-4">
                <h3 className="text-lg font-bold text-text-primary">End of Day Log</h3>
                <div>
                    <label className="text-sm font-medium text-text-primary">How was your day?</label>
                    <div className="flex justify-around items-center p-2 bg-surface rounded-lg mt-1">
                        {moodOptions.map(opt => (
                            <button key={opt.mood} type="button" onClick={() => handleUpdatePlan({ ...currentPlan, dailyMood: opt.mood })} className={`text-3xl p-1 rounded-full transition-transform hover:scale-125 ${currentPlan.dailyMood === opt.mood ? 'bg-primary/20 scale-125' : ''}`}>{opt.emoji}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-text-primary">Questions Solved</label>
                    <form onSubmit={handleAddQuestions} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-1 items-end">
                        <select value={qSubject} onChange={e => setQSubject(e.target.value as SubjectName)} className="p-2 text-sm bg-surface border-accent rounded-md"><option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Math">Math</option></select>
                        <select value={qChapter} onChange={e => setQChapter(e.target.value)} className="p-2 text-sm bg-surface border-accent rounded-md" required><option value="">Select Chapter...</option>{allChaptersForSubject.map(c => <option key={c} value={c}>{c}</option>)}</select>
                         <select value={qType} onChange={e => setQType(e.target.value as any)} className="p-2 text-sm bg-surface border-accent rounded-md">
                            <option value="Basic">Basic</option>
                            <option value="Mains">JEE Mains</option>
                            <option value="Advanced">JEE Advanced</option>
                        </select>
                         <select value={qSource} onChange={e => setQSource(e.target.value as any)} className="p-2 text-sm bg-surface border-accent rounded-md">
                            <option value="Module">Module</option>
                            <option value="DPP">DPP</option>
                            <option value="Practice Sheet">Practice Sheet</option>
                            <option value="Lecture">Lecture</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="flex gap-2"><input type="number" placeholder="Count" value={qCount} onChange={e => setQCount(e.target.value)} className="w-full p-2 text-sm bg-surface border-accent rounded-md" required /><button type="submit" className="bg-primary text-white p-2 rounded-md"><PlusIcon className="w-5 h-5"/></button></div>
                    </form>
                    <div className="mt-2 space-y-1 text-sm">{currentPlan.questionsSolved.map(log => (<div key={log.id} className="flex justify-between items-center bg-surface p-1.5 rounded-md"><p>{log.subject} - {log.chapter} ({log.type} from {log.source}): <span className="font-bold">{log.count}</span></p><button onClick={() => handleDeleteQuestionLog(log.id)} className="text-text-secondary/50 hover:text-danger"><TrashIcon className="w-4 h-4"/></button></div>))}</div>
                </div>
            </div>

             <div className="mt-6 flex justify-end">
                <button
                    onClick={handleReviewDay}
                    disabled={currentPlan.isReviewed}
                    className="bg-primary text-white py-2 px-6 rounded-md font-semibold hover:bg-primary-light transition-all duration-300 hover:scale-105 disabled:bg-accent disabled:text-text-secondary disabled:cursor-not-allowed flex items-center"
                >
                    {currentPlan.isReviewed ? <><CheckBadgeIcon className="w-5 h-5 mr-2"/>Day Reviewed</> : 'Review Day & Carry Over'}
                </button>
            </div>
            {isTopicModalOpen && <AddTopicModal subject={modalSubject} onClose={() => setIsTopicModalOpen(false)} onAddTopic={handleAddTopic} />}
        </div>
    );
};

// --- Gamification Components ---
const AchievementToast: React.FC<{ achievement: Achievement, onDismiss: () => void }> = ({ achievement, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return ReactDOM.createPortal(
        <div className="fixed top-20 right-4 bg-surface p-4 rounded-xl shadow-2xl border border-accent z-50 flex items-start gap-3 animate-slide-in-left max-w-sm">
            <div className="text-4xl">{achievement.icon}</div>
            <div>
                <p className="font-bold text-primary">Achievement Unlocked!</p>
                <p className="font-semibold text-text-primary">{achievement.name}</p>
                <p className="text-sm text-text-secondary">{achievement.description}</p>
            </div>
            <button onClick={onDismiss} className="absolute top-2 right-2 text-text-secondary/50 hover:text-text-secondary"><XMarkIcon className="w-4 h-4"/></button>
        </div>,
        document.getElementById('popover-root')!
    );
};

const AchievementsWidget: React.FC = () => {
    const { user } = useContext(UserContext);
    const [selected, setSelected] = useState<Achievement | null>(null);

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
            <h2 className="text-xl font-bold text-text-primary mb-3">My Achievements</h2>
            {user?.achievements && user.achievements.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {user.achievements.map(ach => (
                        <div key={ach.id} className="group relative" onMouseEnter={() => setSelected(ach)} onMouseLeave={() => setSelected(null)}>
                            <div className="text-4xl p-2 bg-background rounded-lg cursor-pointer transition-transform group-hover:scale-110">{ach.icon}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-text-secondary text-center py-4">Your unlocked badges will appear here. Keep working hard!</p>
            )}
            {selected && (
                <div className="mt-4 p-3 bg-background rounded-lg border border-accent animate-fade-in">
                    <p className="font-bold text-text-primary">{selected.name}</p>
                    <p className="text-sm text-text-secondary">{selected.description}</p>
                    <p className="text-xs text-text-secondary/70 mt-1">Unlocked on: {formatDateToDDMMYYYY(selected.unlockedDate)}</p>
                </div>
            )}
        </div>
    );
};

const CreateChallengeModal: React.FC<{onClose: () => void; initialChallenge?: StudyChallenge}> = ({ onClose, initialChallenge }) => {
    const { updateUser } = useContext(UserContext);
    const [title, setTitle] = useState(initialChallenge?.title || '');
    const [type, setType] = useState<ChallengeType>(initialChallenge?.type || 'study_hours');
    const [goal, setGoal] = useState(initialChallenge?.goal || 10);
    const [durationDays, setDurationDays] = useState(initialChallenge?.durationDays || 7);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialChallenge) { // Editing existing challenge
            updateUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    challenges: prev.challenges.map(c => c.id === initialChallenge.id ? { ...c, title, type, goal, durationDays } : c)
                };
            });
        } else { // Creating new challenge
            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + durationDays);
            const unitMap: {[key in ChallengeType]: string} = { 'study_hours': 'hours', 'completed_topics': 'topics', 'questions_solved': 'questions' };

            const newChallenge: StudyChallenge = {
                id: Date.now().toString(),
                title: title || `Complete ${goal} ${unitMap[type]}`,
                type, goal, current: 0, unit: unitMap[type], durationDays,
                startDate: now.toISOString(), endDate: endDate.toISOString(), status: 'active'
            };

            updateUser(prev => {
                if (!prev) return prev;
                let updatedUser = {...prev, challenges: [...prev.challenges, newChallenge]};
                
                const todayString = formatDate(new Date());
                let todayPlan = updatedUser.dailyPlans.find(p => p.date === todayString);
                const challengeTask: DailyPlanTask = { id: `challenge-${newChallenge.id}`, text: `Challenge: ${newChallenge.title}`, status: 'Pending' };

                if (todayPlan) {
                    if (!todayPlan.tasks.some(t => t.id === `challenge-${newChallenge.id}`)) {
                         todayPlan.tasks.push(challengeTask);
                    }
                } else {
                    todayPlan = {
                        date: todayString, subjectPlans: { Physics: [], Chemistry: [], Math: [] }, schedule: [],
                        tasks: [challengeTask], isReviewed: false,
                        wakeUpTime: '06:00', sleepTime: '23:00', questionsSolved: [], dailyMood: null
                    };
                    updatedUser.dailyPlans.push(todayPlan);
                }
                return updatedUser;
            });
        }
        onClose();
    };

    return (
        <Modal onClose={onClose} title={initialChallenge ? "Edit Challenge" : "Create New Study Challenge"} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Challenge Title (e.g., Week 1 Sprint)" className="w-full p-2 bg-background rounded-md" />
                 <select value={type} onChange={e => setType(e.target.value as ChallengeType)} className="w-full p-2 bg-background rounded-md">
                     <option value="study_hours">Study Hours</option>
                     <option value="completed_topics">Completed Topics</option>
                     <option value="questions_solved">Questions Solved</option>
                 </select>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label>Goal</label><input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))} className="w-full p-2 bg-background rounded-md" /></div>
                    <div><label>Duration (Days)</label><input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-full p-2 bg-background rounded-md" /></div>
                 </div>
                 <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">{initialChallenge ? "Save Changes" : "Start Challenge"}</button>
            </form>
        </Modal>
    );
};

const ChallengesWidget: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [challengeToEdit, setChallengeToEdit] = useState<StudyChallenge | null>(null);
    const [challengeToDelete, setChallengeToDelete] = useState<StudyChallenge | null>(null);

    const displayChallenges = user?.challenges.filter(c => c.status === 'active' || c.status === 'completed') || [];
    
    const handleDelete = () => {
        if (!challengeToDelete) return;
        updateUser(prev => {
            if (!prev) return prev;
            const updatedChallenges = prev.challenges.filter(c => c.id !== challengeToDelete.id);
            const updatedPlans = prev.dailyPlans.map(plan => ({
                ...plan,
                tasks: plan.tasks.filter(task => task.id !== `challenge-${challengeToDelete.id}`)
            }));
            return { ...prev, challenges: updatedChallenges, dailyPlans: updatedPlans };
        });
        setChallengeToDelete(null);
    };

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-text-primary">My Challenges</h2>
                <button onClick={() => { setChallengeToEdit(null); setIsModalOpen(true); }} className="flex items-center text-sm bg-primary/20 text-primary py-1 px-3 rounded-md font-semibold hover:bg-primary/30"><PlusIcon className="w-4 h-4 mr-1" /> New</button>
            </div>
             {displayChallenges.length > 0 ? (
                <div className="space-y-3">
                    {displayChallenges.map(c => {
                        const isCompleted = c.status === 'completed';
                        const progress = Math.min(100, (c.current / c.goal) * 100);

                        return (
                            <div key={c.id} className={isCompleted ? 'opacity-75' : ''}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className={`font-semibold ${isCompleted ? 'text-success' : 'text-text-primary'}`}>{c.title}</span>
                                    {isCompleted ? (
                                        <span className="font-bold text-success flex items-center"><CheckBadgeIcon className="w-5 h-5 mr-1"/> Completed!</span>
                                    ) : (
                                        <span className="text-text-secondary">{c.current} / {c.goal} {c.unit}</span>
                                    )}
                                </div>
                                <div className="w-full bg-accent rounded-full h-2.5 relative">
                                    <div className={`${isCompleted ? 'bg-success' : 'bg-primary'} h-2.5 rounded-full transition-all duration-500`} style={{width: `${progress}%`}}></div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-text-secondary text-right mt-1">
                                        {isCompleted ? `Completed!` : `Ends: ${formatDateToDDMMYYYY(c.endDate)}`}
                                    </p>
                                    {!isCompleted && (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setChallengeToEdit(c); setIsModalOpen(true);}} className="text-text-secondary/60 hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => setChallengeToDelete(c)} className="text-text-secondary/60 hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-text-secondary text-center py-4">No active challenges. Start one to boost your motivation!</p>
            )}
            {isModalOpen && <CreateChallengeModal onClose={() => setIsModalOpen(false)} initialChallenge={challengeToEdit || undefined} />}
            {challengeToDelete && (
                 <Modal onClose={() => setChallengeToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md">
                    <p>Are you sure you want to delete the challenge "{challengeToDelete.title}"? This cannot be undone.</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setChallengeToDelete(null)} className="px-4 py-2 bg-accent rounded-md">Cancel</button>

                        <button onClick={handleDelete} className="px-4 py-2 bg-danger text-white rounded-md">Delete</button>
                    </div>
                 </Modal>
            )}
        </div>
    );
};

const AddEventModal: React.FC<{
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id'>) => void;
}> = ({ onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(formatDate(new Date()));
    const [time, setTime] = useState('12:00');
    const [type, setType] = useState<CalendarEvent['type']>('other');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title, date, time, type });
        onClose();
    };

    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent";
    return (
        <Modal onClose={onClose} title="Add New Event" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} className={inputStyle} required />
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputStyle} />
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputStyle} />
                </div>
                <select value={type} onChange={e => setType(e.target.value as any)} className={inputStyle}>
                    <option value="other">Other</option>
                    <option value="revision">Revision</option>
                    <option value="study">Study Session</option>
                </select>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">Add Event</button>
            </form>
        </Modal>
    );
};

const CalendarWidget: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [viewDate, setViewDate] = useState(new Date());
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const maxQuestions = useMemo(() => {
        if (!user?.dailyPlans || user.dailyPlans.length === 0) return 100; // default max
        const max = Math.max(...user.dailyPlans.map(p => p.questionsSolved.reduce((sum, q) => sum + q.count, 0)));
        return max > 0 ? max : 100; // avoid division by zero
    }, [user?.dailyPlans]);

    const dataByDate = useMemo(() => {
        if (!user) return {};
        const data: { [key: string]: { events: any[], questions: number } } = {};

        // Process existing events, tests, etc.
        user.events.forEach(event => {
            if (!data[event.date]) data[event.date] = { events: [], questions: 0 };
            data[event.date].events.push({ ...event, type: 'event' });
        });
        user.upcomingTests.forEach(test => {
            if (!data[test.date]) data[test.date] = { events: [], questions: 0 };
            data[test.date].events.push({ ...test, type: 'upcoming' });
        });
        user.tests.forEach(test => {
            if (!data[test.date]) data[test.date] = { events: [], questions: 0 };
            if (!data[test.date].events.some(e => e.type === 'upcoming' && e.name === test.name)) {
                data[test.date].events.push({ ...test, type: 'past' });
            }
        });
        
        // Process questions solved from daily plans
        user.dailyPlans.forEach(plan => {
            if (!data[plan.date]) data[plan.date] = { events: [], questions: 0 };
            const totalQuestions = plan.questionsSolved.reduce((sum, q) => sum + q.count, 0);
            data[plan.date].questions = totalQuestions;
        });

        return data;
    }, [user]);

    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday of the first week
    
    const days = Array.from({ length: 42 }).map((_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date;
    });

    const getEventTypeStyle = (type: string) => {
        switch (type) {
            case 'upcoming': return 'bg-blue-500 text-white';
            case 'past': return 'bg-success text-white';
            case 'event': return 'bg-purple-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };
    
    const getHeatColor = (count: number) => {
        if (count <= 0) return 'bg-background hover:bg-accent/50';
        const percentage = Math.min(count / maxQuestions, 1) * 100;
        if (percentage < 10) return 'bg-green-100 hover:bg-green-200';
        if (percentage < 30) return 'bg-green-200 hover:bg-green-300';
        if (percentage < 60) return 'bg-green-300 hover:bg-green-400';
        if (percentage < 80) return 'bg-green-400 hover:bg-green-500';
        return 'bg-green-500 hover:bg-green-600';
    };

    const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
        updateUser(prev => ({
            ...prev!,
            events: [...(prev!.events || []), { ...event, id: Date.now().toString() }]
        }));
    };

    return (
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-accent transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {isEventModalOpen && <AddEventModal onClose={() => setIsEventModalOpen(false)} onSave={handleAddEvent} />}
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-accent"><ArrowLeftIcon className="w-5 h-5"/></button>
                <h2 className="text-xl font-bold text-text-primary">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsEventModalOpen(true)} className="p-2 rounded-full hover:bg-accent text-primary"><PlusIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-accent"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary font-semibold">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {days.map((day) => {
                    const dateString = formatDate(day);
                    const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                    const isToday = formatDate(day) === formatDate(new Date());
                    const dayData = dataByDate[dateString] || { events: [], questions: 0 };
                    return (
                        <div key={dateString} className={`h-24 rounded-lg p-1.5 flex flex-col transition-colors ${isCurrentMonth ? getHeatColor(dayData.questions) : 'bg-gray-50'} ${isToday ? 'border-2 border-primary' : 'border border-accent'}`}>
                            <span className={`font-semibold ${isCurrentMonth ? 'text-text-primary' : 'text-text-secondary/50'}`}>{day.getDate()}</span>
                            <div className="flex-grow overflow-y-auto text-left text-xs space-y-0.5 mt-1 pr-1 -mr-1">
                                {dayData.events.map(event => (
                                    <div key={event.id} className={`p-0.5 rounded ${getEventTypeStyle(event.type)} truncate`}>{event.name || event.title}</div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const Dashboard: React.FC<{ newlyUnlockedAchievements: Achievement[], onDismissAchievement: (id: string) => void }> = ({ newlyUnlockedAchievements, onDismissAchievement }) => {
    const { user } = useContext(UserContext);
    const quote = user?.dailyQuote?.quote || "The expert in anything was once a beginner.";

    return (
        <div className="space-y-6">
            {newlyUnlockedAchievements.map(ach => <AchievementToast key={ach.id} achievement={ach} onDismiss={() => onDismissAchievement(ach.id)} />)}
            
            <DashboardHeader />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PrepTimelineWidget />
                <UpcomingTestsAndEventsWidget />
            </div>

            <AdvancedDailyPlanner />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <OngoingTopics />
                 <SyllabusProgress />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AchievementsWidget />
                <ChallengesWidget />
            </div>

            <CalendarWidget />
            
            <div className="bg-surface text-text-primary p-6 rounded-2xl shadow-lg border border-accent flex items-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <LightBulbIcon className="w-8 h-8 mr-4 text-warning flex-shrink-0 mt-1"/>
                <div>
                    <p className="text-lg font-semibold">Daily Motivation</p>
                    <p className="text-xl italic">"{quote}"</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;