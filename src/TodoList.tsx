import type { Todo } from "./types";
import type { LinkItem } from "./types";
import dayjs from 'dayjs';
import TodoItem from "./TodoItem";
import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd'; 

type Props = {
    todos: Todo[];
    updateIsDone: (id: string, value: boolean) => void;
    remove: (id: string) => void;

    addSubTodo: (parentId: string, name: string, deadline: Date|null, isAllDay: boolean) => void;
    updateSubTodoIsDone: (parentId: string, subId: string, value: boolean) => void;
    removeSubTodo: (parentId: string, subId: string) => void;

    addLink: (todoId: string, description: string, url: string) => void;
    removeLink: (todoId: string, linkId: string) => void;
} 

const dtFmt = "YYYY/MM/DD HH:mm";
    

const TodoList = (props: Props) => {
    const todos = props.todos;
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string | null) => {
        setExpandedId(id === expandedId ? null : id)
    }

    if(todos.length === 0) {
        return(
            <div className='text-red-500'>
                現在、登録されているタスクはありません。
            </div>
        );
    };

    const formatPriorities = (priority: number): string => {
        return "★".repeat(4 - priority);
    };

    const formatDeadline = (deadline: Date | null) => {
        return deadline ? dayjs(deadline).format(dtFmt) : "";
    };


    return (
        // ▼▼ Droppable でラップする
        <Droppable droppableId="main-todo-list">
            {(provided) => (
                <div 
                    className="space-y-1"
                    ref={provided.innerRef} // D&DライブラリにDOM要素を教える
                    {...provided.droppableProps} // 必要なプロパティを展開
                >
                  {todos.map((todo, index) => ( // ▼▼ index を受け取る
                    <TodoItem 
                      key={todo.id}
                      index={index} // ▼▼ index を渡す (必須)
                      todo={todo}
                      remove={props.remove}
                      updateIsDone={props.updateIsDone}
                      formatPriorities={formatPriorities}
                      formatDeadline={formatDeadline}

                      isExpanded={todo.id === expandedId}
                      onEditClick={toggleExpand}

                      addSubTodo={props.addSubTodo}
                      updateSubTodoIsDone={props.updateSubTodoIsDone}
                      removeSubTodo={props.removeSubTodo}

                      addLink={props.addLink}
                      removeLink={props.removeLink}
                    />
                  ))}
                  {/* ▼▼ D&D時のプレースホルダー (スペース確保用) */}
                  {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default TodoList