

import React, { useContext, useState, useMemo } from 'react';
import { UserContext } from '../App';
import { TopicStatus, Chapter, Subtopic, ChapterProgress, User, MajorTopic, SubjectName, CoachingLecture, QuestionsSolvedLog } from '../types';
import { ArrowLeftIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';


const statusColors: { [key in TopicStatus]: string } = {
    [TopicStatus.NotStarted]: 'bg-slate-700 text-slate-300',
    [TopicStatus.InProgress]: 'bg-blue-600 text-white',
    [TopicStatus.Completed]: 'bg-success text-white',
    [TopicStatus.Revise]: 'bg-warning text-black',
};

const SubtopicItem: React.FC<{ 
    subtopic: Subtopic; 
    onStatusChange: (type: 'self' | 'coaching', newStatus: TopicStatus) => void; 
}> = ({ subtopic, onStatusChange }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-background rounded-md">
        <span className="text-text-primary text-sm mb-2 sm:mb-0 break-words">{subtopic.name}</span>
        <div className="flex items-center gap-2 self-end sm:self-center">
            <div>
                 <label className="text-xs text-text-secondary block text-right">Self</label>
                 <select
                    value={subtopic.status}
                    onChange={(e) => onStatusChange('self', e.target.value as TopicStatus)}
                    className={`text-xs font-semibold px-2 py-1 rounded-md border-none focus:ring-2 focus:ring-primary ${statusColors[subtopic.status]}`}
                >
                    {Object.values(TopicStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
            <div>
                 <label className="text-xs text-text-secondary block text-right">Coaching</label>
                 <select
                    value={subtopic.coachingStatus}
                    onChange={(e) => onStatusChange('coaching', e.target.value as TopicStatus)}
                    className={`text-xs font-semibold px-2 py-1 rounded-md border-none focus:ring-2 focus:ring-primary ${statusColors[subtopic.coachingStatus]}`}
                >
                    {Object.values(TopicStatus).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
        </div>
    </div>
);

const ChapterDetailView: React.FC<{ 
    chapter: Chapter; 
    onChapterStatusChange: (type: 'self' | 'coaching', newStatus: TopicStatus) => void;
    onProgressChange: (progressUpdate: Partial<ChapterProgress>) => void;
    onSubtopicStatusChange: (majorTopicName: string, subtopicName: string, type: 'self' | 'coaching', newStatus: TopicStatus) => void;
    onDeepDive: () => void;
}> = ({ chapter, onChapterStatusChange, onProgressChange, onSubtopicStatusChange, onDeepDive }) => {
    
    const CheckboxItem: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({ label, checked, onToggle }) => (
        <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 rounded bg-accent border-secondary text-primary-light focus:ring-primary"/>
            <span className="text-text-secondary text-sm">{label}</span>
        </label>
    );

    return (
        <div className="bg-surface p-6 rounded-xl shadow-md border border-accent mt-4 animate-slide-in-up">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <h2 className="text-2xl font-bold text-text-primary mb-2 sm:mb-4 break-words">{chapter.name}</h2>
                 <div className="flex items-center gap-2 self-end sm:self-auto mb-4 sm:mb-0">
                     <div>
                        <label className="text-xs text-text-secondary block text-right">Self Status</label>
                        <select
                            value={chapter.status}
                            onChange={(e) => onChapterStatusChange('self', e.target.value as TopicStatus)}
                            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary ${statusColors[chapter.status]}`}
                        >
                            {Object.values(TopicStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-xs text-text-secondary block text-right">Coaching Status</label>
                        <select
                            value={chapter.coachingStatus}
                            onChange={(e) => onChapterStatusChange('coaching', e.target.value as TopicStatus)}
                            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary ${statusColors[chapter.coachingStatus]}`}
                        >
                            {Object.values(TopicStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                 </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Progress */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-text-primary border-b border-accent pb-2">Self-Study Progress</h3>
                    <div className="animate-slide-in-left" style={{ animationDelay: '100ms', opacity: 0 }}><CheckboxItem label="Level 1 Questions Done" checked={chapter.progress.level1} onToggle={() => onProgressChange({ level1: !chapter.progress.level1 })}/></div>
                    <div className="animate-slide-in-left" style={{ animationDelay: '200ms', opacity: 0 }}><CheckboxItem label="Level 2 Questions Done" checked={chapter.progress.level2} onToggle={() => onProgressChange({ level2: !chapter.progress.level2 })}/></div>
                    <div className="animate-slide-in-left" style={{ animationDelay: '300ms', opacity: 0 }}><CheckboxItem label="JEE Mains Questions Done" checked={chapter.progress.mains} onToggle={() => onProgressChange({ mains: !chapter.progress.mains })}/></div>
                    <div className="animate-slide-in-left" style={{ animationDelay: '400ms', opacity: 0 }}><CheckboxItem label="JEE Advanced Questions Done" checked={chapter.progress.advanced} onToggle={() => onProgressChange({ advanced: !chapter.progress.advanced })}/></div>
                    <div className="flex items-center space-x-2 animate-slide-in-left" style={{ animationDelay: '500ms', opacity: 0 }}>
                        <CheckboxItem label="PYQs Done" checked={chapter.progress.pyqs} onToggle={() => onProgressChange({ pyqs: !chapter.progress.pyqs })}/>
                        {chapter.progress.pyqs && (
                            <input
                                type="number"
                                value={chapter.progress.pyqsCount}
                                onChange={(e) => onProgressChange({ pyqsCount: parseInt(e.target.value, 10) || 0 })}
                                className="w-20 p-1 text-sm bg-background border border-accent rounded-md text-text-primary"
                                placeholder="# PYQs"
                            />
                        )}
                    </div>
                    <div className="pt-4">
                        <button onClick={onDeepDive} className="w-full flex items-center justify-center bg-primary/20 text-primary py-2 px-4 rounded-md font-semibold hover:bg-primary/30 transition-transform hover:scale-105">
                            <PresentationChartLineIcon className="w-5 h-5 mr-2" /> Deep Dive Analysis
                        </button>
                    </div>
                </div>
                
                {/* Right side: Subtopics */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary border-b border-accent pb-2">Topics & Subtopics</h3>
                    <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                        {chapter.majorTopics.map((majorTopic, index) => (
                            <div key={majorTopic.name} className="animate-slide-in-up" style={{ animationDelay: `${100 + index * 100}ms`, opacity: 0 }}>
                                <h4 className="font-semibold text-text-secondary text-sm mb-2 break-words">{majorTopic.name}</h4>
                                <div className="space-y-2 pl-2 border-l-2 border-accent">
                                    {majorTopic.subtopics.map((subtopic) => (
                                        <SubtopicItem 
                                            key={subtopic.name} 
                                            subtopic={subtopic} 
                                            onStatusChange={(type, newStatus) => onSubtopicStatusChange(majorTopic.name, subtopic.name, type, newStatus)} 
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const calculateChapterProgress = (chapter: Chapter): number => {
    const allSubtopics = chapter.majorTopics.flatMap(mt => mt.subtopics);
    if (allSubtopics.length === 0) return 0;
    const completed = allSubtopics.filter(st => st.status === TopicStatus.Completed).length;
    return (completed / allSubtopics.length) * 100;
};

const ChapterDeepDiveModal: React.FC<{ chapter: Chapter, subject: SubjectName, user: User, onClose: () => void }> = ({ chapter, subject, user, onClose }) => {
    const analysisData = useMemo(() => {
        const questions: { Basic: number; Mains: number; Advanced: number; total: number; bySource: { [key: string]: number } } = { Basic: 0, Mains: 0, Advanced: 0, total: 0, bySource: {} };
        let studyHours = 0;
        const timeline: { date: string, type: string, description: string }[] = [];

        user.dailyPlans.forEach(plan => {
            plan.questionsSolved.forEach((q: QuestionsSolvedLog) => {
                if (q.chapter === chapter.name) {
                    questions[q.type] += q.count;
                    questions.total += q.count;
                    const source = q.source || 'Other';
                    questions.bySource[source] = (questions.bySource[source] || 0) + q.count;
                }
            });
            const allPlannedTopics = [...plan.subjectPlans.Physics, ...plan.subjectPlans.Chemistry, ...plan.subjectPlans.Math];
            plan.schedule.forEach(slot => {
                const topic = allPlannedTopics.find(t => t.id === slot.plannedTopicId);
                if (topic && topic.chapterName === chapter.name && slot.status === 'Completed') {
                    const start = new Date(`1970-01-01T${slot.startTime}:00`);
                    const end = new Date(`1970-01-01T${slot.endTime}:00`);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (duration > 0) {
                        studyHours += duration;
                        timeline.push({ date: plan.date, type: 'Study', description: `Studied for ${duration.toFixed(1)} hours. Topics: ${topic.isFullChapter ? 'Full Chapter' : topic.subtopicNames.join(', ')}` });
                    }
                }
            });
        });

        const tests = user.tests.filter(t => t.syllabus.some(s => s.chapter === chapter.name));
        tests.forEach(t => {
            timeline.push({ date: t.date, type: 'Test', description: `Appeared in test: ${t.name}` });
        });

        const coachingLectures = user.coachingLogs.flatMap(log => log.activities.filter((act): act is CoachingLecture => act.type === 'lecture' && act.chapter === chapter.name).map(act => ({...act, date: log.date})));
        coachingLectures.forEach(l => {
            timeline.push({ date: l.date, type: 'Coaching', description: `Attended lecture by ${l.teacher} on ${l.subtopicsTaught.join(', ')}` });
        });

        timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const questionsBySourceData = Object.entries(questions.bySource).map(([name, value]) => ({ name, value }));

        return { questions, studyHours, tests, coachingLectures, timeline, questionsBySourceData };
    }, [chapter, user]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-surface rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex-shrink-0">Deep Dive: {chapter.name}</h2>
                <div className="overflow-y-auto pr-2 -mr-2 flex-grow space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-background p-3 rounded-lg"><p className="text-2xl font-bold text-primary">{analysisData.studyHours.toFixed(1)}</p><p className="text-sm text-text-secondary">Study Hours</p></div>
                        <div className="bg-background p-3 rounded-lg"><p className="text-2xl font-bold text-primary">{analysisData.questions.total}</p><p className="text-sm text-text-secondary">Questions Solved</p></div>
                        <div className="bg-background p-3 rounded-lg"><p className="text-2xl font-bold text-primary">{analysisData.tests.length}</p><p className="text-sm text-text-secondary">Test Appearances</p></div>
                        <div className="bg-background p-3 rounded-lg"><p className="text-2xl font-bold text-primary">{analysisData.coachingLectures.length}</p><p className="text-sm text-text-secondary">Coaching Lectures</p></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-background p-4 rounded-lg"><h3 className="text-lg font-bold text-center mb-2">Question Breakdown by Type</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={Object.entries(analysisData.questions).filter(([k]) => k !== 'total' && k !== 'bySource').map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        <Cell fill="#a7f3d0" /><Cell fill="#3b82f6" /><Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-background p-4 rounded-lg"><h3 className="text-lg font-bold text-center mb-2">Question Breakdown by Source</h3>
                            {analysisData.questionsBySourceData.length > 0 ? (
                                 <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={analysisData.questionsBySourceData}>
                                        <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-text-secondary pt-16">No question sources logged for this chapter.</p>}
                        </div>
                    </div>
                    <div><h3 className="text-lg font-bold mb-2">Activity Timeline</h3>
                        <div className="max-h-64 overflow-y-auto space-y-2 bg-background p-4 rounded-lg">
                            {analysisData.timeline.map((item, i) => (
                                <div key={i} className="text-sm"><span className="font-semibold text-primary mr-2">{item.date}:</span> [{item.type}] {item.description}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TopicTracker: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [activeSubject, setActiveSubject] = useState<'physics' | 'chemistry' | 'math'>('physics');
    const [activeChemSection, setActiveChemSection] = useState<'Physical Chemistry' | 'Inorganic Chemistry' | 'Organic Chemistry'>('Physical Chemistry');
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [showDeepDive, setShowDeepDive] = useState(false);

    const handleUpdate = (updateFn: (userDraft: User) => void) => {
        if (!user) return;
        const newUser = JSON.parse(JSON.stringify(user)); // Deep copy
        updateFn(newUser);
        updateUser(newUser);
    };

    const handleChapterStatusChange = (type: 'self' | 'coaching', newStatus: TopicStatus) => {
        if (!selectedChapter) return;
        handleUpdate(draft => {
            const subjectData = draft.topics[activeSubject];
            const chapters = 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.find(s => s.name === activeChemSection)?.chapters;
            const chapter = chapters?.find(c => c.name === selectedChapter.name);
            if (chapter) {
                if(type === 'self') chapter.status = newStatus;
                else chapter.coachingStatus = newStatus;
            }
        });
        setSelectedChapter(prev => {
            if (!prev) return null;
            if(type === 'self') return { ...prev, status: newStatus };
            return { ...prev, coachingStatus: newStatus };
        });
    };
    
    const handleProgressChange = (progressUpdate: Partial<ChapterProgress>) => {
        if (!selectedChapter) return;
        handleUpdate(draft => {
             const subjectData = draft.topics[activeSubject];
            const chapters = 'chapters' in subjectData ? subjectData.chapters : subjectData.sections.find(s => s.name === activeChemSection)?.chapters;
            const chapter = chapters?.find(c => c.name === selectedChapter.name);
            if (chapter) chapter.progress = { ...chapter.progress, ...progressUpdate };
        });
        setSelectedChapter(prev => prev ? { ...prev, progress: {...prev.progress, ...progressUpdate}} : null);
    };

    const handleSubtopicStatusChange = (majorTopicName: string, subtopicName: string, type: 'self' | 'coaching', newStatus: TopicStatus) => {
        if (!selectedChapter) return;
        
        handleUpdate(draft => {
            const subjectData = draft.topics[activeSubject];
            const chapters = 'chapters' in subjectData 
                ? subjectData.chapters 
                : subjectData.sections.find(s => s.name === activeChemSection)?.chapters;
            
            const chapter = chapters?.find(c => c.name === selectedChapter.name);
            const majorTopic = chapter?.majorTopics.find(mt => mt.name === majorTopicName);
            const subtopic = majorTopic?.subtopics.find(st => st.name === subtopicName);
            if (subtopic) {
                if(type === 'self') subtopic.status = newStatus;
                else subtopic.coachingStatus = newStatus;
            }
        });

        setSelectedChapter(prev => {
            if (!prev) return null;
            const newMajorTopics = prev.majorTopics.map(mt => {
                if (mt.name === majorTopicName) {
                    const newSubtopics = mt.subtopics.map(st => {
                        if (st.name === subtopicName) {
                             if(type === 'self') return { ...st, status: newStatus };
                             return { ...st, coachingStatus: newStatus };
                        }
                        return st;
                    });
                    return { ...mt, subtopics: newSubtopics };
                }
                return mt;
            });
            return { ...prev, majorTopics: newMajorTopics };
        });
    };

    const getChapterStyle = (chapter: Chapter) => {
        if (selectedChapter?.name === chapter.name) {
            return {
                buttonClass: 'bg-primary text-white border-primary-light shadow-lg scale-105',
                progressClass: 'bg-primary-dark/50'
            };
        }
        switch (chapter.status) {
            case TopicStatus.Completed:
                return {
                    buttonClass: 'bg-success/20 border-success hover:bg-success/40 text-text-primary',
                    progressClass: 'bg-success/40'
                };
            case TopicStatus.InProgress:
                return {
                    buttonClass: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/40 text-text-primary',
                    progressClass: 'bg-blue-500/40'
                };
            case TopicStatus.Revise:
                 return {
                    buttonClass: 'bg-warning/20 border-warning hover:bg-warning/40 text-text-primary',
                    progressClass: 'bg-warning/40'
                 };
            default:
                return {
                    buttonClass: 'bg-surface border-accent hover:border-secondary hover:bg-accent',
                    progressClass: 'bg-secondary/30'
                };
        }
    };
    
    if (!user) return null;

    let chaptersToShow: Chapter[] = [];
    if (activeSubject === 'chemistry') {
        chaptersToShow = user.topics.chemistry.sections.find(s => s.name === activeChemSection)?.chapters || [];
    } else {
        chaptersToShow = user.topics[activeSubject].chapters;
    }

    const subjectStats = useMemo(() => {
        if (!chaptersToShow) return [];
        const counts = {
            [TopicStatus.Completed]: 0,
            [TopicStatus.InProgress]: 0,
            [TopicStatus.NotStarted]: 0,
            [TopicStatus.Revise]: 0,
        };
        chaptersToShow.forEach(c => {
            counts[c.status]++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [chaptersToShow]);
    
    if (showDeepDive && selectedChapter) {
        return <ChapterDeepDiveModal chapter={selectedChapter} subject={activeSubject as SubjectName} user={user} onClose={() => setShowDeepDive(false)} />;
    }

    if (selectedChapter) {
        return (
            <div className="space-y-4 animate-fade-in">
                <button 
                    onClick={() => setSelectedChapter(null)} 
                    className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to Chapters</span>
                </button>
                <ChapterDetailView
                    chapter={selectedChapter}
                    onChapterStatusChange={handleChapterStatusChange}
                    onProgressChange={handleProgressChange}
                    onSubtopicStatusChange={handleSubtopicStatusChange}
                    onDeepDive={() => setShowDeepDive(true)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Topic Tracker</h1>
            <div className="flex space-x-2 p-1 bg-surface rounded-lg border border-accent">
                {(['physics', 'chemistry', 'math'] as const).map(subject => (
                    <button key={subject} onClick={() => { setActiveSubject(subject); setSelectedChapter(null); }}
                        className={`w-full py-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${activeSubject === subject ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-accent hover:text-primary'}`}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                    </button>
                ))}
            </div>
            
            {activeSubject === 'chemistry' && (
                 <div className="flex space-x-2 p-1 bg-surface rounded-lg border border-accent">
                    {(['Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry'] as const).map(section => (
                        <button key={section} onClick={() => {setActiveChemSection(section); setSelectedChapter(null);}}
                            className={`w-full py-2 px-4 text-center font-semibold rounded-md transition-all duration-300 ${activeChemSection === section ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-accent hover:text-primary'}`}>
                            {section}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-surface p-4 rounded-lg border border-accent">
                <h3 className="text-lg font-bold text-text-primary text-center mb-2">Chapter Status Overview</h3>
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={subjectStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'rgb(var(--color-text-secondary))' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-accent))' }} />
                        <Bar dataKey="value" name="Chapters" fill="rgb(var(--color-primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-text-primary">Select a Chapter</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chaptersToShow.map(chapter => {
                        const { buttonClass, progressClass } = getChapterStyle(chapter);
                        const progress = calculateChapterProgress(chapter);
                        return (
                            <button key={chapter.name} onClick={() => setSelectedChapter(chapter)} className={`p-3 rounded-lg text-left transition-all duration-300 border relative overflow-hidden transform hover:-translate-y-1 hover:shadow-lg ${buttonClass}`}>
                               <div className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${progressClass}`} style={{ width: `${progress}%` }}/>
                               <div className="relative">
                                   <p className="font-semibold">{chapter.name}</p>
                                   <p className={`text-xs ${selectedChapter?.name === chapter.name ? 'text-gray-200' : 'text-text-secondary'}`}>{chapter.status}</p>
                               </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default TopicTracker;