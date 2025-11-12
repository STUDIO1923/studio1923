import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User } from '../types';
import * as userService from '../services/userService';
import * as auditService from '../services/auditService';
import { UserIcon } from './icons/UserIcon';
import { AdminIcon } from './icons/AdminIcon';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { BanIcon } from './icons/BanIcon';
import { WarningIcon } from './icons/WarningIcon';
import { VillainIcon } from './icons/VillainIcon';

interface ManageUsersViewProps {
  onBack: () => void;
}

const SortIcon: React.FC<{ direction: 'ascending' | 'descending' | 'none' }> = ({ direction }) => {
    const iconStyle = "w-4 h-4 transition-opacity";
    if (direction === 'none') return <svg className={`${iconStyle} text-slate-500 opacity-30`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
    if (direction === 'ascending') return <svg className={`${iconStyle} text-indigo-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
    return <svg className={`${iconStyle} text-indigo-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
};

const UserFormModal: React.FC<{
    mode: 'add' | 'edit';
    user?: User | null;
    onClose: () => void;
    onSave: (user: User) => void;
}> = ({ mode, user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nickname: user?.nickname || '',
        email: user?.email || '',
        password: '',
        isAdmin: user?.isAdmin || false,
        coins: user?.coins || 0,
        points: user?.points || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nickname || !formData.email) {
            alert("กรุณากรอกชื่อเล่นและอีเมล");
            return;
        }
        if (mode === 'add' && !formData.password) {
            alert("กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่");
            return;
        }

        const userToSave: User = {
            ...user,
            id: user?.id || `user-${Date.now()}`,
            nickname: formData.nickname,
            email: formData.email,
            isAdmin: formData.isAdmin,
            coins: Number(formData.coins) || 0,
            points: Number(formData.points) || 0,
            password: formData.password || user?.password,
            status: user?.status || 'Active',
            lastLogin: user?.lastLogin || Date.now(),
            ipAddress: user?.ipAddress || '127.0.0.1',
        };
        onSave(userToSave);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">{mode === 'add' ? 'เพิ่มผู้ใช้ใหม่' : `แก้ไขผู้ใช้: ${user?.nickname}`}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="nickname" value={formData.nickname} onChange={handleChange} placeholder="ชื่อเล่น" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required />
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="อีเมล" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={mode === 'add' ? "รหัสผ่าน" : "รหัสผ่านใหม่ (ไม่บังคับ)"} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Coins</label>
                            <input name="coins" type="number" value={formData.coins} onChange={handleChange} placeholder="Coins" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Points</label>
                            <input name="points" type="number" value={formData.points} onChange={handleChange} placeholder="Points" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input id="isAdmin" name="isAdmin" type="checkbox" checked={formData.isAdmin} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-500 rounded bg-slate-700" />
                        <label htmlFor="isAdmin" className="ml-2 block text-sm text-slate-300">เป็นผู้ดูแลระบบ</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ManageUsersView: React.FC<ManageUsersViewProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' } | null>({ key: 'id', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState<{ mode: 'add' | 'edit'; user?: User | null } | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [suspiciousUsers, setSuspiciousUsers] = useState<Set<string>>(new Set());
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);
  const USERS_PER_PAGE = 5;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        await userService.initializeUsers(); // Ensure initial users exist
        const [fetchedUsers, flaggedUsers] = await Promise.all([
            userService.getUsers(),
            auditService.getSuspiciousUsers()
        ]);
        setUsers(fetchedUsers);
        setSuspiciousUsers(flaggedUsers);
    } catch (error) {
        console.error("Failed to load user data:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
      loadData();
  }, [loadData]);

  const handleSaveUser = async (user: User) => {
    await userService.saveUser(user);
    setModalState(null);
    loadData();
  };
  
  const handleDeleteUser = async () => {
      if (!deletingUser) return;
      await userService.deleteUser(deletingUser.id);
      setDeletingUser(null);
      loadData();
  };

  const handleToggleBan = async (user: User) => {
      // FIX: Explicitly type `updatedUser` to prevent TypeScript from widening the `status` property to `string`.
      const updatedUser: User = { ...user, status: user.status === 'Active' ? 'Banned' : 'Active' };
      await userService.saveUser(updatedUser);
      loadData();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSuspicion = !showOnlySuspicious || suspiciousUsers.has(user.nickname);
      return matchesSearch && matchesSuspicion;
    });
  }, [users, searchTerm, showOnlySuspicious, suspiciousUsers]);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'string' && typeof bValue === 'string') return aValue.localeCompare(bValue) * (sortConfig.direction === 'ascending' ? 1 : -1);
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => sortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE), [sortedUsers, currentPage]);

  const requestSort = (key: keyof User) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString('th-TH');

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-7xl mx-auto">
        {modalState && <UserFormModal mode={modalState.mode} user={modalState.user} onClose={() => setModalState(null)} onSave={handleSaveUser} />}
        {deletingUser && (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                 <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-md relative">
                     <h3 className="text-xl font-bold text-white mb-4">ยืนยันการลบ</h3>
                     <p className="text-slate-300 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <span className="font-bold text-white">"{deletingUser.nickname}"</span>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                     <div className="flex justify-end gap-3">
                        <button onClick={() => setDeletingUser(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                        <button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">ยืนยันการลบ</button>
                     </div>
                 </div>
             </div>
        )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-white tracking-wide">จัดการผู้ใช้งาน</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <input type="text" placeholder="ค้นหาผู้ใช้..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
          <div className="flex items-center">
            <input id="show-suspicious" type="checkbox" checked={showOnlySuspicious} onChange={e => setShowOnlySuspicious(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-500 rounded bg-slate-700" />
            <label htmlFor="show-suspicious" className="ml-2 text-sm text-slate-300">แสดงเฉพาะผู้ใช้ที่น่าสงสัย</label>
          </div>
          <button onClick={() => setModalState({ mode: 'add' })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md whitespace-nowrap">+ เพิ่มผู้ใช้ใหม่</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('nickname')}>ผู้ใช้ <SortIcon direction={sortConfig?.key === 'nickname' ? sortConfig.direction : 'none'} /></th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>สถานะ <SortIcon direction={sortConfig?.key === 'status' ? sortConfig.direction : 'none'} /></th>
              <th scope="col" className="px-6 py-3">พฤติกรรม</th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('lastLogin')}>เข้าสู่ระบบล่าสุด <SortIcon direction={sortConfig?.key === 'lastLogin' ? sortConfig.direction : 'none'} /></th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => requestSort('coins')}>Coins <SortIcon direction={sortConfig?.key === 'coins' ? sortConfig.direction : 'none'} /></th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => requestSort('points')}>Points <SortIcon direction={sortConfig?.key === 'points' ? sortConfig.direction : 'none'} /></th>
              <th scope="col" className="px-6 py-3 text-center">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">กำลังโหลดข้อมูลผู้ใช้...</td></tr>
            ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-500">ไม่พบผู้ใช้ที่ตรงกับการค้นหา</td></tr>
            ) : (
              paginatedUsers.map(user => {
                const isSuspicious = suspiciousUsers.has(user.nickname);
                return (
                  <tr key={user.id} className={`border-b border-slate-700 transition-colors ${isSuspicious ? 'bg-red-900/20 hover:bg-red-900/40' : 'bg-slate-800/60 hover:bg-slate-800/80'}`}>
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.isAdmin 
                            ? <AdminIcon className="w-6 h-6 text-yellow-400 flex-shrink-0" /> 
                            : user.icon === 'villain'
                                ? <VillainIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
                                : <UserIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />}
                        <div><div>{user.nickname}</div><div className="text-xs text-slate-400">{user.email}</div></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{user.status === 'Active' ? 'ใช้งาน' : 'ถูกระงับ'}</span></td>
                    <td className="px-6 py-4">
                        {isSuspicious && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-300" title="ตรวจพบพฤติกรรมที่น่าสงสัย">
                                <WarningIcon className="w-4 h-4" />
                                น่าสงสัย
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(user.lastLogin)}</td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><CoinIcon className="w-4 h-4 text-yellow-400"/><span>{user.coins.toLocaleString()}</span></div></td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><PointIcon className="w-4 h-4 text-cyan-400"/><span>{user.points.toLocaleString()}</span></div></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button onClick={() => setModalState({ mode: 'edit', user })} title="แก้ไข"><EditIcon className="w-5 h-5 text-blue-400 hover:text-blue-300"/></button>
                        <button onClick={() => handleToggleBan(user)} title={user.status === 'Active' ? "ระงับ" : "ยกเลิกระงับ"}><BanIcon className={`w-5 h-5 ${user.status === 'Active' ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}/></button>
                        <button onClick={() => setDeletingUser(user)} title="ลบ"><TrashIcon className="w-5 h-5 text-red-400 hover:text-red-300"/></button>
                      </div>
                    </td>
                  </tr>
                )
              }))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-slate-400">{sortedUsers.length > 0 ? `แสดง ${Math.min((currentPage - 1) * USERS_PER_PAGE + 1, sortedUsers.length)}-${Math.min(currentPage * USERS_PER_PAGE, sortedUsers.length)} จาก ${sortedUsers.length} คน` : 'ไม่พบผู้ใช้'}</span>
        {totalPages > 1 && (
             <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 text-sm">ก่อนหน้า</button>
                <span className="text-sm text-white font-semibold">หน้า {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 text-sm">ถัดไป</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersView;