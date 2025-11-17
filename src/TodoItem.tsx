// fileName: TodoItem.tsx
import type { LinkItem } from "./types";
import type { Todo } from "./types";
import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// ★ 必要なアイコンをすべてインポート
import { faPlus, faTrashAlt, faGripVertical, faListCheck, faLink } from "@fortawesome/free-solid-svg-icons"; 
import { twMerge } from 'tailwind-merge'; 
import dayjs from 'dayjs';
import { Draggable, Droppable } from "@hello-pangea/dnd";
import DatePicker from "react-datepicker";

// --- Props定義 ---
type Props = {
    todo: Todo;
    index: number;
    updateIsDone: (id: string, value: boolean) => void;
    remove: (id: string) => void;
    formatPriorities: (priority: number) => string;
    formatDeadline: (deadline: Date | null) => string;

    isExpanded: boolean;
    onEditClick: (id: string | null) => void;

    // サブタスク操作用
    addSubTodo: (parentId: string, name: string, deadline: Date|null, isAllDay: boolean) => void;
    updateSubTodoIsDone: (parentID: string, subId: string, value: boolean) => void;
    removeSubTodo: (parentId: string, subId: string) => void;
    
    // ★ リンク操作用
    addLink: (todoId: string, description: string, url: string) => void;
    removeLink: (todoId: string, linkId: string) => void;
};

