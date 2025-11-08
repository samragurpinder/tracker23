

import React, { useState, useContext, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserContext } from '../App';
import { Lecture, SubjectName, User } from '../types';
import { PlusIcon, XMarkIcon, PencilIcon, TrashIcon, LinkIcon, PlayCircleIcon, EyeIcon, PhotoIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const formatDateToDDMMYYYY = (date: Date | string): string => {
    const d = typeof date === 'string' && !date.includes('T') ? new Date(`${date}T00:00:00`) : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const getYoutubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};


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

const LectureFormModal: React.FC<{
    onClose: () => void;
    initialLecture?: Lecture;
}> = ({ onClose, initialLecture }) => {
    const { user, updateUser } = useContext(UserContext);
    const [url, setUrl] = useState(initialLecture?.url || '');
    const [title, setTitle] = useState(initialLecture?.title || '');
    const [subject, setSubject] = useState<SubjectName>(initialLecture?.subject || 'Physics');
    const [chapter, setChapter] = useState(initialLecture?.chapter || '');
    const [category, setCategory] = useState<'Question Practice' | 'Theory' | 'Concepts' | 'Other'>(initialLecture?.category || 'Theory');
    const [error, setError] = useState('');

    const chaptersForSubject = useMemo(() => {
        if (!user) return [];
        const subjectData = user.topics[subject.toLowerCase() as keyof typeof user.topics];
        return 'chapters' in subjectData ? subjectData.chapters.map(c => c.name) : subjectData.sections.flatMap(s => s.chapters).map(c => c.name);
    }, [user, subject]);
    
    React.useEffect(() => {
        if (!initialLecture) { // only reset if it's not an edit form
            setChapter(''); // Reset chapter when subject changes
        }
    }, [subject, initialLecture]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const videoId = getYoutubeVideoId(url);
        if (!videoId) {
            setError('Invalid YouTube URL. Please use a valid watch or embed link.');
            return;
        }

        const lectureData: Omit<Lecture, 'id' | 'dateAdded'> = {
            url,
            videoId,
            title,
            subject,
            chapter,
            category,
        };

        if (initialLecture) { // Editing
            updateUser(prev => ({
                ...prev!,
                lectures: prev!.lectures.map(l => l.id === initialLecture.id ? { ...initialLecture, ...lectureData } : l)
            }));
        } else { // Adding
            const newLecture: Lecture = {
                ...lectureData,
                id: Date.now().toString(),
                dateAdded: new Date().toISOString(),
            };
            updateUser(prev => ({
                ...prev!,
                lectures: [newLecture, ...(prev!.lectures || [])]
            }));
        }
        onClose();
    };
    
    const inputStyle = "w-full p-2 bg-background rounded-md text-text-secondary border border-accent focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal onClose={onClose} title={initialLecture ? 'Edit Lecture' : 'Add New Lecture'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label>YouTube URL</label>
                    <input type="text" placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} className={inputStyle} required />
                    {error && <p className="text-sm text-danger mt-1">{error}</p>}
                </div>
                 <div>
                    <label>Title</label>
                    <input type="text" placeholder="Lecture Title" value={title} onChange={e => setTitle(e.target.value)} className={inputStyle} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label>Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value as SubjectName)} className={inputStyle}>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Math">Math</option>
                        </select>
                    </div>
                     <div>
                        <label>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className={inputStyle}>
                            <option value="Theory">Theory</option>
                            <option value="Concepts">Concepts</option>
                            <option value="Question Practice">Question Practice</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Chapter</label>
                    <select value={chapter} onChange={e => setChapter(e.target.value)} className={inputStyle} required>
                        <option value="">Select a chapter...</option>
                        {chaptersForSubject.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-primary-light transition-transform hover:scale-105">
                    {initialLecture ? 'Save Changes' : 'Add Lecture'}
                </button>
            </form>
        </Modal>
    );
};

