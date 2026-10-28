import React, { useState } from 'react';
import { Users, MessageSquare, ThumbsUp, Share2, Sparkles, Sprout, Calendar, Newspaper, Plus } from 'lucide-react';
import { User } from '../types';

interface CommunityPageProps {
  user: User | null;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ user }) => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Ramesh Patel',
      role: 'Soybean Cultivator (Indore)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      time: '2 hours ago',
      title: 'Has anyone tried mixing Organic Neem Soap with Quadris for Septoria?',
      content: 'I have 8 acres under V4 growth stage. Noticed small brown spots. Want to check if combining organic copper with strobilurin gives longer protection.',
      likes: 14,
      comments: 6
    },
    {
      id: 2,
      author: 'Dr. Ananya Sharma',
      role: 'Senior Phytopathologist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      time: '5 hours ago',
      title: 'Alert: High Humidity Advisory for Central Soybean Belt',
      content: 'Relative humidity will exceed 80% over the next 48 hours. Inspect lower canopies twice daily for early signs of Asian Soybean Rust pustules.',
      likes: 42,
      comments: 18
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    setPosts([
      {
        id: Date.now(),
        author: user?.name || 'Rajesh Kumar',
        role: 'Soybean Farmer',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        time: 'Just now',
        title: newTitle,
        content: newContent,
        likes: 0,
        comments: 0
      },
      ...posts
    ]);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 mb-2">
            <Users className="w-4 h-4" />
            <span>Peer-to-Peer Agronomy Network</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Farmer Community & News
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share field experience, discuss disease management protocols, and read official ICAR announcements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Community Forum Feed */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Create Post Box */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Ask Community or Share Advice</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Question title or topic..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                rows={2}
                required
                placeholder="Describe your field conditions, crop stage, or question..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all">
                Publish Discussion Post
              </button>
            </form>
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-emerald-500/40" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{post.author}</h4>
                    <p className="text-[10px] text-slate-400">{post.role} • {post.time}</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">{post.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{post.content}</p>

                <div className="flex items-center space-x-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  <button className="flex items-center space-x-1.5 hover:text-emerald-500">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.likes} Likes</span>
                  </button>
                  <button className="flex items-center space-x-1.5 hover:text-emerald-500">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments} Comments</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Agricultural News Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Newspaper className="w-4 h-4 text-emerald-500" />
              <span>Latest Crop News & Bulletins</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase">ICAR Advisory</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">New High-Yield Rust-Resistant Soybean Seed Cultivars Released</p>
                <p className="text-[10px] text-slate-400">Yesterday</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Market Price</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">Soybean Mandi Prices Rise by 4.5% Across Central Belts</p>
                <p className="text-[10px] text-slate-400">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
