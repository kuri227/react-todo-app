import React from 'react';
import type { Todo } from "./types";

type Props = {
    todo: Todo;
    updateIsDone: (id: string, value: boolean) => void;
    remove: (id: string) => void;
    formatPriorities: (priority: number) => string;
    formatDeadline: (deadline: Date | null) => string;
};

const TodoItem = (props: Props) => {
    const todo = props.todo;
    return (
    <div className="flex items-center justify-between">
      <div className="flex items-center p-3 rounded-xl shadow-md bg-white grow">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={(e) => props.updateIsDone(todo.id, e.target.checked)}
          className="mr-1.5 cursor-pointer"
        />
        <div className="font-bold">
            {todo.name}
        </div>
        <div className="text-amber-300 px-2">
            {props.formatPriorities(todo.priority)}
        </div>
        <div>
            {props.formatDeadline(todo.deadline)}
        </div>
      <button
        onClick={() => props.remove(todo.id)}
        className="rounded-md bg-slate-200 px-2 py-1 text-sm font-bold text-white hover:bg-red-500 ml-auto"
      >
        削除
      </button>
      </div>
    </div>
  );
};

export default TodoItem;
