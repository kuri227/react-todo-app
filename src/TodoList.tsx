import React from 'react';
import type { Todo } from "./types";
import dayjs from 'dayjs';
import TodoItem from "./TodoItem";

type Props = {
    todos: Todo[];
    updateIsDone: (id: string, value: boolean) => void;
    remove: (id: string) => void;
} 

const dtFmt = "YYYY/MM/DD HH:mm";
    

const TodoList = (props: Props) => {
    const todos = props.todos;

    if(todos.length === 0) {
        return(
            <div className='text-red-500'>
                現在、登録されているタスクはありません。
            </div>
        );
    };

    // const sortedtodos = [...todos].sort((a,b) => {
    //     if(a.isDone !== b.isDone){
    //         return a.isDone ? 1 : -1;
    //     } else {
    //         return a.deadline.getTime() - b.deadline.getTime();
    //     }
    // });

    const formatPriorities = (priority: number): string => {
        return "★".repeat(4 - priority);
    };

    const formatDeadline = (deadline: Date | null) => {
        return deadline ? dayjs(deadline).format(dtFmt) : "";
    };


    return (
        <div className="space-y-1">
          {todos.map((todo) => (
            <TodoItem 
              key={todo.id}
              todo={todo}
              remove={props.remove}
              updateIsDone={props.updateIsDone}
              formatPriorities={formatPriorities}
              formatDeadline={formatDeadline}
            />
          ))}
        </div>
    );
};

export default TodoList