// --- SubTodoItem コンポーネント ---
// サブタスク項目をレンダリングするコンポーネント (警告表示とD&D対応)
const SubTodoItem = (props: { todo: Todo, parentId: string, updateIsDone: Props['updateSubTodoIsDone'], remove: Props['removeSubTodo'], index: number }) => {

    const now = dayjs();
    // 完了していない、かつ期限切れの場合に警告
    const isExpired = props.todo.deadline ? now.isAfter(dayjs(props.todo.deadline)) && !props.todo.isDone : false; 
    
    // サブタスク専用の期日表示フォーマット
    const formatSubDeadline = (deadline: Date | null, isAllDay?: boolean) => {
        if (!deadline) return "";
        const format = props.todo.isAllDay ? "MM/DD(終日)" : "MM/DD HH:mm";
        return dayjs(deadline).format(format);
    };
    
    return (
        <Draggable draggableId={props.todo.id} index={props.index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    // ★ 期限切れ警告の背景色
                    className={twMerge("flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0", 
                                     isExpired && "bg-red-100/50")} 
                >
                    {/* ▼▼ サブタスク用の掴む場所 (ドラッグハンドル) */}
                    <div 
                        className="mr-2 text-gray-400 cursor-grab hover:text-gray-600 p-1 -ml-1.5"
                        {...provided.dragHandleProps} // ★ 掴む場所はここに限定
                    >
                        <FontAwesomeIcon icon={faGripVertical} size="xs" />
                    </div>
                    {/* ▲▲ 修正完了 */}

                    <div className="flex items-center grow">
                        <input
                            type="checkbox"
                            checked={props.todo.isDone}
                            onChange={(e) => props.updateIsDone(props.parentId, props.todo.id, e.target.checked)}
                            className="mr-2 cursor-pointer"
                        />
                        {/* ★ 並び替え後の連番を表示 */}
                        <span className="text-gray-400 mr-2 text-sm">#{props.index + 1}</span>
                        
                        {/* ★ 期限切れ警告の文字色と太字 */}
                        <span className={twMerge(props.todo.isDone ? "line-through text-gray-500" : "font-medium text-sm text-gray-800",
                                               isExpired && "text-red-700 font-bold")}>
                            {props.todo.name}
                        </span>
                        
                        {/* ★ 期日表示と警告アイコン */}
                        {props.todo.deadline && (
                            <span className={twMerge("ml-auto text-xs font-medium mr-2", 
                                                    isExpired ? "text-red-600" : "text-indigo-500")}>
                                {isExpired && '❗️'} {formatSubDeadline(props.todo.deadline, props.todo.isAllDay)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => props.remove(props.parentId, props.todo.id)}
                        className="ml-2 text-red-400 hover:text-red-600 text-xs p-1"
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                </div>
            )}
        </Draggable>
    );
};


// --- TodoItem コンポーネント (メイン) ---
const TodoItem = (props: Props) => {
    const todo = props.todo;
    const [newSubTodoName, setNewSubTodoName] = useState("");
    const [newSubTodoDeadline, setNewSubTodoDeadline] = useState<Date | null>(null);
    const [newSubTodoIsAllDay, setNewSubTodoIsAllDay] = useState(false);
    
    // ★ リンク操作用 State
    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [newLinkDescription, setNewLinkDescription] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    // 1. エラー対策のための安全なサブタスク配列
    const safeSubTodos = (todo.subTodos || []).filter(Boolean) as (Todo | null)[]; 

    const totalSubtasks = safeSubTodos.length;
    const completedSubtasks = safeSubTodos.filter(sub => sub && sub.isDone).length;

    const handleAddSubTodo = () => {
        if (newSubTodoName.trim() === "") return;
        
        props.addSubTodo(
            todo.id, 
            newSubTodoName.trim(), 
            newSubTodoDeadline, 
            newSubTodoIsAllDay
        );
        
        setNewSubTodoName("");
        setNewSubTodoDeadline(null);
        setNewSubTodoIsAllDay(false);
    }
    
    // ★ リンク操作ロジック
    const handleAddLink = () => {
        if (newLinkDescription.trim() === '' || newLinkUrl.trim() === '') return;
        props.addLink(todo.id, newLinkDescription.trim(), newLinkUrl.trim());
        setNewLinkDescription('');
        setNewLinkUrl('');
    };
    
    // サブタスク展開ボタンを押したら、リンク展開を閉じる
    const handleSubtaskExpand = () => {
        setIsLinkOpen(false);
        props.onEditClick(todo.id); 
    };
    
    // リンク展開ボタンを押したら、サブタスク展開を閉じ、リンクを展開
    const handleLinkExpand = () => {
        if (!props.isExpanded && !isLinkOpen) {
            // どちらも閉じていたら、両方開くために onEditClick を叩き、リンクを開く
            props.onEditClick(todo.id);
            setIsLinkOpen(true);
        } else if (props.isExpanded && !isLinkOpen) {
            // サブタスクが開いている状態でリンクを開く
            setIsLinkOpen(true);
        } else {
            // リンクが開いている状態なら閉じる
            setIsLinkOpen(false);
            props.onEditClick(null); // メインタスクも閉じる (TodoList.tsxの expandedId を null にするため)
        }
    };


    const now = dayjs();
    // メインタスクの期限切れ判定 (完了していない、かつ期限切れ)
    const isMainExpired = todo.deadline ? now.isAfter(dayjs(todo.deadline)) && !todo.isDone : false;

    // ▼▼ サブタスクのソートロジック (期限切れ > 期限内近い順 > 期限なし)
    const sortSubTodos = (subTodos: (Todo | null)[]): (Todo | null)[] => {
        const sorted = [...subTodos] as Todo[]; 

        sorted.sort((a, b) => {
            const aExpired = a.deadline ? now.isAfter(dayjs(a.deadline)) && !a.isDone : false;
            const bExpired = b.deadline ? now.isAfter(dayjs(b.deadline)) && !b.isDone : false;
            
            // 優先度 1: 期限なしは最後尾
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            
            const aTime = dayjs(a.deadline).valueOf();
            const bTime = dayjs(b.deadline).valueOf();

            // 優先度 2: 期限切れ (最も古いものを先頭に)
            if (aExpired && bExpired) {
                return aTime - bTime;
            }
            if (aExpired) {
                return -1;
            }
            if (bExpired) {
                return 1;
            }

            // 優先度 3: 両方期限内 -> 近い順
            return aTime - bTime;
        });
        
        return sorted;
    };
    
    const sortedSubTodos = sortSubTodos(safeSubTodos);
    // ▲▲ ソートロジック完了

    // メインタスクのクラス設定
    const mainItemClasses = twMerge(
        "flex items-center p-3 rounded-md shadow-sm bg-white grow transition-all", 
        todo.isDone && "opacity-70",
        props.isExpanded && "rounded-b-none border-b-0 shadow-none",
        isMainExpired && "bg-red-200/50" // ★ メインタスクも期限切れなら薄い赤に
    );
    
    return (
    <Draggable draggableId={todo.id} index={props.index}>
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className="flex flex-col space-y-0 border border-gray-200 rounded-md mb-1" 
            >
                {/* === 1. 親タスクの表示エリア === */}
                <div className="flex items-start justify-between">
                <div className={mainItemClasses}>
                    {/* ▼▼ 掴む場所 (ドラッグハンドル) */}
                    <div className="mr-2 text-gray-400 cursor-grab hover:text-gray-600 p-1 -ml-1.5"
                    {...provided.dragHandleProps}
                    >
                        <FontAwesomeIcon icon={faGripVertical} />
                    </div>

                    <input
                    type="checkbox"
                    checked={todo.isDone}
                    onChange={(e) => props.updateIsDone(todo.id, e.target.checked)}
                    className="mr-1.5 cursor-pointer"
                    />
                    
                    {/* ★ 期限切れ警告の文字色とアイコン */}
                    <div className={twMerge("font-bold", isMainExpired && "text-red-700 font-extrabold")}>
                        {isMainExpired && '🚨 '} {todo.name}
                    </div>
                    
                    <div className="text-amber-300 px-2">
                        {props.formatPriorities(todo.priority)}
                    </div>
                    <div className="text-sm text-gray-500 ml-2">
                        {totalSubtasks > 0 && ` (${completedSubtasks}/${totalSubtasks})`}
                    </div>
                    
                    {/* ★ 期限表示と警告 */}
                    <div className={twMerge("ml-auto mr-2", isMainExpired ? "text-red-600 font-extrabold" : "text-gray-500")}>
                        {props.formatDeadline(todo.deadline)}
                    </div>

                    {/* ★★★ サブタスク/リンクボタンのエリア ★★★ */}
                    
                    {/* 1. サブタスク展開ボタン (リストアイコン) */}
                    <button
                        onClick={handleSubtaskExpand}
                        className={twMerge("rounded-md p-2 mr-1 transition-colors", 
                            props.isExpanded && !isLinkOpen ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600")}
                    >
                        <FontAwesomeIcon icon={faListCheck} size='sm' />
                    </button>

                    {/* 2. リンク展開ボタン */}
                    <button
                        onClick={handleLinkExpand}
                        className={twMerge("rounded-md p-2 mr-2 transition-colors", 
                            isLinkOpen ? "bg-pink-600 text-white" : "bg-pink-500 text-white hover:bg-pink-600")}
                    >
                        <FontAwesomeIcon icon={faLink} size='sm' />
                    </button>
            
                    <button
                    onClick={() => props.remove(todo.id)}
                    className="rounded-md bg-slate-200 px-2 py-1 text-sm font-bold text-gray-700 hover:bg-red-500 hover:text-white"
                    >
                    削除
                    </button>
                </div>
                </div>
        
                {/* === 2. サブタスクのインライン展開エリア === */}
                {props.isExpanded && !isLinkOpen && (
                    <div className='ml-0 pl-3 pb-3 pt-1 border-t border-gray-200 bg-gray-50 rounded-b-md'>
                        <h3 className='font-bold text-gray-700 pt-2 mb-2'>ステップ一覧</h3>
                        
                        {/* ▼▼ サブタスクの Droppable エリア */}
                        <Droppable droppableId={`subtask-${todo.id}`}>
                            {(provided) => (
                                <div 
                                    className='space-y-1 pr-3'
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {/* 2-1. サブタスク一覧 (ソート済みの配列を使用) */}
                                    {sortedSubTodos.length > 0 ? (
                                        sortedSubTodos.map((sub, index) => ( 
                                            sub && <SubTodoItem 
                                                key={sub.id} 
                                                todo={sub} 
                                                parentId={todo.id}
                                                updateIsDone={props.updateSubTodoIsDone}
                                                remove={props.removeSubTodo}
                                                index={index} // ★ ソート後の連番に使用
                                            />
                                        ))
                                    ) : (
                                        <div className='text-sm text-gray-500 py-2'>タスクを細分化して最初の一歩を軽くしましょう！</div>
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* 2-2. サブタスク追加フォーム */}
                        <div className='flex flex-col space-y-2 mt-3 pr-3'> 
                            <div className='flex items-center gap-x-3'>
                                <span className="font-bold text-sm text-gray-700">期限:</span>
                                <DatePicker
                                    selected={newSubTodoDeadline}
                                    onChange={(date: Date | null) => setNewSubTodoDeadline(date)}
                                    showTimeSelect={!newSubTodoIsAllDay}
                                    timeFormat="HH:mm"
                                    dateFormat={newSubTodoIsAllDay ? "yyyy/MM/dd" : "yyyy/MM/dd HH:mm"}
                                    timeIntervals={30}
                                    isClearable
                                    placeholderText="日付を設定"
                                    className="rounded-md border border-gray-400 px-2 py-0.5 text-sm text-gray-400"
                                />
                                <label className="flex items-center space-x-1 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={newSubTodoIsAllDay}
                                        onChange={(e) => setNewSubTodoIsAllDay(e.target.checked)}
                                    />
                                    <span>終日</span>
                                </label>
                            </div>

                            <div className='flex items-center'>
                                <input
                                    type="text"
                                    placeholder="ステップ名を入力 (Enterで確定)"
                                    value={newSubTodoName}
                                    onChange={(e) => setNewSubTodoName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddSubTodo();
                                        }
                                    }}
                                    className="grow rounded-md border p-1 text-sm border-gray-300 text-gray-400"
                                />
                                <button
                                    onClick={handleAddSubTodo}
                                    className="ml-2 rounded-md bg-green-500 px-3 py-1 text-sm font-bold text-white hover:bg-green-600"
                                >
                                    追加
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* === 3. リンク展開エリア (isLinkOpen で制御) === */}
                {props.isExpanded && isLinkOpen && ( 
                    <div className='ml-0 pl-3 pb-3 pt-1 border-t border-gray-200 bg-gray-50 rounded-b-md'>
                        <h3 className='font-bold text-gray-700 pt-2 mb-2'>🔗 参考資料リスト</h3>

                        {/* リンク一覧の表示 */}
                        <div className='space-y-2 pr-3 mb-4'>
                            {(todo.links && todo.links.length > 0) ? (
                                todo.links.map(link => (
                                    <div key={link.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm border border-gray-200">
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-sm text-blue-600 hover:underline truncate mr-2"
                                            title={link.url}
                                        >
                                            {link.description}
                                        </a>
                                        <button 
                                            onClick={() => props.removeLink(todo.id, link.id)}
                                            className="text-red-400 hover:text-red-600 text-xs p-1 flex-shrink-0"
                                        >
                                            削除
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-gray-500 py-2'>必要な情報源を登録しましょう。</div>
                            )}
                        </div>

                        {/* リンク追加フォーム */}
                        <div className='flex flex-col space-y-2 pr-3'>
                            <input
                                type="text"
                                placeholder="説明 (例: GitHubリポジトリ)"
                                value={newLinkDescription}
                                onChange={(e) => setNewLinkDescription(e.target.value)}
                                className="rounded-md border p-1 text-sm border-gray-300 text-gray-400"
                            />
                            <div className='flex items-center'>
                                <input
                                    type="url"
                                    placeholder="URL (http/httpsから)"
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    className="grow rounded-md border p-1 text-sm border-gray-300 text-gray-400"
                                />
                                <button
                                    onClick={handleAddLink}
                                    className="ml-2 rounded-md bg-pink-500 px-3 py-1 text-sm font-bold text-white hover:bg-pink-600"
                                >
                                    追加
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </Draggable>
    );
};

export default TodoItem;