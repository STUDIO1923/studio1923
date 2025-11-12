import React, { useState, useEffect, useCallback } from 'react';
import { UpdatePost } from '../types';
import * as updateService from '../services/updateService';

interface NewsViewProps {
  isAdmin: boolean;
}

const PostEditor: React.FC<{
  post?: UpdatePost | null;
  onSave: (post: UpdatePost) => void;
  onCancel: () => void;
}> = ({ post, onSave, onCancel }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }
    onSave({
      id: post?.id || `post-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      timestamp: post?.timestamp || Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-2xl relative">
        <h3 className="text-xl font-bold text-white mb-4">{post ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">หัวข้อ</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">เนื้อหา</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <button type="button" onClick={onCancel} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">
            ยกเลิก
          </button>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
            บันทึก
          </button>
        </div>
      </form>
    </div>
  );
};

const NewsView: React.FC<NewsViewProps> = ({ isAdmin }) => {
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<UpdatePost | null | 'new'>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await updateService.getPosts();
      setPosts(fetchedPosts);
      if (!isAdmin && fetchedPosts.length > 0 && !expandedPostId) {
        setExpandedPostId(fetchedPosts[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, expandedPostId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSavePost = async (post: UpdatePost) => {
    await updateService.savePost(post);
    setEditingPost(null);
    fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) {
      await updateService.deletePost(postId);
      fetchPosts();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderContent = () => {
    if (isLoading) {
        return <p className="text-center text-slate-400 py-16">กำลังโหลดข่าวสาร...</p>;
    }

    if (posts.length === 0) {
        return <p className="text-center text-slate-500 py-16">{isAdmin ? 'ยังไม่มีประกาศใดๆ' : 'ยังไม่มีข่าวสารหรืออัปเดตในขณะนี้'}</p>
    }

    if (isAdmin) {
        return (
             <div className="space-y-4">
                {posts.map((post) => (
                <div key={post.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-white">{post.title}</h3>
                        <p className="text-xs text-slate-400">{formatDate(post.timestamp)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingPost(post)} className="text-blue-400 hover:text-blue-300">แก้ไข</button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-300">ลบ</button>
                    </div>
                    </div>
                    <p className="text-slate-300 mt-2 whitespace-pre-wrap">{post.content.substring(0, 150)}...</p>
                </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <button
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="w-full p-4 text-left"
                >
                    <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl text-white">{post.title}</h3>
                    <span className={`transform transition-transform ${expandedPostId === post.id ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(post.timestamp)}</p>
                </button>
                {expandedPostId === post.id && (
                    <div className="p-4 pt-0">
                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
                    </div>
                    </div>
                )}
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-4xl mx-auto">
      {editingPost && (
        <PostEditor
          post={editingPost === 'new' ? null : editingPost}
          onSave={handleSavePost}
          onCancel={() => setEditingPost(null)}
        />
      )}

      {isAdmin && (
        <div className="flex justify-end mb-6">
            <button onClick={() => setEditingPost('new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
            + สร้างประกาศใหม่
            </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default NewsView;