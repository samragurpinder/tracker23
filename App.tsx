

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import TopicTracker from './components/TopicTracker';
import TestTracker from './components/TestTracker';
import Lectures from './components/Lectures';
import Notes from './components/Notes';
import Reports from './components/Reports';
import CoachingLog from './components/CoachingLog';
import LoginPage from './components/LoginPage';
import { User, AppView, Achievement } from './types';
import { createNewUserDocument, getUserData, saveUserData } from './services/dataService';
import { staticQuotes, achievementDefinitions, initialTopics } from './constants';
import { BookOpenIcon, ChartBarIcon, PlayCircleIcon, HeartIcon as HeartOutlineIcon, HomeIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, DocumentChartBarIcon, BuildingLibraryIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';


export const UserContext = React.createContext<{ user: User | null; updateUser: (updater: Partial<User> | ((prevUser: User) => User), context?: any) => void; }>({ user: null, updateUser: () => {} });

const SettingsModal: React.FC<{
    user: User | null;
    updateUser: (updater: Partial<User> | ((prevUser: User) => User)) => void;
    onClose: () => void;
    currentTheme: string;
    setTheme: (theme: string) => void;
    onLogout: () => void;
}> = ({ user, updateUser, onClose, currentTheme, setTheme, onLogout }) => {
    const themes = [
        { id: 'light', name: 'Default Light', bg: 'bg-slate-100' },
        { id: 'dark', name: 'Default Dark', bg: 'bg-slate-800' },
        { id: 'theme-black', name: 'Black', bg: 'bg-black' },
        { id: 'theme-grey', name: 'Grey', bg: 'bg-slate-600' },
        { id: 'theme-white', name: 'White', bg: 'bg-white' },
        { id: 'theme-monochrome', name: 'Monochrome', bg: 'bg-slate-700' },
    ];
    
    const prepDate = useMemo(() => user?.prepStartDate ? new Date(user.prepStartDate).toISOString().split('T')[0] : '', [user?.prepStartDate]);
    const examDate = useMemo(() => user?.examDate ? new Date(user.examDate).toISOString().split('T')[0] : '', [user?.examDate]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 relative`} onClick={e => e.stopPropagation()}>
                 <h2 className="text-2xl font-bold text-text-primary mb-4">Display Settings</h2>
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-transform hover:rotate-90"><XMarkIcon className="w-6 h-6" /></button>
                 <div className="space-y-4">
                     <div>
                        <p className="text-sm font-medium text-text-primary mb-2">Color Theme</p>
                        <div className="grid grid-cols-2 gap-3">
                            {themes.map(theme => (
                                <button key={theme.id} onClick={() => setTheme(theme.id)} className={`p-4 rounded-lg border-2 transition-all ${currentTheme === theme.id ? 'border-primary scale-105' : 'border-accent hover:border-secondary'}`}>
                                    <div className={`w-full h-12 rounded-md ${theme.bg} mb-2 border border-accent`}></div>
                                    <p className="text-text-primary font-semibold">{theme.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="border-t border-accent pt-4">
                        <p className="text-sm font-medium text-text-primary mb-2">Timeline Settings</p>
                        <div className="space-y-2">
                             <div>
                                <label htmlFor="prep-start-date" className="text-xs text-text-secondary">Prep Start Date</label>
                                <input id="prep-start-date" type="date" value={prepDate} onChange={e => updateUser({ prepStartDate: new Date(e.target.value).toISOString() })} className="w-full p-2 bg-background border border-accent rounded-md"/>
                             </div>
                             <div>
                                <label htmlFor="exam-date" className="text-xs text-text-secondary">Main Exam Date</label>
                                <input id="exam-date" type="date" value={examDate} onChange={e => updateUser({ examDate: new Date(e.target.value).toISOString() })} className="w-full p-2 bg-background border border-accent rounded-md"/>
                             </div>
                        </div>
                     </div>
                 </div>
                 <button onClick={onLogout} className={`w-full flex items-center justify-center mt-6 p-3 rounded-lg transition-colors text-danger bg-danger/10 hover:bg-danger/20`}>
                    <ArrowRightOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                    <span className="ml-4 font-semibold">Logout</span>
                </button>
            </div>
        </div>
    )
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);
    const [theme, setTheme] = useState(localStorage.getItem('prep-meter-theme') || 'light');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const themes = ['light', 'dark', 'theme-black', 'theme-grey', 'theme-white', 'theme-monochrome'];
        root.classList.remove(...themes);
        root.classList.add(theme);
        localStorage.setItem('prep-meter-theme', theme);
    }, [theme]);

    const performLoginActions = (userData: User): User => {
        const today = new Date().toDateString();
        let updatedUserData = { ...userData };

        // Handle Study Streak
        const lastLogin = updatedUserData.lastLogin ? new Date(updatedUserData.lastLogin).toDateString() : null;
        if (lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastLogin === yesterday.toDateString()) {
                updatedUserData.studyStreak += 1;
            } else {
                updatedUserData.studyStreak = 1; // Reset if not consecutive
            }
            updatedUserData.lastLogin = new Date().toISOString();
        }

        // Handle Static Daily Quote
        if (updatedUserData.dailyQuote?.date !== today) {
            const quoteIndex = new Date().getDate() % staticQuotes.length;
            updatedUserData.dailyQuote = {
                quote: staticQuotes[quoteIndex],
                date: today,
            };
        }
        
        return updatedUserData;
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
            try {
                if (userAuth) {
                    let userProfile = await getUserData();
                    if (userProfile) {
                        const updatedForLogin = performLoginActions(userProfile);
                        if (JSON.stringify(updatedForLogin) !== JSON.stringify(userProfile)) {
                             await saveUserData(updatedForLogin);
                        }
                        setUser(updatedForLogin);
                    } else {
                        // This handles the case for a new sign-up where the document needs to be created.
                        const newUserProfile = await createNewUserDocument(userAuth);
                        setUser(newUserProfile);
                    }
                } else {
                    setUser(null);
                }
                setCurrentUser(userAuth);
            } catch (error) {
                console.error("Error during authentication state change:", error);
                setUser(null);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        signOut(auth);
    };

    const updateUser = useCallback((updater: Partial<User> | ((prevUser: User) => User), context?: any) => {
        if (!currentUser) return;

        setUser(prevUser => {
            if (!prevUser) return null;
            let updatedUser = typeof updater === 'function' ? updater(prevUser) : { ...prevUser, ...updater };
            
            // --- Gamification Engine ---
            const newlyUnlocked: Achievement[] = [];
            const currentAchievements = updatedUser.achievements;

            // 1. Check for new achievements
            achievementDefinitions.forEach(def => {
                const isAlreadyUnlocked = currentAchievements.some(a => a.id === def.id);
                if (!isAlreadyUnlocked && def.check(updatedUser, context)) {
                    const newAchievement: Achievement = {
                        id: def.id,
                        name: def.name,
                        description: def.description,
                        icon: def.icon,
                        unlockedDate: new Date().toISOString(),
                    };
                    newlyUnlocked.push(newAchievement);
                }
            });

            if (newlyUnlocked.length > 0) {
                updatedUser = { ...updatedUser, achievements: [...currentAchievements, ...newlyUnlocked] };
                setNewlyUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
            }
            
            // 2. Update challenge progress. This loop checks for completion or failure.
            const now = new Date();
            updatedUser.challenges = updatedUser.challenges.map(challenge => {
                if (challenge.status === 'active') {
                    if (challenge.current >= challenge.goal) {
                        challenge.status = 'completed';
                        challenge.current = challenge.goal; // Ensure current progress matches goal on completion
                    } else if (now > new Date(challenge.endDate)) {
                        challenge.status = 'failed';
                    }
                } else if (challenge.status === 'completed') {
                    if (challenge.current < challenge.goal) {
                        // This happens if a user un-completes a challenge task from the daily plan
                        // The challenge should revert to active if it hasn't expired
                        if (now <= new Date(challenge.endDate)) {
                            challenge.status = 'active';
                        }
                    }
                }
                return challenge;
            });

            // 3. Update Rank (if needed)
            const lastUpdate = new Date(updatedUser.lastRankUpdate);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(now.getDate() - 3);
            if (lastUpdate < threeDaysAgo) {
                // Logic to update rank score would go here.
                // For now, let's just update the timestamp
                updatedUser.lastRankUpdate = now.toISOString();
            }

            // Save to DB
            saveUserData(updatedUser);

            return updatedUser;
        });
    }, [currentUser]);

    const dismissAchievement = (id: string) => {
        setNewlyUnlockedAchievements(prev => prev.filter(ach => ach.id !== id));
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard newlyUnlockedAchievements={newlyUnlockedAchievements} onDismissAchievement={dismissAchievement} />;
            case 'topics': return <TopicTracker />;
            case 'tests': return <TestTracker />;
            case 'lectures': return <Lectures />;
            case 'notes': return <Notes />;
            case 'reports': return <Reports />;
            case 'coaching': return <CoachingLog />;
            default: return <Dashboard newlyUnlockedAchievements={newlyUnlockedAchievements} onDismissAchievement={dismissAchievement} />;
        }
    };
    
    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div></div>;
    }

    if (!currentUser || !user) {
        return <LoginPage />;
    }

    const navItems = [
        { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
        { id: 'topics', name: 'Topic Tracker', icon: BookOpenIcon },
        { id: 'tests', name: 'Test Tracker', icon: ChartBarIcon },
        { id: 'coaching', name: 'Coaching Log', icon: BuildingLibraryIcon },
        { id: 'lectures', name: 'Lectures', icon: PlayCircleIcon },
        { id: 'notes', name: 'Notes & Tools', icon: HeartOutlineIcon },
        { id: 'reports', name: 'Reports', icon: DocumentChartBarIcon },
    ];
    
     const mobileNavItems = [
        { id: 'dashboard', name: 'Home', icon: HomeIcon },
        { id: 'topics', name: 'Topics', icon: BookOpenIcon },
        { id: 'tests', name: 'Tests', icon: ChartBarIcon },
        { id: 'coaching', name: 'Coaching', icon: BuildingLibraryIcon },
        { id: 'lectures', name: 'Lectures', icon: PlayCircleIcon },
        { id: 'notes', name: 'Notes', icon: HeartOutlineIcon },
        { id: 'reports', name: 'Reports', icon: DocumentChartBarIcon },
    ];

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            <div id="popover-root"></div>
             {isSettingsOpen && <SettingsModal user={user} updateUser={updateUser} onClose={() => setIsSettingsOpen(false)} currentTheme={theme} setTheme={setTheme} onLogout={handleLogout} />}
            <div className="flex h-screen bg-background text-text-primary">
                {/* --- Main Area --- */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-surface border-b border-accent flex-shrink-0">
                        <div className="mx-auto px-4 sm:px-6 lg:px-8">
                            {/* --- Mobile Header --- */}
                            <div className="md:hidden flex justify-between items-center h-16">
                                <div className="w-10"></div>
                                <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white px-3 py-1 rounded-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0-1.275 1.275a2.25 2.25 0 01-3.182 0l-1.275-1.275M4.2 15.3l1.275 1.275a2.25 2.25 0 003.182 0l1.275-1.275"></path></svg>
                                    <h1 className="text-lg font-bold">Gurpinder's Prep Tracker</h1>
                                </div>
                                <div className="w-10 flex justify-end">
                                    <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-text-secondary hover:bg-accent hover:text-primary">
                                        <Cog6ToothIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            {/* --- Desktop Header --- */}
                            <div className="hidden md:flex justify-between items-center h-16">
                                <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white px-3 py-1 rounded-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0-1.275 1.275a2.25 2.25 0 01-3.182 0l-1.275-1.275M4.2 15.3l1.275 1.275a2.25 2.25 0 003.182 0l1.275-1.275"></path></svg>
                                    <h1 className="text-xl font-bold">Gurpinder's Prep Tracker</h1>
                                </div>
                                <nav className="flex items-center space-x-1">
                                    {navItems.map(item => (
                                        <button key={item.id} onClick={() => setCurrentView(item.id as AppView)} title={item.name} className={`flex items-center gap-1 px-2 py-2 text-sm font-semibold rounded-lg relative overflow-hidden group transition-colors duration-200 ${currentView === item.id ? 'text-primary' : 'text-text-secondary hover:text-primary hover:bg-accent'}`}>
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                            <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 ease-out ${currentView === item.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                                        </button>
                                    ))}
                                </nav>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-text-secondary hover:bg-accent hover:text-primary">
                                        <Cog6ToothIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={handleLogout} title="Logout" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-text-secondary hover:bg-accent hover:text-primary">
                                        <ArrowRightOnRectangleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                        {renderView()}
                        <footer className="text-center text-sm text-text-secondary py-4 mt-8 no-print">
                            Made with love ❤️ for you by{' '}
                            <span className="font-bold bg-gradient-to-r from-primary to-primary-light text-white px-3 py-1 rounded-lg inline-block">
                                Gurpinder : The Genius ⭐
                            </span>
                        </footer>
                    </main>
                </div>
            </div>
             {/* --- Mobile Bottom Navigation --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-accent flex justify-around z-40">
                {mobileNavItems.map(item => (
                    <button key={item.id} onClick={() => setCurrentView(item.id as AppView)} className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${currentView === item.id ? 'text-primary' : 'text-text-secondary hover:bg-accent'}`}>
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs mt-1">{item.name}</span>
                    </button>
                ))}
            </nav>
        </UserContext.Provider>
    );
};

export default App;