const Lectures: React.FC = () => {
    const { user, updateUser } = useContext(UserContext);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [lectureToEdit, setLectureToEdit] = useState<Lecture | null>(null);
    const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
    const [lectureToView, setLectureToView] = useState<Lecture | null>(null);

    const [filters, setFilters] = useState({ subject: 'All', category: 'All', search: '' });

    const filteredLectures = useMemo(() => {
        if (!user?.lectures) return [];
        return user.lectures
            .filter(lecture => {
                const subjectMatch = filters.subject === 'All' || lecture.subject === filters.subject;
                const categoryMatch = filters.category === 'All' || lecture.category === filters.category;
                const searchMatch = filters.search === '' || lecture.title.toLowerCase().includes(filters.search.toLowerCase()) || lecture.chapter.toLowerCase().includes(filters.search.toLowerCase());
                return subjectMatch && categoryMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }, [user?.lectures, filters]);

    const handleOpenForm = (lecture?: Lecture) => {
        setLectureToEdit(lecture || null);
        setIsFormModalOpen(true);
    };

    const handleDelete = () => {
        if (!lectureToDelete) return;
        updateUser(prev => ({ ...prev!, lectures: prev!.lectures.filter(l => l.id !== lectureToDelete.id) }));
        setLectureToDelete(null);
    };

    return (
        <div className="space-y-6">
            {isFormModalOpen && <LectureFormModal onClose={() => setIsFormModalOpen(false)} initialLecture={lectureToEdit || undefined} />}

            {lectureToView && (
                <Modal onClose={() => setLectureToView(null)} title={lectureToView.title} maxWidth="max-w-4xl">
                    <div className="aspect-video bg-black rounded-lg">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${lectureToView.videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-lg"
                        ></iframe>
                    </div>
                </Modal>
            )}

            {lectureToDelete && (
                <Modal onClose={() => setLectureToDelete(null)} title="Confirm Deletion" maxWidth="max-w-md">
                    <p>Are you sure you want to delete the lecture "{lectureToDelete.title}"?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setLectureToDelete(null)} className="px-4 py-2 bg-accent rounded-md">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-danger text-white rounded-md">Delete</button>
                    </div>
                </Modal>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <PlayCircleIcon className="w-10 h-10 text-primary" />
                    <h1 className="text-3xl font-bold text-text-primary">My Lectures</h1>
                </div>
                <button onClick={() => handleOpenForm()} className="flex items-center justify-center bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition-transform hover:scale-105">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Lecture
                </button>
            </div>

            <div className="bg-surface p-4 rounded-xl shadow-md border border-accent flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by title or chapter..."
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="flex-grow p-2 bg-background border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))} className="p-2 bg-background border border-accent rounded-md">
                    <option value="All">All Subjects</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Math">Math</option>
                </select>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 bg-background border border-accent rounded-md">
                    <option value="All">All Categories</option>
                    <option value="Theory">Theory</option>
                    <option value="Concepts">Concepts</option>
                    <option value="Question Practice">Question Practice</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLectures.map(lecture => (
                    <div key={lecture.id} className="bg-surface rounded-xl shadow-lg border border-accent overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col">
                        <div className="relative group cursor-pointer aspect-video" onClick={() => setLectureToView(lecture)}>
                            <img src={`https://img.youtube.com/vi/${lecture.videoId}/mqdefault.jpg`} alt={lecture.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircleIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <p className="font-bold text-lg text-text-primary leading-tight flex-grow">{lecture.title}</p>
                            <p className="text-sm text-text-secondary mt-1">{lecture.subject} &bull; {lecture.chapter}</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-xs font-semibold bg-accent px-2 py-1 rounded-full text-text-secondary">{lecture.category}</span>
                                <div className="flex gap-2">
                                    <a href={lecture.url} target="_blank" rel="noopener noreferrer" title="Open on YouTube" className="text-text-secondary hover:text-danger"><ArrowTopRightOnSquareIcon className="w-4 h-4" /></a>
                                    <button onClick={() => handleOpenForm(lecture)} className="text-text-secondary hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setLectureToDelete(lecture)} className="text-text-secondary hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredLectures.length === 0 && (
                <div className="text-center text-text-secondary py-16 col-span-full">
                    <PhotoIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No Lectures Found</h3>
                    <p className="mt-1 text-sm">Your saved lectures will appear here. Try adding one or adjusting your filters.</p>
                </div>
            )}
        </div>
    );
};

export default Lectures;